// Chromium-only parts of the File System Access API that TypeScript's DOM lib
// doesn't ship (it has the handle types, but not the picker or permissions).
interface FileSystemHandle {
  requestPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
}

interface FileSystemDirectoryHandle {
  values(): AsyncIterableIterator<FileSystemHandle>;
}

interface Window {
  showDirectoryPicker(options?: { id?: string; mode?: 'read' | 'readwrite' }): Promise<FileSystemDirectoryHandle>;
}
