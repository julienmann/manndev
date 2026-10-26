#!/usr/bin/env python3
"""Manndev client portal API: lets a signed-in client change their password.

The portal is otherwise static. A login is a pointer file,
client-files/_logins/<key>.json -> {"id": "<data folder>"}, where <key> is a
PBKDF2 hash of username + password computed in the browser. Changing a
password therefore means: prove you know the current key (its pointer exists),
then write a pointer for the new key and delete the old one. The server never
sees a password, only the two derived keys.

Standard library only. Runs behind nginx on 127.0.0.1:8787 (see SETUP.md §4):
    CLIENT_FILES=/srv/www/manndev/client-files python3 portal_api.py
"""

import fcntl
import json
import os
import re
import secrets
import threading
import time
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Optional
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.environ.get('CLIENT_FILES', '/srv/www/manndev/client-files')
LOGINS = os.path.join(ROOT, '_logins')
# scripts/clients.sh runs the server side of every rsync under flock(1) on this
# file, so a pull or push never sees, or overwrites, a half-made change.
SYNC_LOCK = os.path.join(ROOT, '.sync.lock')
SYNC_LOCK_WAIT = 20  # seconds; nginx gives up on the request after 60

KEY_RE = re.compile(r'[0-9a-f]{64}')
FOLDER_RE = re.compile(r'[0-9a-f]{32}')
MAX_BODY = 1024
# Failed attempts allowed per IP per window, so the endpoint can't be used to
# guess keys faster than the static files already allow.
FAIL_LIMIT = 10
FAIL_WINDOW = 15 * 60

lock = threading.Lock()         # one password change at a time
rate_lock = threading.Lock()    # guards `failures`
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


@contextmanager
def sync_lock():
    """Exclusive flock on SYNC_LOCK. Raises TimeoutError if a sync holds it too long."""
    fd = os.open(SYNC_LOCK, os.O_RDWR | os.O_CREAT, 0o644)
    try:
        deadline = time.monotonic() + SYNC_LOCK_WAIT
        while True:
            try:
                fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
                break
            except BlockingIOError:
                if time.monotonic() > deadline:
                    raise TimeoutError('client-files is busy syncing')
                time.sleep(0.25)
        yield
    finally:
        os.close(fd)  # also releases the lock


def change_password(old_key: str, new_key: str) -> int:
    """Returns an HTTP status code."""
    old_ptr = os.path.join(LOGINS, f'{old_key}.json')
    new_ptr = os.path.join(LOGINS, f'{new_key}.json')

    with lock, sync_lock():
        pointer = read_json(old_ptr)
        if pointer is None:
            return 404
        folder = pointer.get('id') if isinstance(pointer, dict) else None
        if not isinstance(folder, str) or not FOLDER_RE.fullmatch(folder):
            return 500
        if os.path.exists(new_ptr):
            return 409

        # Never replace a broken info.json with one that has no `file`: the
        # dashboard needs it, and the admin's copy may still be good.
        info_path = os.path.join(ROOT, folder, 'info.json')
        info = read_json(info_path)
        if not isinstance(info, dict) or not isinstance(info.get('file'), str):
            return 500

        # Record the change before making it, so a failure part-way leaves the
        # old pointer (and password) working. The worst case is a stamp for a
        # change that didn't happen, which only makes the next push ask for a pull.
        info['passwordChangedAt'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
        write_text(info_path, json.dumps(info, indent=2))
        # Lets scripts/clients.sh refuse a push that would undo this change.
        write_text(os.path.join(ROOT, '.changed-at'), f"{info['passwordChangedAt']} {secrets.token_hex(4)}\n")

        write_text(new_ptr, json.dumps({'id': folder}))
        os.remove(old_ptr)
    return 200


def start_attempt(ip: str) -> Optional[float]:
    """Counts an attempt as failed up front, so concurrent requests can't all
    get past the limit before any of them fails; forgive() takes it back if it
    didn't fail. Returns the attempt's timestamp, or None if over the limit."""
    now = time.monotonic()
    with rate_lock:
        for addr in list(failures):  # prune, so the dict can't grow forever
            recent = [t for t in failures[addr] if now - t < FAIL_WINDOW]
            if recent:
                failures[addr] = recent
            else:
                del failures[addr]
        attempts = failures.setdefault(ip, [])
        if len(attempts) >= FAIL_LIMIT:
            return None
        attempts.append(now)
        return now


def forgive(ip: str, stamp: float) -> None:
    with rate_lock:
        attempts = failures.get(ip, [])
        if stamp in attempts:
            attempts.remove(stamp)
        if not attempts:
            failures.pop(ip, None)


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
        attempt = start_attempt(ip)
        if attempt is None:
            return self.reply(429)

        status = self.handle_change()
        if status != 404:  # only a wrong current password counts against the IP
            forgive(ip, attempt)
        self.reply(status)

    def handle_change(self) -> int:
        try:
            length = int(self.headers.get('Content-Length') or 0)
        except ValueError:
            return 400
        if length <= 0 or length > MAX_BODY:
            return 400
        try:
            body = json.loads(self.rfile.read(length))
        except ValueError:
            return 400
        if not isinstance(body, dict):
            return 400

        old_key, new_key = body.get('oldKey'), body.get('newKey')
        if not all(isinstance(k, str) and KEY_RE.fullmatch(k) for k in (old_key, new_key)):
            return 400

        try:
            return change_password(old_key, new_key)
        except TimeoutError as err:
            self.log_error('change postponed: %s', err)
            return 503
        except OSError as err:
            self.log_error('change failed: %s', err)
            return 500


if __name__ == '__main__':
    print(f'portal-api on 127.0.0.1:8787, client files in {ROOT}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8787), Handler).serve_forever()
