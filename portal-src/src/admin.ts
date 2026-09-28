import { unzipSync } from 'fflate';
import { escapeHtml, deriveClientKey, normalizeUsername, LOGINS_DIR } from './session';

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

type ClientInfo = {
  name: string | null;
  username?: string;
  file: string;
  uploadedAt: string | null;
  passwordChangedAt?: string;
};

const pickFolderBtn = document.querySelector<HTMLButtonElement>('#pick-folder-btn')!;
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
const migrateNote = document.querySelector<HTMLParagraphElement>('#migrate-note')!;
const cancelModeBtn = document.querySelector<HTMLButtonElement>('#cancel-mode-btn')!;
const fieldWrap = {
  username: document.querySelector<HTMLDivElement>('#f-username')!,
  password: document.querySelector<HTMLDivElement>('#f-password')!,
  name: document.querySelector<HTMLDivElement>('#f-name')!,
  file: document.querySelector<HTMLDivElement>('#f-file')!,
};

let dirHandle: FileSystemDirectoryHandle | null = null;

// What the form is doing. Data folders have a permanent random id; logins are
// pointer files in _logins/ (see session.ts), so these modes only ever touch
// one side: 'update' replaces files, 'reset' and 'migrate' replace the login.
type Mode =
  | { kind: 'create' }
  | { kind: 'update'; folder: string }
  | { kind: 'reset'; folder: string }
  | { kind: 'migrate'; folder: string };
let mode: Mode = { kind: 'create' };

const LEGACY_PIN = /^\d{4}$/;
const OLD_KEY_FOLDER = /^[0-9a-f]{64}$/;
const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,31}$/;
const MIN_PASSWORD = 10;

function setAddStatus(message: string, tone?: 'error' | 'success') {
  addStatus.textContent = message;
  if (tone) addStatus.dataset.tone = tone;
  else delete addStatus.dataset.tone;
}

// Best-effort: unzip the client's build into <client folder>/preview/ so the dashboard
// can offer a live view. Silently skips (returns false) if the zip doesn't
// look like a static site — the raw zip download still works either way.
async function extractPreview(clientDir: FileSystemDirectoryHandle, zipFile: File): Promise<boolean> {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(new Uint8Array(await zipFile.arrayBuffer()));
  } catch {
    return false;
  }

  const paths = Object.keys(entries).filter(path => {
    const normalized = path.replace(/\\/g, '/');
    if (normalized.endsWith('/')) return false;
    const segments = normalized.split('/');
    if (segments.includes('__MACOSX')) return false;
    if (segments[segments.length - 1].startsWith('.')) return false;
    return true;
  });

  // macOS zip tools often wrap contents in a single top-level folder — unwrap
  // it so index.html ends up at the preview root regardless of how it was zipped.
  let stripPrefix = '';
  if (!paths.includes('index.html')) {
    const topLevelDirs = new Set(paths.map(path => path.split('/')[0]));
    if (topLevelDirs.size === 1) {
      const onlyDir = [...topLevelDirs][0] + '/';
      if (paths.every(path => path.startsWith(onlyDir))) stripPrefix = onlyDir;
    }
  }

  if (!paths.some(path => path.slice(stripPrefix.length) === 'index.html')) return false;

  await clientDir.removeEntry('preview', { recursive: true }).catch(() => {});
  const previewDir = await clientDir.getDirectoryHandle('preview', { create: true });

  for (const path of paths) {
    const relPath = path.slice(stripPrefix.length);
    if (!relPath) continue;

    const parts = relPath.split('/');
    const fileName = parts.pop()!;
    let dir = previewDir;
    for (const part of parts) {
      dir = await dir.getDirectoryHandle(part, { create: true });
    }

    const fileHandle = await dir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(entries[path]);
    await writable.close();
  }

  return true;
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

async function copyDir(from: FileSystemDirectoryHandle, to: FileSystemDirectoryHandle) {
  for await (const entry of from.values()) {
    if (entry.kind === 'file') {
      await writeFile(to, entry.name, await (entry as FileSystemFileHandle).getFile());
    } else {
      await copyDir(entry as FileSystemDirectoryHandle, await to.getDirectoryHandle(entry.name, { create: true }));
    }
  }
}

type ClientEntry = {
  folder: string;
  info: ClientInfo;
  hasPreview: boolean;
  logins: string[]; // keys of the pointer files that open this folder
};

function newFolderId(): string {
  return [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function loginsDir(): Promise<FileSystemDirectoryHandle> {
  return dirHandle!.getDirectoryHandle(LOGINS_DIR, { create: true });
}

// key -> folder id, for every pointer file.
async function readPointers(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const dir = await loginsDir();
  for await (const entry of dir.values()) {
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

async function listClients(): Promise<ClientEntry[]> {
  if (!dirHandle) return [];
  const pointers = await readPointers();
  const clients: ClientEntry[] = [];
  for await (const entry of dirHandle.values()) {
    if (entry.kind !== 'directory' || entry.name === LOGINS_DIR || entry.name.startsWith('.')) continue;
    const clientDir = entry as FileSystemDirectoryHandle;
    const info = await readInfo(clientDir);
    if (!info) continue;
    const hasPreview = await clientDir.getDirectoryHandle('preview').then(() => true).catch(() => false);
    const logins = [...pointers].filter(([, id]) => id === entry.name).map(([key]) => key);
    clients.push({ folder: entry.name, info, hasPreview, logins });
  }
  return clients;
}

function describe(c: ClientEntry): string {
  const who = c.info.name ?? 'client';
  return LEGACY_PIN.test(c.folder) ? `${who} (code ${c.folder})` : `${who} (${c.info.username ?? 'no username'})`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Before logins were split into pointer files, a client's data folder was
// named after their login key. Move each one to a random id and point the
// same key at it, so passwords keep working and folder names stop being logins.
async function upgradeOldLayout(): Promise<number> {
  if (!dirHandle) return 0;
  const pointers = await readPointers();
  const logins = await loginsDir();
  let upgraded = 0;
  for await (const entry of dirHandle.values()) {
    if (entry.kind !== 'directory' || !OLD_KEY_FOLDER.test(entry.name) || pointers.has(entry.name)) continue;
    const oldDir = entry as FileSystemDirectoryHandle;
    if (!(await readInfo(oldDir))) continue;
    const id = newFolderId();
    await copyDir(oldDir, await dirHandle.getDirectoryHandle(id, { create: true }));
    await writeFile(logins, `${entry.name}.json`, JSON.stringify({ id }));
    await dirHandle.removeEntry(entry.name, { recursive: true });
    upgraded++;
  }
  return upgraded;
}

async function refreshClientList() {
  const clients = await listClients();

  clientListEl.innerHTML = clients.length
    ? clients.map(c => {
        const legacy = LEGACY_PIN.test(c.folder);
        const login = legacy
          ? `${escapeHtml(c.folder)}<span class="admin-client-legacy">old code</span>`
          : escapeHtml(c.info.username ?? '—');
        const changed = c.info.passwordChangedAt
          ? `<span class="admin-client-changed">Password changed by client · ${escapeHtml(formatDate(c.info.passwordChangedAt))}</span>`
          : '';
        const noLogin = !legacy && !c.logins.length ? '<span class="admin-client-changed">No login: use Reset password</span>' : '';
        const actions = legacy
          ? `<button type="button" class="admin-remove-btn" data-action="migrate" data-folder="${escapeHtml(c.folder)}">Set login</button>`
          : `<button type="button" class="admin-remove-btn" data-action="update" data-folder="${escapeHtml(c.folder)}">Update file</button>
             <button type="button" class="admin-remove-btn" data-action="reset" data-folder="${escapeHtml(c.folder)}">Reset password</button>`;
        return `
          <div class="admin-client-row">
            <span class="admin-client-pin">${login}</span>
            <span class="admin-client-name">${escapeHtml(c.info.name ?? '—')}${changed}${noLogin}</span>
            <span class="admin-client-file">${escapeHtml(c.info.file)}${c.hasPreview ? ' · preview' : ''}</span>
            <span class="admin-client-actions">
              ${actions}
              <button type="button" class="admin-remove-btn" data-action="remove" data-folder="${escapeHtml(c.folder)}">Remove</button>
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
      else setMode({ kind: action as 'update' | 'reset' | 'migrate', folder });
    });
  });
}

async function deletePointersFor(folder: string, except?: string) {
  const dir = await loginsDir();
  for (const [key, id] of await readPointers()) {
    if (id === folder && key !== except) await dir.removeEntry(`${key}.json`).catch(() => {});
  }
}

async function removeClient(folder: string) {
  if (!dirHandle) return;

  const clientDir = await dirHandle.getDirectoryHandle(folder).catch(() => null);
  const info = clientDir ? await readInfo(clientDir) : null;
  const label = info ? describe({ folder, info, hasPreview: false, logins: [] }) : folder;

  if (!confirm(`Remove ${label}? This deletes their login, zip, info, and preview from this folder. You'll still need to push the change to the server.`)) {
    return;
  }

  try {
    await deletePointersFor(folder);
    await dirHandle.removeEntry(folder, { recursive: true });
    if ('folder' in mode && mode.folder === folder) setMode({ kind: 'create' });
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
  migrate: 'Move to login',
};

async function setMode(next: Mode) {
  mode = next;
  const info = 'folder' in next && dirHandle
    ? await readInfo(await dirHandle.getDirectoryHandle(next.folder))
    : null;
  const who = info?.name ?? 'this client';

  fieldWrap.username.hidden = next.kind === 'update';
  fieldWrap.password.hidden = next.kind === 'update';
  fieldWrap.name.hidden = next.kind === 'reset';
  fieldWrap.file.hidden = next.kind === 'reset';
  addUsernameInput.readOnly = next.kind === 'reset';
  cancelModeBtn.hidden = next.kind === 'create';
  migrateNote.hidden = next.kind === 'create';
  addSubmitLabel.textContent = SUBMIT_LABELS[next.kind];
  setAddStatus('');

  if (next.kind === 'create') {
    addForm.reset();
    addPasswordInput.value = generatePassword();
    return;
  }

  addNameInput.value = info?.name ?? '';
  addFileInput.value = '';
  if (next.kind === 'update') {
    migrateNote.textContent = `Replacing the file for ${who}. Their login doesn't change.`;
  } else if (next.kind === 'reset') {
    addUsernameInput.value = info?.username ?? '';
    addPasswordInput.value = generatePassword();
    migrateNote.textContent = `New password for ${who}. Their old password stops working once you push. Their files and preview link don't change.`;
  } else {
    addUsernameInput.value = '';
    addPasswordInput.value = generatePassword();
    migrateNote.textContent = `Moving ${who} (code ${next.folder}) to a username and password. Their files come along, so the zip is optional. The old code stops working once you push.`;
  }
  addForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  (next.kind === 'update' ? addFileInput : next.kind === 'reset' ? addPasswordInput : addUsernameInput).focus({ preventScroll: true });
}

async function setDirHandle(handle: FileSystemDirectoryHandle) {
  dirHandle = handle;
  folderNameEl.textContent = handle.name;
  addSubmitBtn.disabled = false;
  addSubmitLabel.textContent = SUBMIT_LABELS[mode.kind];
  try {
    const upgraded = await upgradeOldLayout();
    if (upgraded) {
      setAddStatus(`Upgraded ${upgraded} client${upgraded === 1 ? '' : 's'} to the new folder layout. Their passwords are unchanged, but live-preview links now use a new address. Push to apply.`, 'success');
    }
  } catch (err) {
    setAddStatus(err instanceof Error ? `Couldn't upgrade old client folders: ${err.message}` : "Couldn't upgrade old client folders.", 'error');
  }
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

// Writes the zip (and its unpacked preview) into a data folder, replacing
// whatever deliverable was there. Returns whether a preview was generated.
async function writeDeliverable(clientDir: FileSystemDirectoryHandle, file: File, previousFile?: string): Promise<boolean> {
  if (previousFile && previousFile !== file.name) await clientDir.removeEntry(previousFile).catch(() => {});
  await writeFile(clientDir, file.name, file);
  return extractPreview(clientDir, file);
}

addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!dirHandle) return;

  const username = normalizeUsername(addUsernameInput.value);
  const password = addPasswordInput.value;
  const name = addNameInput.value.trim();
  const file = addFileInput.files?.[0];
  const needsLogin = mode.kind !== 'update';

  if (needsLogin && !USERNAME_RE.test(username)) {
    setAddStatus('Username must be 3–32 characters: lowercase letters, numbers, dots, dashes or underscores.', 'error');
    return;
  }
  if (needsLogin && password.length < MIN_PASSWORD) {
    setAddStatus(`Password must be at least ${MIN_PASSWORD} characters. Use Generate for a strong one.`, 'error');
    return;
  }
  if (!file && (mode.kind === 'create' || mode.kind === 'update')) {
    setAddStatus('Choose a zip file.', 'error');
    return;
  }

  addSubmitBtn.disabled = true;
  addSubmitLabel.textContent = 'Saving…';
  setAddStatus('');

  try {
    const clients = await listClients();
    const logins = await loginsDir();
    const current = mode;

    // Usernames must stay unique: the same username with two passwords
    // would silently be two separate accounts.
    if (needsLogin) {
      const clash = clients.find(c => c.info.username === username && !('folder' in current && c.folder === current.folder));
      if (clash) {
        setAddStatus(`The username "${username}" is already used by ${describe(clash)}. Use that client's Update file or Reset password instead.`, 'error');
        return;
      }
    }
    const key = needsLogin ? await deriveClientKey(username, password) : '';

    let folder: string;
    let hasPreview: boolean | null = null;

    if (current.kind === 'create') {
      folder = newFolderId();
      const clientDir = await dirHandle.getDirectoryHandle(folder, { create: true });
      hasPreview = await writeDeliverable(clientDir, file!);
      await writeFile(clientDir, 'info.json', JSON.stringify({ name: name || null, username, file: file!.name, uploadedAt: new Date().toISOString() } satisfies ClientInfo, null, 2));
      await writeFile(logins, `${key}.json`, JSON.stringify({ id: folder }));
    } else if (current.kind === 'update') {
      folder = current.folder;
      const clientDir = await dirHandle.getDirectoryHandle(folder);
      const info = (await readInfo(clientDir))!;
      hasPreview = await writeDeliverable(clientDir, file!, info.file);
      await writeFile(clientDir, 'info.json', JSON.stringify({ ...info, name: name || null, file: file!.name, uploadedAt: new Date().toISOString() }, null, 2));
    } else if (current.kind === 'reset') {
      folder = current.folder;
      const clientDir = await dirHandle.getDirectoryHandle(folder);
      const { passwordChangedAt: _cleared, ...info } = (await readInfo(clientDir))!;
      await writeFile(clientDir, 'info.json', JSON.stringify({ ...info, username }, null, 2));
      await writeFile(logins, `${key}.json`, JSON.stringify({ id: folder }));
      await deletePointersFor(folder, key);
    } else {
      // migrate: copy the old 4-digit-code folder into a fresh random id.
      folder = newFolderId();
      const oldDir = await dirHandle.getDirectoryHandle(current.folder);
      const oldInfo = await readInfo(oldDir);
      const clientDir = await dirHandle.getDirectoryHandle(folder, { create: true });
      await copyDir(oldDir, clientDir);
      if (file) hasPreview = await writeDeliverable(clientDir, file, oldInfo?.file);
      await writeFile(clientDir, 'info.json', JSON.stringify({
        name: name || null, username, file: file?.name ?? oldInfo?.file ?? '', uploadedAt: file ? new Date().toISOString() : oldInfo?.uploadedAt ?? null,
      } satisfies ClientInfo, null, 2));
      await writeFile(logins, `${key}.json`, JSON.stringify({ id: folder }));
      await dirHandle.removeEntry(current.folder, { recursive: true });
    }

    const previewNote = hasPreview === null ? ''
      : hasPreview ? ' Live preview available.' : ' No live preview (no index.html at the zip root), but the download still works.';
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

(async () => {
  const savedHandle = await idbGet<FileSystemDirectoryHandle>(DIR_HANDLE_KEY);
  if (!savedHandle) return;

  const permission = await savedHandle.requestPermission({ mode: 'readwrite' });
  if (permission === 'granted') await setDirHandle(savedHandle);
})();
