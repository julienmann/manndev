export const SESSION_KEY = 'portal_key';
// Pre-username/password sessions stored the raw 4-digit code here.
export const LEGACY_PIN_KEY = 'portal_pin';

// A client's folder under /client-files/ is named after a PBKDF2 hash of their
// username + password, so the server never stores a password and the folder
// name is unguessable without both. The admin page derives the same key when
// creating the folder. Changing these parameters invalidates every login.
const KDF_ITERATIONS = 150_000;

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export async function deriveClientKey(username: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(`manndev-portal:v1:${normalizeUsername(username)}`), iterations: KDF_ITERATIONS },
    material,
    256
  );
  return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Escape values before dropping them into innerHTML. The name/filename come from
// admin-authored info.json, so this is defense-in-depth rather than a live hole,
// but interpolating raw strings into markup is never worth the risk.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type ClientInfo = {
  name: string | null;
  username?: string;
  file: string;
  uploadedAt: string | null;
  // Set by the server when the client changes their own password.
  passwordChangedAt?: string;
};

export type ClientInfoResult =
  | { ok: true; info: ClientInfo; folder: string }
  | { ok: false; reason: 'invalid' | 'network' };

// Logins live in /client-files/_logins/<key>.json, each pointing at the
// client's permanent data folder: { "id": "<folder>" }. Keeping the two apart
// means a password change only swaps the pointer, and a shared live-preview
// link (which contains the folder id) never doubles as a login.
export const LOGINS_DIR = '_logins';

async function getJson(url: string): Promise<{ ok: true; data: any } | { ok: false; reason: 'invalid' | 'network' }> {
  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-store' });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (!res.ok) return { ok: false, reason: 'invalid' };
  // Some static hosts fall back to serving index.html (with a 200) for any
  // unmatched path instead of a real 404 — treat a response that isn't
  // actually JSON the same as "doesn't exist", not a crash.
  try {
    return { ok: true, data: await res.json() };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

export async function fetchClientInfo(key: string): Promise<ClientInfoResult> {
  let folder = key;
  const pointer = await getJson(`/client-files/${LOGINS_DIR}/${key}.json`);
  if (pointer.ok) {
    if (typeof pointer.data?.id !== 'string' || !/^[0-9a-f]{32,64}$/.test(pointer.data.id)) return { ok: false, reason: 'invalid' };
    folder = pointer.data.id;
  } else if (pointer.reason === 'network') {
    return pointer;
  }
  // No pointer: fall back to a data folder named after the key itself, the
  // layout used before logins were split out (the admin page upgrades these).

  const info = await getJson(`/client-files/${folder}/info.json`);
  if (!info.ok) return info;
  if (!info.data || typeof info.data.file !== 'string') return { ok: false, reason: 'invalid' };
  return { ok: true, info: info.data, folder };
}
