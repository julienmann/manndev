export const PIN_STORAGE_KEY = 'portal_pin';

export type ClientInfo = {
  name: string | null;
  file: string;
  uploadedAt: string | null;
};

export type ClientInfoResult =
  | { ok: true; info: ClientInfo }
  | { ok: false; reason: 'invalid' | 'network' };

// Some static hosts fall back to serving index.html (with a 200) for any
// unmatched path instead of a real 404 — treat a response that isn't
// actually JSON the same as "code doesn't exist", not a crash.
export async function fetchClientInfo(pin: string): Promise<ClientInfoResult> {
  let res: Response;
  try {
    res = await fetch(`/client-files/${pin}/info.json`, { cache: 'no-store' });
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
