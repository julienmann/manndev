#!/usr/bin/env node
/* Renders embed/process-film.html to the site's process film: MP4 (H.264),
   WebM (VP9) and a JPEG poster, 1920x1080 at 30 fps, frame by frame through
   the film's own __render()/__seek(t) hooks, so every frame is exact.

     node scripts/render-film.mjs        -> img/process-film.{mp4,webm}, img/process-film-poster.jpg
     node scripts/render-film.mjs fr     -> img/process-film-fr.* (renders the page with ?lang=fr)

   Needs Google Chrome and ffmpeg (brew install ffmpeg). No npm packages:
   Chrome is driven over the DevTools protocol with Node's built-in WebSocket.
   Set CHROME=/path/to/chrome to use another Chromium build.

   The three files are written to hidden temporary files in img/ and only moved
   over the live ones once all of them have been produced, so a failed or
   interrupted run leaves the published film untouched. */
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, renameSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LANG = process.argv[2] === 'fr' ? 'fr' : 'en';
const SUFFIX = LANG === 'fr' ? '-fr' : '';
const FPS = 30, DUR = 21, POSTER_T = 2.0;   // poster: the intro title card, fully revealed
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const OUT = ['-poster.jpg', '.mp4', '.webm'].map(ext => join(ROOT, `img/process-film${SUFFIX}${ext}`));
const TMP = OUT.map(f => join(dirname(f), `.tmp-${process.pid}-${basename(f)}`));   // same folder, so the final rename is atomic
const [POSTER, MP4, WEBM] = TMP;

const frames = mkdtempSync(join(tmpdir(), 'process-film-'));
const profile = mkdtempSync(join(tmpdir(), 'process-film-chrome-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1920,1080', 'about:blank'
], { stdio: ['ignore', 'ignore', 'pipe'] });

/* Stop Chrome and wait for it, so the profile folder is no longer in use when it's removed.
   Only wait on 'exit' while it hasn't fired yet: a Chrome that already quit (exit code) or
   died (signal), or never started (no pid), would leave nothing pending, and Node would quit
   on the unsettled top-level await without running the cleanup. */
const stopChrome = async () => {
  if (chrome.pid === undefined || chrome.exitCode !== null || chrome.signalCode !== null) return;
  const exited = new Promise(ok => chrome.once('exit', ok));
  chrome.kill();
  await exited;
};

try {
  /* Chrome prints its DevTools endpoint on stderr */
  const browserWs = await new Promise((ok, fail) => {
    let buf = '';
    chrome.stderr.on('data', d => { buf += d; const m = buf.match(/ws:\/\/\S+/); if (m) ok(m[0]); });
    chrome.on('error', e => fail(new Error(`Could not start Chrome at ${CHROME}: ${e.message}`)));
    chrome.on('exit', () => fail(new Error('Chrome exited before DevTools was ready')));
  });
  const { webSocketDebuggerUrl } = (await (await fetch(browserWs.replace(/^ws:\/\/([^/]+).*/, 'http://$1/json/list'))).json())
    .find(t => t.type === 'page');

  const ws = new WebSocket(webSocketDebuggerUrl);
  let id = 0, closed = null; const pending = new Map(); const waiters = [];
  /* if the DevTools socket drops (Chrome crashed or was killed), fail every call still
     waiting for a reply instead of hanging on one that will never come */
  const drop = why => {
    closed ??= new Error(`DevTools connection ${why} (did Chrome crash?)`);
    pending.forEach(({ fail }) => fail(closed)); pending.clear();
    waiters.forEach(w => w.fail(closed)); waiters.length = 0;
  };
  ws.addEventListener('error', () => drop('failed'));
  ws.addEventListener('close', () => drop('closed'));
  await new Promise((ok, fail) => {
    ws.addEventListener('open', ok, { once: true });
    ws.addEventListener('close', () => fail(closed), { once: true });
  });
  ws.addEventListener('message', e => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { ok, fail } = pending.get(msg.id); pending.delete(msg.id);
      msg.error ? fail(new Error(msg.error.message)) : ok(msg.result);
    } else if (msg.method) waiters.filter(w => w.method === msg.method).forEach(w => w.ok(msg.params));
  });
  const send = (method, params = {}) => closed ? Promise.reject(closed) : new Promise((ok, fail) => {
    pending.set(++id, { ok, fail }); ws.send(JSON.stringify({ id, method, params }));
  });
  const once = method => closed ? Promise.reject(closed) : new Promise((ok, fail) => waiters.push({ method, ok, fail }));
  const evaluate = async expression => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'page error');
    return r.result.value;
  };

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  const url = pathToFileURL(join(ROOT, 'embed/process-film.html')).href + (LANG === 'fr' ? '?lang=fr' : '');
  await Promise.all([once('Page.loadEventFired'), send('Page.navigate', { url })]);
  await evaluate('document.fonts.ready.then(() => new Promise(r => setTimeout(r, 300)))');
  if (!(await evaluate("document.fonts.check('500 40px Lora') && document.fonts.check('600 40px Figtree')")))
    throw new Error('Lora/Figtree did not load (the film pulls them from Google Fonts, so this needs a network connection)');
  await evaluate('__render()');

  const shot = async (t, path, format = 'png') => {
    await evaluate(`__seek(${t}); new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`);
    const { data } = await send('Page.captureScreenshot', { format, quality: format === 'jpeg' ? 88 : undefined, clip: { x: 0, y: 0, width: 1920, height: 1080, scale: 1 } });
    writeFileSync(path, Buffer.from(data, 'base64'));
  };

  const total = FPS * DUR;
  for (let i = 0; i < total; i++) {
    await shot(i / FPS, join(frames, `f${String(i).padStart(4, '0')}.png`));
    if (i % 30 === 0) process.stdout.write(`\rframes ${i}/${total}`);
  }
  process.stdout.write(`\rframes ${total}/${total}\n`);
  await shot(POSTER_T, POSTER, 'jpeg');
  ws.close();
  await stopChrome();

  const input = ['-y', '-v', 'error', '-framerate', String(FPS), '-i', join(frames, 'f%04d.png')];
  execFileSync('ffmpeg', [...input, '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'veryslow', '-tune', 'animation', '-crf', '24',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', MP4], { stdio: 'inherit' });
  execFileSync('ffmpeg', [...input, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '42', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2',
    '-pix_fmt', 'yuv420p', '-an', WEBM], { stdio: 'inherit' });

  /* all three made it: only now replace the live files (world-readable, whatever the umask) */
  TMP.forEach((f, i) => { chmodSync(f, 0o644); renameSync(f, OUT[i]); });
} finally {
  await stopChrome();
  for (const p of [frames, profile, ...TMP]) rmSync(p, { recursive: true, force: true });
}
console.log(`Built img/process-film${SUFFIX}.mp4, .webm and -poster.jpg`);
