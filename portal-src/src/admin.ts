import { unzipSync } from 'fflate';
import { escapeHtml, deriveClientKey, normalizeUsername, formatDate, setStatus, toHex, LOGINS_DIR, MIN_PASSWORD, type ClientInfo } from './session';

const DB_NAME = 'portal-admin';
const STORE_NAME = 'handles';
const DIR_HANDLE_KEY = 'client-files-dir';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

const pickFolderBtn = document.querySelector<HTMLButtonElement>('#pick-folder-btn')!;
const reconnectBtn = document.querySelector<HTMLButtonElement>('#reconnect-btn')!;
const folderNameEl = document.querySelector<HTMLSpanElement>('#folder-name')!;
const clientListEl = document.querySelector<HTMLDivElement>('#client-list')!;
const addForm = document.querySelector<HTMLFormElement>('#add-form')!;
const addUsernameInput = document.querySelector<HTMLInputElement>('#add-username')!;
const addPasswordInput = document.querySelector<HTMLInputElement>('#add-password')!;
const genPasswordBtn = document.querySelector<HTMLButtonElement>('#gen-password-btn')!;
const addNameInput = document.querySelector<HTMLInputElement>('#add-name')!;
const addFileInput = document.querySelector<HTMLInputElement>('#add-file')!;
const addSubmitBtn = document.querySelector<HTMLButtonElement>('#add-submit-btn')!;
const addSubmitLabel = document.querySelector<HTMLSpanElement>('#add-submit-label')!;
const addStatus = document.querySelector<HTMLParagraphElement>('#add-status')!;
const modeNote = document.querySelector<HTMLParagraphElement>('#mode-note')!;
const cancelModeBtn = document.querySelector<HTMLButtonElement>('#cancel-mode-btn')!;
const fieldWrap = {
  username: document.querySelector<HTMLDivElement>('#f-username')!,
  password: document.querySelector<HTMLDivElement>('#f-password')!,
  name: document.querySelector<HTMLDivElement>('#f-name')!,
  file: document.querySelector<HTMLDivElement>('#f-file')!,
};

let dirHandle: FileSystemDirectoryHandle | null = null;

// What the form is doing. Data folders have a permanent random id; logins are
// pointer files in _logins/ (see session.ts). 'update' replaces a client's
// files without touching the login; 'reset' replaces the login only.
type Mode =
  | { kind: 'create' }
  | { kind: 'update'; folder: string }
  | { kind: 'reset'; folder: string };
let mode: Mode = { kind: 'create' };

const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,31}$/;

const setAddStatus = (message: string, tone?: 'error' | 'success') => setStatus(addStatus, message, tone);

// A file of the live preview: its path inside preview/, split into segments.
type PreviewFile = { segments: string[]; data: Uint8Array<ArrayBuffer> };

const PREVIEW_DIR = 'preview';
const PREVIEW_STAGING = '.preview-new';   // a dot-folder, so nginx never serves a leftover

// Unzips a deliverable and returns the files for its live preview, or null if
// the zip doesn't look like a static site (no index.html at its root or in a
// single wrapping folder). Throws if an entry's name can't be written safely,
// before anything on disk has changed.
async function readPreview(zipFile: File): Promise<PreviewFile[] | null> {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(new Uint8Array(await zipFile.arrayBuffer()));
  } catch {
    return null;   // not a zip fflate can read: still delivered, just no preview
  }

  let files: PreviewFile[] = [];
  const invalid: string[] = [];
  for (const [name, data] of Object.entries(entries)) {
    const normalized = name.replace(/\\/g, '/');
    if (normalized.endsWith('/')) continue;   // a folder entry
    const segments = normalized.split('/').filter(segment => segment !== '' && segment !== '.');
    if (!segments.length) continue;
    if (segments.some(segment => segment === '..' || /[\u0000-\u001f]/.test(segment))) {
      invalid.push(name);
      continue;
    }
    // Dot-files and anything in a dot-folder (.git/config, .env…) never
    // belong in a public preview, nor does macOS zip cruft.
    if (segments.some(segment => segment.startsWith('.') || segment === '__MACOSX')) continue;
    files.push({ segments, data: data as Uint8Array<ArrayBuffer> });   // fflate never returns shared buffers
  }

  // macOS zip tools often wrap contents in a single top-level folder — unwrap
  // it so index.html ends up at the preview root regardless of how it was zipped.
  const hasIndex = () => files.some(file => file.segments.length === 1 && file.segments[0] === 'index.html');
  if (!hasIndex() && new Set(files.map(file => file.segments[0])).size === 1 && files.every(file => file.segments.length > 1)) {
    files = files.map(file => ({ ...file, segments: file.segments.slice(1) }));
  }

  if (!invalid.length && hasIndex()) {
    // A path that is both a file and a folder ("a" and "a/b") would fail half-way through writing.
    const filePaths = new Set(files.map(file => file.segments.join('/')));
    for (const file of files) {
      if (file.segments.slice(0, -1).some((_, i) => filePaths.has(file.segments.slice(0, i + 1).join('/')))) {
        invalid.push(file.segments.join('/'));
      }
    }
  }

  if (invalid.length) {
    const sample = invalid.slice(0, 3).map(name => `"${name}"`).join(', ');
    throw new Error(`Nothing was changed: this zip has file names that can't be unpacked safely (${sample}${invalid.length > 3 ? ', …' : ''}). Re-zip the files and try again.`);
  }
  return hasIndex() ? files : null;
}

async function writeTree(root: FileSystemDirectoryHandle, files: PreviewFile[]) {
  for (const file of files) {
    let dir = root;
    for (const part of file.segments.slice(0, -1)) {
      dir = await dir.getDirectoryHandle(part, { create: true });
    }
    await writeFile(dir, file.segments[file.segments.length - 1], file.data);
  }
}

// Replaces <client folder>/preview/ with `files` (or just removes it when the
// new zip has no site). The new preview is written to a staging folder and
// renamed into place, so a failed write leaves the old one untouched. Where
// the browser can't rename a local folder, it falls back to writing in place.
async function replacePreview(clientDir: FileSystemDirectoryHandle, files: PreviewFile[] | null) {
  if (!files) {
    await clientDir.removeEntry(PREVIEW_DIR, { recursive: true }).catch(() => {});
    return;
  }

  await clientDir.removeEntry(PREVIEW_STAGING, { recursive: true }).catch(() => {});
  const staging = await clientDir.getDirectoryHandle(PREVIEW_STAGING, { create: true });
  try {
    await writeTree(staging, files);
  } catch (err) {
    await clientDir.removeEntry(PREVIEW_STAGING, { recursive: true }).catch(() => {});
    throw err;
  }

  await clientDir.removeEntry(PREVIEW_DIR, { recursive: true }).catch(() => {});
  try {
    await staging.move(PREVIEW_DIR);
  } catch {
    await clientDir.removeEntry(PREVIEW_STAGING, { recursive: true }).catch(() => {});
    const previewDir = await clientDir.getDirectoryHandle(PREVIEW_DIR, { create: true });
    try {
      await writeTree(previewDir, files);
    } catch (err) {
      await clientDir.removeEntry(PREVIEW_DIR, { recursive: true }).catch(() => {});   // no half-written preview
      throw err;
    }
  }
}

async function readInfo(clientDir: FileSystemDirectoryHandle): Promise<ClientInfo | null> {
  try {
    const fileHandle = await clientDir.getFileHandle('info.json');
    const file = await fileHandle.getFile();
    return JSON.parse(await file.text());
  } catch {
    return null;
  }
}

// 12 characters from an alphabet without look-alikes (0/O, 1/l/I, 5/S…),
// grouped for reading aloud: e.g. "kq7m-Xw3t-9fRa". ~70 bits of entropy.
function generatePassword(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzACDEFGHJKLMNPQRTUVWXY2346789';
  const out: string[] = [];
  const buf = new Uint8Array(1);
  while (out.length < 12) {
    crypto.getRandomValues(buf);
    if (buf[0] < 256 - (256 % alphabet.length)) out.push(alphabet[buf[0] % alphabet.length]);
  }
  return [0, 4, 8].map(i => out.slice(i, i + 4).join('')).join('-');
}

async function writeFile(dir: FileSystemDirectoryHandle, name: string, data: FileSystemWriteChunkType) {
  const handle = await dir.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();
  await writable.write(data);
  await writable.close();
}

const writeInfo = (dir: FileSystemDirectoryHandle, info: ClientInfo) => writeFile(dir, 'info.json', JSON.stringify(info, null, 2));

async function loginsDir(): Promise<FileSystemDirectoryHandle> {
  return dirHandle!.getDirectoryHandle(LOGINS_DIR, { create: true });
}

async function writePointer(key: string, folder: string) {
  await writeFile(await loginsDir(), `${key}.json`, JSON.stringify({ id: folder }));
}

// key -> folder id, for every pointer file.
async function readPointers(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for await (const entry of (await loginsDir()).values()) {
    if (entry.kind !== 'file' || !entry.name.endsWith('.json')) continue;
    try {
      const data = JSON.parse(await (await (entry as FileSystemFileHandle).getFile()).text());
      if (typeof data?.id === 'string') map.set(entry.name.slice(0, -5), data.id);
    } catch {
      // ignore unreadable pointer
    }
  }
  return map;
}

// Removes every login that opens `folder`, except `keep`.
async function deletePointersFor(folder: string, keep?: string) {
  const dir = await loginsDir();
  for (const [key, id] of await readPointers()) {
    if (id === folder && key !== keep) await dir.removeEntry(`${key}.json`);
  }
}

type ClientEntry = { folder: string; info: ClientInfo; hasPreview: boolean; hasLogin: boolean };

async function listClients(): Promise<ClientEntry[]> {
  if (!dirHandle) return [];
  const loginFolders = new Set((await readPointers()).values());
  const clients: ClientEntry[] = [];
  for await (const entry of dirHandle.values()) {
    if (entry.kind !== 'directory' || entry.name === LOGINS_DIR || entry.name.startsWith('.')) continue;
    const clientDir = entry as FileSystemDirectoryHandle;
    const info = await readInfo(clientDir);
    if (!info) continue;
    const hasPreview = await clientDir.getDirectoryHandle(PREVIEW_DIR).then(() => true).catch(() => false);
    clients.push({ folder: entry.name, info, hasPreview, hasLogin: loginFolders.has(entry.name) });
  }
  return clients;
}

const describe = (info: ClientInfo) => `${info.name ?? 'client'} (${info.username ?? 'no username'})`;

async function refreshClientList() {
  const clients = await listClients();

  clientListEl.innerHTML = clients.length
    ? clients.map(c => {
        const changed = c.info.passwordChangedAt
          ? `<span class="admin-client-changed">Password changed by client · ${escapeHtml(formatDate(c.info.passwordChangedAt))}</span>`
          : '';
        const noLogin = c.hasLogin ? '' : '<span class="admin-client-changed">No login: use Reset password</span>';
        const folder = escapeHtml(c.folder);
        return `
          <div class="admin-client-row">
            <span class="admin-client-login">${escapeHtml(c.info.username ?? '—')}</span>
            <span class="admin-client-name">${escapeHtml(c.info.name ?? '—')}${changed}${noLogin}</span>
            <span class="admin-client-file">${escapeHtml(c.info.file)}${c.hasPreview ? ' · preview' : ''}</span>
            <span class="admin-client-actions">
              <button type="button" class="admin-remove-btn" data-action="update" data-folder="${folder}">Update file</button>
              <button type="button" class="admin-remove-btn" data-action="reset" data-folder="${folder}">Reset password</button>
              <button type="button" class="admin-remove-btn" data-action="remove" data-folder="${folder}">Remove</button>
            </span>
          </div>
        `;
      }).join('')
    : '<p class="admin-note">No clients yet.</p>';

  clientListEl.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(btn => {
    const folder = btn.dataset.folder!;
    const action = btn.dataset.action!;
    btn.addEventListener('click', () => {
      if (action === 'remove') removeClient(folder);
      else setMode({ kind: action as 'update' | 'reset', folder });
    });
  });
}

async function removeClient(folder: string) {
  if (!dirHandle) return;

  const info = await readInfo(await dirHandle.getDirectoryHandle(folder));
  const label = info ? describe(info) : folder;

  if (!confirm(`Remove ${label}? This deletes their login, zip, info, and preview from this folder. You'll still need to push the change to the server.`)) {
    return;
  }

  try {
    await deletePointersFor(folder);
    await dirHandle.removeEntry(folder, { recursive: true });
    if (mode.kind !== 'create' && mode.folder === folder) await setMode({ kind: 'create' });
    setAddStatus(`Removed ${label}.`, 'success');
    await refreshClientList();
  } catch (err) {
    setAddStatus(err instanceof Error ? err.message : 'Could not remove that client.', 'error');
  }
}

const SUBMIT_LABELS: Record<Mode['kind'], string> = {
  create: 'Save client',
  update: 'Update file',
  reset: 'Set new password',
};

async function setMode(next: Mode) {
  mode = next;
  const info = next.kind !== 'create' && dirHandle
    ? await readInfo(await dirHandle.getDirectoryHandle(next.folder))
    : null;
  const who = info?.name ?? 'this client';

  fieldWrap.username.hidden = next.kind === 'update';
  fieldWrap.password.hidden = next.kind === 'update';
  fieldWrap.name.hidden = next.kind === 'reset';
  fieldWrap.file.hidden = next.kind === 'reset';
  addUsernameInput.readOnly = next.kind === 'reset';
  cancelModeBtn.hidden = next.kind === 'create';
  modeNote.hidden = next.kind === 'create';
  addSubmitLabel.textContent = SUBMIT_LABELS[next.kind];
  setAddStatus('');

  addForm.reset();
  addPasswordInput.value = generatePassword();
  if (next.kind === 'create') return;

  addNameInput.value = info?.name ?? '';
  if (next.kind === 'update') {
    modeNote.textContent = `Replacing the file for ${who}. Their login doesn't change.`;
  } else {
    addUsernameInput.value = info?.username ?? '';
    modeNote.textContent = `New password for ${who}. Their old password stops working once you push. Their files and preview link don't change.`;
  }
  addForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  (next.kind === 'update' ? addFileInput : addPasswordInput).focus({ preventScroll: true });
}

async function setDirHandle(handle: FileSystemDirectoryHandle) {
  dirHandle = handle;
  folderNameEl.textContent = handle.name;
  reconnectBtn.hidden = true;
  addSubmitBtn.disabled = false;
  addSubmitLabel.textContent = SUBMIT_LABELS[mode.kind];
  await refreshClientList();
}

pickFolderBtn.addEventListener('click', async () => {
  try {
    const handle = await window.showDirectoryPicker({ id: 'client-files', mode: 'readwrite' });
    await idbSet(DIR_HANDLE_KEY, handle);
    await setDirHandle(handle);
  } catch {
    // user cancelled the picker
  }
});

genPasswordBtn.addEventListener('click', () => {
  addPasswordInput.value = generatePassword();
});

cancelModeBtn.addEventListener('click', () => setMode({ kind: 'create' }));

addUsernameInput.addEventListener('input', () => {
  addUsernameInput.value = addUsernameInput.value.toLowerCase().replace(/\s/g, '');
});

// Writes the zip and its preview into a data folder, then info.json, and only
// then removes the previous zip, so a failure part-way leaves the client's
// current files (and info.json) as they were. Returns whether a preview was made.
async function writeDeliverable(clientDir: FileSystemDirectoryHandle, file: File, preview: PreviewFile[] | null, info: ClientInfo, previousFile?: string): Promise<boolean> {
  try {
    await writeFile(clientDir, file.name, file);
    await replacePreview(clientDir, preview);
    await writeInfo(clientDir, info);
  } catch (err) {
    if (file.name !== previousFile) await clientDir.removeEntry(file.name).catch(() => {});
    throw err;
  }
  if (previousFile && previousFile !== file.name) await clientDir.removeEntry(previousFile).catch(() => {});
  return preview !== null;
}

addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!dirHandle) return;

  const current = mode;
  const username = normalizeUsername(addUsernameInput.value);
  const password = addPasswordInput.value;
  const name = addNameInput.value.trim();
  const file = addFileInput.files?.[0];
  const needsLogin = current.kind !== 'update';

  if (needsLogin && !USERNAME_RE.test(username)) {
    setAddStatus('Username must be 3–32 characters: lowercase letters, numbers, dots, dashes or underscores.', 'error');
    return;
  }
  if (needsLogin && password.length < MIN_PASSWORD) {
    setAddStatus(`Password must be at least ${MIN_PASSWORD} characters. Use Generate for a strong one.`, 'error');
    return;
  }
  if (!file && current.kind !== 'reset') {
    setAddStatus('Choose a zip file.', 'error');
    return;
  }

  addSubmitBtn.disabled = true;
  addSubmitLabel.textContent = 'Saving…';
  setAddStatus('');

  try {
    // Usernames must stay unique: the same username with two passwords
    // would silently be two separate accounts.
    if (current.kind === 'create') {
      const clash = (await listClients()).find(c => c.info.username === username);
      if (clash) {
        setAddStatus(`The username "${username}" is already used by ${describe(clash.info)}. Use that client's Update file or Reset password instead.`, 'error');
        return;
      }
    }

    let hasPreview: boolean | null = null;
    // Read and check the zip before touching the folder: bad entry names stop here.
    const preview = file && current.kind !== 'reset' ? await readPreview(file) : null;

    if (current.kind === 'create') {
      const folder = toHex(crypto.getRandomValues(new Uint8Array(16)));
      const key = await deriveClientKey(username, password);
      const clientDir = await dirHandle.getDirectoryHandle(folder, { create: true });
      try {
        hasPreview = await writeDeliverable(clientDir, file!, preview, { name: name || null, username, file: file!.name, uploadedAt: new Date().toISOString() });
        await writePointer(key, folder);
      } catch (err) {
        // Leave no half-made client behind to be pushed.
        await (await loginsDir()).removeEntry(`${key}.json`).catch(() => {});
        await dirHandle.removeEntry(folder, { recursive: true }).catch(() => {});
        throw err;
      }
    } else if (current.kind === 'update') {
      const clientDir = await dirHandle.getDirectoryHandle(current.folder);
      const info = (await readInfo(clientDir))!;
      hasPreview = await writeDeliverable(clientDir, file!, preview, { ...info, name: name || null, file: file!.name, uploadedAt: new Date().toISOString() }, info.file);
    } else {
      const clientDir = await dirHandle.getDirectoryHandle(current.folder);
      const info = (await readInfo(clientDir))!;
      delete info.passwordChangedAt;
      await writeInfo(clientDir, { ...info, username });
      const key = await deriveClientKey(username, password);
      await writePointer(key, current.folder);
      await deletePointersFor(current.folder, key);
    }

    const previewNote = hasPreview === null ? ''
      : hasPreview ? ' Live preview available.' : ' No live preview (no index.html at the zip root). The client will only see the file name, so send them the file directly.';
    const loginNote = needsLogin ? `Send the client: username "${username}", password "${password}".` : 'File updated.';
    await setMode({ kind: 'create' });
    setAddStatus(`Saved. ${loginNote}${previewNote} Then push to the server.`, 'success');
    await refreshClientList();
  } catch (err) {
    setAddStatus(err instanceof Error ? err.message : 'Something went wrong writing that file.', 'error');
  } finally {
    addSubmitBtn.disabled = false;
    addSubmitLabel.textContent = SUBMIT_LABELS[mode.kind];
  }
});

addPasswordInput.value = generatePassword();

// Reopens the folder picked last time. Chrome only grants access again without
// asking if it still remembers the permission; otherwise requestPermission()
// needs a click, so offer a button for it.
async function restoreFolder() {
  const savedHandle = await idbGet<FileSystemDirectoryHandle>(DIR_HANDLE_KEY);
  if (!savedHandle) return;

  const permission = await savedHandle.queryPermission({ mode: 'readwrite' });
  if (permission === 'granted') {
    await setDirHandle(savedHandle);
  } else if (permission === 'prompt') {
    folderNameEl.textContent = `${savedHandle.name} (not connected)`;
    reconnectBtn.hidden = false;
    reconnectBtn.onclick = async () => {
      try {
        const answer = await savedHandle.requestPermission({ mode: 'readwrite' });
        if (answer === 'granted') await setDirHandle(savedHandle);
        if (answer !== 'denied') return;   // 'prompt': dismissed, the button stays
      } catch {
        // the folder was moved or deleted
      }
      folderNameEl.textContent = `Couldn't reconnect ${savedHandle.name}. Choose the folder again.`;
      reconnectBtn.hidden = true;
    };
  }
}

restoreFolder().catch(() => {
  // the saved folder is gone or unreadable: Choose folder still works
});
