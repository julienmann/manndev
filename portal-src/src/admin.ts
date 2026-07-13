import { unzipSync } from 'fflate';

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

type ClientInfo = { name: string | null; file: string; uploadedAt: string | null };

const pickFolderBtn = document.querySelector<HTMLButtonElement>('#pick-folder-btn')!;
const folderNameEl = document.querySelector<HTMLSpanElement>('#folder-name')!;
const clientListEl = document.querySelector<HTMLDivElement>('#client-list')!;
const addForm = document.querySelector<HTMLFormElement>('#add-form')!;
const addPinInput = document.querySelector<HTMLInputElement>('#add-pin')!;
const addNameInput = document.querySelector<HTMLInputElement>('#add-name')!;
const addFileInput = document.querySelector<HTMLInputElement>('#add-file')!;
const addSubmitBtn = document.querySelector<HTMLButtonElement>('#add-submit-btn')!;
const addSubmitLabel = document.querySelector<HTMLSpanElement>('#add-submit-label')!;
const addStatus = document.querySelector<HTMLParagraphElement>('#add-status')!;

let dirHandle: FileSystemDirectoryHandle | null = null;

function setAddStatus(message: string, tone?: 'error' | 'success') {
  addStatus.textContent = message;
  if (tone) addStatus.dataset.tone = tone;
  else delete addStatus.dataset.tone;
}

// Best-effort: unzip the client's build into <pin>/preview/ so the dashboard
// can offer a live view. Silently skips (returns false) if the zip doesn't
// look like a static site — the raw zip download still works either way.
async function extractPreview(pinDir: FileSystemDirectoryHandle, zipFile: File): Promise<boolean> {
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

  await pinDir.removeEntry('preview', { recursive: true }).catch(() => {});
  const previewDir = await pinDir.getDirectoryHandle('preview', { create: true });

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

async function readInfo(pinDir: FileSystemDirectoryHandle): Promise<ClientInfo | null> {
  try {
    const fileHandle = await pinDir.getFileHandle('info.json');
    const file = await fileHandle.getFile();
    return JSON.parse(await file.text());
  } catch {
    return null;
  }
}

async function refreshClientList() {
  if (!dirHandle) return;

  const rows: string[] = [];
  for await (const entry of dirHandle.values()) {
    if (entry.kind !== 'directory') continue;
    const pinDir = entry as FileSystemDirectoryHandle;
    const info = await readInfo(pinDir);
    if (!info) continue;
    const hasPreview = await pinDir.getDirectoryHandle('preview').then(() => true).catch(() => false);
    rows.push(`
      <div class="admin-client-row">
        <span class="admin-client-pin">${entry.name}</span>
        <span class="admin-client-name">${info.name ?? '—'}</span>
        <span class="admin-client-file">${info.file}${hasPreview ? ' · preview' : ''}</span>
        <button type="button" class="admin-remove-btn" data-remove-pin="${entry.name}">Remove</button>
      </div>
    `);
  }

  clientListEl.innerHTML = rows.length
    ? rows.join('')
    : '<p class="admin-note">No clients yet.</p>';

  clientListEl.querySelectorAll<HTMLButtonElement>('[data-remove-pin]').forEach(btn => {
    btn.addEventListener('click', () => removeClient(btn.dataset.removePin!));
  });
}

async function removeClient(pin: string) {
  if (!dirHandle) return;

  const pinDir = await dirHandle.getDirectoryHandle(pin).catch(() => null);
  const info = pinDir ? await readInfo(pinDir) : null;
  const label = info?.name ? `${info.name} (code ${pin})` : `code ${pin}`;

  if (!confirm(`Remove ${label}? This deletes their zip, info, and preview from this folder. You'll still need to push the change to the server.`)) {
    return;
  }

  try {
    await dirHandle.removeEntry(pin, { recursive: true });
    setAddStatus(`Removed ${label}.`, 'success');
    await refreshClientList();
  } catch (err) {
    setAddStatus(err instanceof Error ? err.message : 'Could not remove that client.', 'error');
  }
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

addPinInput.addEventListener('input', () => {
  addPinInput.value = addPinInput.value.replace(/\D/g, '').slice(0, 4);
});

addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!dirHandle) return;

  const pin = addPinInput.value.trim();
  const name = addNameInput.value.trim();
  const file = addFileInput.files?.[0];

  if (pin.length !== 4) {
    setAddStatus('Access code must be 4 digits.', 'error');
    return;
  }
  if (!file) {
    setAddStatus('Choose a zip file.', 'error');
    return;
  }

  const existing = await (async () => {
    try {
      const existingDir = await dirHandle!.getDirectoryHandle(pin);
      return readInfo(existingDir);
    } catch {
      return null;
    }
  })();

  if (existing && !confirm(`Code ${pin} already has "${existing.file}" for ${existing.name ?? 'a client'}. Overwrite?`)) {
    return;
  }

  addSubmitBtn.disabled = true;
  addSubmitLabel.textContent = 'Saving…';
  setAddStatus('');

  try {
    const pinDir = await dirHandle.getDirectoryHandle(pin, { create: true });

    const zipHandle = await pinDir.getFileHandle(file.name, { create: true });
    const zipWritable = await zipHandle.createWritable();
    await zipWritable.write(file);
    await zipWritable.close();

    const hasPreview = await extractPreview(pinDir, file);

    const info: ClientInfo = { name: name || null, file: file.name, uploadedAt: new Date().toISOString() };
    const infoHandle = await pinDir.getFileHandle('info.json', { create: true });
    const infoWritable = await infoHandle.createWritable();
    await infoWritable.write(JSON.stringify(info, null, 2));
    await infoWritable.close();

    setAddStatus(
      `Saved. Code ${pin} now unlocks ${file.name}.${hasPreview ? ' Live preview generated.' : ' (No index.html found at the zip root, so no live preview — the download still works.)'}`,
      'success'
    );
    addForm.reset();
    await refreshClientList();
  } catch (err) {
    setAddStatus(err instanceof Error ? err.message : 'Something went wrong writing that file.', 'error');
  } finally {
    addSubmitBtn.disabled = false;
    addSubmitLabel.textContent = 'Save client';
  }
});

(async () => {
  const savedHandle = await idbGet<FileSystemDirectoryHandle>(DIR_HANDLE_KEY);
  if (!savedHandle) return;

  const permission = await savedHandle.requestPermission({ mode: 'readwrite' });
  if (permission === 'granted') await setDirHandle(savedHandle);
})();
