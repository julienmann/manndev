// Chromium-only parts of the File System Access API that TypeScript's DOM lib
// doesn't ship (it has the handle types, but not the picker, permissions or move).
interface FileSystemHandle {
  queryPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
  requestPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
  move(newName: string): Promise<void>;
}

interface FileSystemDirectoryHandle {
  values(): AsyncIterableIterator<FileSystemHandle>;
}

interface Window {
  showDirectoryPicker(options?: { id?: string; mode?: 'read' | 'readwrite' }): Promise<FileSystemDirectoryHandle>;
}
