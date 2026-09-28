#!/usr/bin/env python3
"""Mann Dev client portal API: lets a signed-in client change their password.

The portal is otherwise static. A login is a pointer file,
client-files/_logins/<key>.json -> {"id": "<data folder>"}, where <key> is a
PBKDF2 hash of username + password computed in the browser. Changing a
password therefore means: prove you know the current key (its pointer exists),
then write a pointer for the new key and delete the old one. The server never
sees a password, only the two derived keys.

Standard library only. Runs behind nginx on 127.0.0.1 (see SETUP.md):
    CLIENT_FILES=/srv/www/manndev/client-files python3 portal_api.py
"""

import json
import os
import secrets
import threading
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.environ.get('CLIENT_FILES', '/srv/www/manndev/client-files')
LOGINS = os.path.join(ROOT, '_logins')
HOST = os.environ.get('PORTAL_API_HOST', '127.0.0.1')
PORT = int(os.environ.get('PORTAL_API_PORT', '8787'))

MAX_BODY = 1024
# Failed attempts allowed per IP per window, so the endpoint can't be used to
# guess keys faster than the static files already allow.
FAIL_LIMIT = 10
FAIL_WINDOW = 15 * 60

lock = threading.Lock()
failures = {}  # ip -> [monotonic timestamps of failed attempts]


def is_key(value) -> bool:
    return isinstance(value, str) and len(value) == 64 and all(c in '0123456789abcdef' for c in value)


def is_folder_id(value) -> bool:
    return isinstance(value, str) and 32 <= len(value) <= 64 and all(c in '0123456789abcdef' for c in value)


def write_json(path: str, data: dict) -> None:
    tmp = f'{path}.{secrets.token_hex(4)}.tmp'
    with open(tmp, 'w') as f:
        json.dump(data, f, indent=2)
    os.chmod(tmp, 0o644)  # nginx's worker user must be able to read it
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
        if pointer is not None:
            folder = pointer.get('id')
            if not is_folder_id(folder):
                return 500
        elif os.path.isfile(os.path.join(ROOT, old_key, 'info.json')):
            # Pre-pointer layout: the data folder is named after the key.
            # Move it to a random id so the old key stops working entirely.
            folder = secrets.token_hex(16)
            os.rename(os.path.join(ROOT, old_key), os.path.join(ROOT, folder))
        else:
            return 404

        if os.path.exists(new_ptr):
            return 409

        os.makedirs(LOGINS, mode=0o755, exist_ok=True)
        write_json(new_ptr, {'id': folder})
        if pointer is not None:
            os.remove(old_ptr)

        info_path = os.path.join(ROOT, folder, 'info.json')
        info = read_json(info_path) or {}
        info['passwordChangedAt'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
        write_json(info_path, info)

        # Lets scripts/clients.sh refuse a push that would undo this change.
        with open(os.path.join(ROOT, '.changed-at'), 'w') as f:
            f.write(f"{info['passwordChangedAt']} {secrets.token_hex(4)}\n")
        os.chmod(os.path.join(ROOT, '.changed-at'), 0o644)
    return 200


def rate_limited(ip: str) -> bool:
    now = time.monotonic()
    recent = [t for t in failures.get(ip, []) if now - t < FAIL_WINDOW]
    failures[ip] = recent
    return len(recent) >= FAIL_LIMIT


def record_failure(ip: str) -> None:
    failures.setdefault(ip, []).append(time.monotonic())


class Handler(BaseHTTPRequestHandler):
    server_version = 'portal-api'

    def reply(self, status: int, body: dict) -> None:
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if self.path != '/api/change-password':
            return self.reply(404, {'error': 'not found'})

        ip = self.headers.get('X-Real-IP') or self.client_address[0]
        if rate_limited(ip):
            return self.reply(429, {'error': 'too many attempts'})

        length = int(self.headers.get('Content-Length') or 0)
        if length <= 0 or length > MAX_BODY:
            return self.reply(400, {'error': 'bad request'})
        try:
            body = json.loads(self.rfile.read(length))
        except ValueError:
            return self.reply(400, {'error': 'bad request'})

        old_key, new_key = body.get('oldKey'), body.get('newKey')
        if not (is_key(old_key) and is_key(new_key)) or old_key == new_key:
            return self.reply(400, {'error': 'bad request'})

        try:
            status = change_password(old_key, new_key)
        except OSError as err:
            self.log_error('change failed: %s', err)
            status = 500

        if status == 404:
            record_failure(ip)
        messages = {200: 'ok', 404: 'current password incorrect', 409: 'choose a different password', 500: 'server error'}
        self.reply(status, {'ok': status == 200} if status == 200 else {'error': messages[status]})

    def do_GET(self):
        self.reply(404, {'error': 'not found'})


if __name__ == '__main__':
    print(f'portal-api on {HOST}:{PORT}, client files in {ROOT}', flush=True)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
