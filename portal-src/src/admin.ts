import { unzipSync } from 'fflate';
import { escapeHtml, deriveClientKey, normalizeUsername } from './session';

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

type ClientInfo = { name: string | null; username?: string; file: string; uploadedAt: string | null };

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

let dirHandle: FileSystemDirectoryHandle | null = null;
// Set while moving an old 4-digit-code client onto a username/password login.
let migrateFrom: string | null = null;

const LEGACY_PIN = /^\d{4}$/;
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

type ClientEntry = { folder: string; info: ClientInfo; hasPreview: boolean };

async function listClients(): Promise<ClientEntry[]> {
  if (!dirHandle) return [];
  const clients: ClientEntry[] = [];
  for await (const entry of dirHandle.values()) {
    if (entry.kind !== 'directory') continue;
    const clientDir = entry as FileSystemDirectoryHandle;
    const info = await readInfo(clientDir);
    if (!info) continue;
    const hasPreview = await clientDir.getDirectoryHandle('preview').then(() => true).catch(() => false);
    clients.push({ folder: entry.name, info, hasPreview });
  }
  return clients;
}

function describe(c: ClientEntry): string {
  const who = c.info.name ?? (c.info.username ? `@${c.info.username}` : 'client');
  return LEGACY_PIN.test(c.folder) ? `${who} (code ${c.folder})` : `${who} (${c.info.username ?? 'no username'})`;
}

async function refreshClientList() {
  const clients = await listClients();

  clientListEl.innerHTML = clients.length
    ? clients.map(c => {
        const legacy = LEGACY_PIN.test(c.folder);
        const login = legacy
          ? `${escapeHtml(c.folder)}<span class="admin-client-legacy">old code</span>`
          : escapeHtml(c.info.username ?? '—');
        return `
          <div class="admin-client-row">
            <span class="admin-client-pin">${login}</span>
            <span class="admin-client-name">${escapeHtml(c.info.name ?? '—')}</span>
            <span class="admin-client-file">${escapeHtml(c.info.file)}${c.hasPreview ? ' · preview' : ''}</span>
            <span class="admin-client-actions">
              ${legacy ? `<button type="button" class="admin-remove-btn" data-migrate="${escapeHtml(c.folder)}">Set login</button>` : ''}
              <button type="button" class="admin-remove-btn" data-remove="${escapeHtml(c.folder)}">Remove</button>
            </span>
          </div>
        `;
      }).join('')
    : '<p class="admin-note">No clients yet.</p>';

  clientListEl.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => removeClient(btn.dataset.remove!));
  });
  clientListEl.querySelectorAll<HTMLButtonElement>('[data-migrate]').forEach(btn => {
    btn.addEventListener('click', () => startMigrate(btn.dataset.migrate!));
  });
}

async function removeClient(folder: string) {
  if (!dirHandle) return;

  const clientDir = await dirHandle.getDirectoryHandle(folder).catch(() => null);
  const info = clientDir ? await readInfo(clientDir) : null;
  const label = info ? describe({ folder, info, hasPreview: false }) : folder;

  if (!confirm(`Remove ${label}? This deletes their zip, info, and preview from this folder. You'll still need to push the change to the server.`)) {
    return;
  }

  try {
    await dirHandle.removeEntry(folder, { recursive: true });
    if (migrateFrom === folder) cancelMigrate();
    setAddStatus(`Removed ${label}.`, 'success');
    await refreshClientList();
  } catch (err) {
    setAddStatus(err instanceof Error ? err.message : 'Could not remove that client.', 'error');
  }
}

async function startMigrate(folder: string) {
  if (!dirHandle) return;
  const info = await readInfo(await dirHandle.getDirectoryHandle(folder));
  migrateFrom = folder;
  addNameInput.value = info?.name ?? '';
  addUsernameInput.value = '';
  addPasswordInput.value = generatePassword();
  migrateNote.hidden = false;
  migrateNote.textContent = `Moving ${info?.name ?? 'this client'} (code ${folder}) to a username and password. Their files come along, so the zip is optional. The old code stops working once you push.`;
  addSubmitLabel.textContent = 'Move to login';
  setAddStatus('');
  addForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  addUsernameInput.focus({ preventScroll: true });
}

function cancelMigrate() {
  migrateFrom = null;
  migrateNote.hidden = true;
  addSubmitLabel.textContent = 'Save client';
}

async function setDirHandle(handle: FileSystemDirectoryHandle) {
  dirHandle = handle;
  folderNameEl.textContent = handle.name;
  addSubmitBtn.disabled = false;
  addSubmitLabel.textContent = 'Save client';
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

addUsernameInput.addEventListener('input', () => {
  addUsernameInput.value = addUsernameInput.value.toLowerCase().replace(/\s/g, '');
});

addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!dirHandle) return;

  const username = normalizeUsername(addUsernameInput.value);
  const password = addPasswordInput.value;
  const name = addNameInput.value.trim();
  const file = addFileInput.files?.[0];

  if (!USERNAME_RE.test(username)) {
    setAddStatus('Username must be 3–32 characters: lowercase letters, numbers, dots, dashes or underscores.', 'error');
    return;
  }
  if (password.length < MIN_PASSWORD) {
    setAddStatus(`Password must be at least ${MIN_PASSWORD} characters. Use Generate for a strong one.`, 'error');
    return;
  }
  if (!file && !migrateFrom) {
    setAddStatus('Choose a zip file.', 'error');
    return;
  }

  addSubmitBtn.disabled = true;
  addSubmitLabel.textContent = 'Saving…';
  setAddStatus('');

  try {
    const key = await deriveClientKey(username, password);
    const clients = await listClients();

    // Usernames must stay unique: the same username with two passwords
    // would silently be two separate accounts.
    const clash = clients.find(c => c.info.username === username && c.folder !== key);
    if (clash) {
      setAddStatus(`The username "${username}" is already used by ${describe(clash)}. To change that client's password, remove them and add them again.`, 'error');
      return;
    }

    const existing = clients.find(c => c.folder === key);
    if (existing && !confirm(`${describe(existing)} already has "${existing.info.file}". Overwrite?`)) return;

    const clientDir = await dirHandle.getDirectoryHandle(key, { create: true });
    let fileName: string;
    let hasPreview: boolean;

    if (migrateFrom && !file) {
      const oldDir = await dirHandle.getDirectoryHandle(migrateFrom);
      await copyDir(oldDir, clientDir);
      const oldInfo = await readInfo(oldDir);
      fileName = oldInfo?.file ?? '';
      hasPreview = await clientDir.getDirectoryHandle('preview').then(() => true).catch(() => false);
    } else {
      await writeFile(clientDir, file!.name, file!);
      hasPreview = await extractPreview(clientDir, file!);
      fileName = file!.name;
    }

    const info: ClientInfo = { name: name || null, username, file: fileName, uploadedAt: new Date().toISOString() };
    await writeFile(clientDir, 'info.json', JSON.stringify(info, null, 2));

    if (migrateFrom) await dirHandle.removeEntry(migrateFrom, { recursive: true });

    setAddStatus(
      `Saved. Send the client: username "${username}", password "${password}". ` +
      (hasPreview ? 'Live preview available.' : 'No live preview (no index.html at the zip root), but the download still works.') +
      ' Then push the folder to the server.',
      'success'
    );
    addForm.reset();
    cancelMigrate();
    await refreshClientList();
  } catch (err) {
    setAddStatus(err instanceof Error ? err.message : 'Something went wrong writing that file.', 'error');
  } finally {
    addSubmitBtn.disabled = false;
    addSubmitLabel.textContent = migrateFrom ? 'Move to login' : 'Save client';
  }
});

addPasswordInput.value = generatePassword();

(async () => {
  const savedHandle = await idbGet<FileSystemDirectoryHandle>(DIR_HANDLE_KEY);
  if (!savedHandle) return;

  const permission = await savedHandle.requestPermission({ mode: 'readwrite' });
  if (permission === 'granted') await setDirHandle(savedHandle);
})();
