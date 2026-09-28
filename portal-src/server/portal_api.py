#!/usr/bin/env python3
"""Mann Dev client portal API: lets a signed-in client change their password.

The portal is otherwise static. A login is a pointer file,
client-files/_logins/<key>.json -> {"id": "<data folder>"}, where <key> is a
PBKDF2 hash of username + password computed in the browser. Changing a
password therefore means: prove you know the current key (its pointer exists),
then write a pointer for the new key and delete the old one. The server never
sees a password, only the two derived keys.

Standard library only. Runs behind nginx on 127.0.0.1:8787 (see SETUP.md §4):
    CLIENT_FILES=/srv/www/manndev/client-files python3 portal_api.py
"""

import json
import os
import re
import secrets
import threading
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.environ.get('CLIENT_FILES', '/srv/www/manndev/client-files')
LOGINS = os.path.join(ROOT, '_logins')

KEY_RE = re.compile(r'[0-9a-f]{64}')
FOLDER_RE = re.compile(r'[0-9a-f]{32}')
MAX_BODY = 1024
# Failed attempts allowed per IP per window, so the endpoint can't be used to
# guess keys faster than the static files already allow.
FAIL_LIMIT = 10
FAIL_WINDOW = 15 * 60

lock = threading.Lock()
failures = {}  # ip -> [monotonic timestamps of recent failed attempts]


def write_text(path: str, text: str) -> None:
    """Atomic write, readable by nginx's worker user."""
    tmp = f'{path}.{secrets.token_hex(4)}.tmp'
    with open(tmp, 'w') as f:
        f.write(text)
    os.chmod(tmp, 0o644)
    os.replace(tmp, path)


def read_json(path: str):
    try:
        with open(path) as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def change_password(old_key: str, new_key: str) -> int:
    """Returns an HTTP status code."""
    old_ptr = os.path.join(LOGINS, f'{old_key}.json')
    new_ptr = os.path.join(LOGINS, f'{new_key}.json')

    with lock:
        pointer = read_json(old_ptr)
        if pointer is None:
            return 404
        folder = pointer.get('id')
        if not isinstance(folder, str) or not FOLDER_RE.fullmatch(folder):
            return 500
        if os.path.exists(new_ptr):
            return 409

        write_text(new_ptr, json.dumps({'id': folder}))
        os.remove(old_ptr)

        info_path = os.path.join(ROOT, folder, 'info.json')
        info = read_json(info_path) or {}
        info['passwordChangedAt'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
        write_text(info_path, json.dumps(info, indent=2))

        # Lets scripts/clients.sh refuse a push that would undo this change.
        write_text(os.path.join(ROOT, '.changed-at'), f"{info['passwordChangedAt']} {secrets.token_hex(4)}\n")
    return 200


def rate_limited(ip: str) -> bool:
    now = time.monotonic()
    recent = [t for t in failures.get(ip, []) if now - t < FAIL_WINDOW]
    if recent:
        failures[ip] = recent
    else:
        failures.pop(ip, None)
    return len(recent) >= FAIL_LIMIT


class Handler(BaseHTTPRequestHandler):
    def reply(self, status: int) -> None:
        data = json.dumps({'ok': status == 200}).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if self.path != '/api/change-password':
            return self.reply(404)

        ip = self.headers.get('X-Real-IP') or self.client_address[0]
        if rate_limited(ip):
            return self.reply(429)

        length = int(self.headers.get('Content-Length') or 0)
        if length <= 0 or length > MAX_BODY:
            return self.reply(400)
        try:
            body = json.loads(self.rfile.read(length))
        except ValueError:
            return self.reply(400)

        old_key, new_key = body.get('oldKey'), body.get('newKey')
        if not all(isinstance(k, str) and KEY_RE.fullmatch(k) for k in (old_key, new_key)):
            return self.reply(400)

        try:
            status = change_password(old_key, new_key)
        except OSError as err:
            self.log_error('change failed: %s', err)
            status = 500

        if status == 404:
            failures.setdefault(ip, []).append(time.monotonic())
        self.reply(status)


if __name__ == '__main__':
    print(f'portal-api on 127.0.0.1:8787, client files in {ROOT}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8787), Handler).serve_forever()
