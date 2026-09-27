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
};

export type ClientInfoResult =
  | { ok: true; info: ClientInfo }
  | { ok: false; reason: 'invalid' | 'network' };

// Some static hosts fall back to serving index.html (with a 200) for any
// unmatched path instead of a real 404 — treat a response that isn't
// actually JSON the same as "login doesn't exist", not a crash.
export async function fetchClientInfo(key: string): Promise<ClientInfoResult> {
  let res: Response;
  try {
    res = await fetch(`/client-files/${key}/info.json`, { cache: 'no-store' });
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (!res.ok) return { ok: false, reason: 'invalid' };

  try {
    const info = await res.json();
    if (!info || typeof info.file !== 'string') return { ok: false, reason: 'invalid' };
    return { ok: true, info };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}
