# Client Portal — Setup

The portal lives at **https://portal.manndev.com/**. Each client signs in with a username and password and can change the password from the dashboard. Everything is static files, except one tiny standard-library Python service that handles password changes (§4).

## How it works

Two kinds of files, kept apart on purpose:

- **Data folder**, one per client, named with a permanent random id (32 hex characters):
  - `client-files/<id>/info.json`: `{ "name": "...", "username": "...", "file": "<zip filename>", "uploadedAt": "...", "passwordChangedAt": "..." }` (the last field only after the client changes their own password)
  - `client-files/<id>/<zip filename>`: the deliverable itself
  - `client-files/<id>/preview/`: optional, the zip's contents unzipped if it looked like a static site (has an `index.html`). The dashboard shows a "View live preview" link when it exists.
- **Login pointer**, one per client: `client-files/_logins/<key>.json` → `{ "id": "<id>" }`.

`<key>` is a PBKDF2-SHA256 hash (150,000 iterations, salt `manndev-portal:v1:<lowercased username>`) of the client's password, as 64 hex characters. The login page derives it in the browser, fetches the pointer, then fetches `/client-files/<id>/info.json`. A wrong username or password derives a different key and gets a 404. Neither folder is a directory listing, so clients can't be enumerated.

Why the split: a password change only swaps the pointer, so the data folder and any live-preview link you've shared (which contains the `<id>`) never change, and a preview link never doubles as a login.

The server never stores a password, only derived keys, so **passwords can't be recovered**. If a client forgets theirs, use **Reset password** in the admin page. This is a static "secret path" pattern rather than a full auth server (the static files have no rate limiting), but with generated passwords (12 characters, ~70 bits) and the deliberately slow hash, guessing a login isn't practical.

`client-files/` is gitignored (this repo is public) and synced with `scripts/clients.sh`.

## 1. Manage clients with the admin page

`admin.html` is deployed alongside the portal (`https://portal.manndev.com/admin.html`), gated by a client-side password prompt (see `admin-gate.ts` — hashed, but not real security; anyone reading the JS bundle could brute-force it, it just keeps casual visitors out). It uses the File System Access API (Chrome/Edge only) to write directly into a folder you pick on your own machine — the tool never talks to the server directly, so picking a folder there doesn't give a stranger access to your real `client-files/`.

For local iteration: `cd portal-src && npm install && npm run dev`, then open `http://localhost:5173/admin.html`.

**Pull first.** Clients can change their password on the server, so your local copy goes stale. Always start with:

```bash
./scripts/clients.sh pull
```

1. **Choose folder** → pick the `client-files/` folder in your local checkout of this repo. It's remembered for next time.
2. **New client:** fill in a username, a password (one is generated for you; copy it before saving), the client's name, and their zip file → **Save client**. `__MACOSX/` cruft and dotfiles are stripped, and a live preview is unpacked if the zip has an `index.html` at its root (or in a single wrapping folder).
3. **Existing clients** each have:
   - **Update file**: replace the zip (and preview). The login is untouched.
   - **Reset password**: new password for the same username; the old one stops working after you push.
   - **Remove**: deletes the client's data folder and login.
   - A **"Password changed by client"** note with the date, when they've changed it themselves (you'll only see it after a pull).

Usernames must be unique; the form refuses one that's already taken.

## 2. Deploy

```bash
./scripts/build-portal.sh   # builds portal-src into portal/
git add portal-src portal
git commit -m "Update client portal"
git push
```

Then on the server: `git pull`.

`client-files/` is separate — it never goes through git. Push it to the server after editing clients:

```bash
./scripts/clients.sh push
```

Both `pull` and `push` mirror exactly (`rsync --delete`). When the API changes a password it stamps `client-files/.changed-at`; `push` compares the server's stamp with the one you last pulled and refuses if they differ, so pushing a stale copy can't undo a client's change (or delete their new login).

**Permissions:** the admin page can create files nginx can't read (`700`/`600`), which makes a correct login fail like a wrong one. A cron job on the server (`crontab -l` as `lmann`) re-chmods `client-files/` to `755`/`644` every 5 minutes. To fix it immediately: `ssh lmann@lionelmann.com "find /srv/www/manndev/client-files -mindepth 1 -type d -exec chmod 755 {} \; ; find /srv/www/manndev/client-files -mindepth 1 -type f -exec chmod 644 {} \;"`.

The portal is built with `base: '/'` in `vite.config.ts` and fetches `/client-files/…` and `/img/…` by absolute path, so the subdomain's nginx block serves the built `portal/` folder at `/` and the repo root's `client-files/` and `img/` folders alongside it:

```nginx
server {
    server_name portal.manndev.com;
    root /srv/www/manndev;                      # so /img/ and /client-files/ resolve

    location / {
        root /srv/www/manndev/portal;           # the built portal
        try_files $uri $uri/ =404;
    }
    location /img/          { try_files $uri =404; }
    location /client-files/ { try_files $uri $uri/ =404; }   # $uri/ needed for preview/ dirs
    location /api/ {                                          # password changes, see §4
        proxy_pass http://127.0.0.1:8787;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 4k;
    }

    # listen 443 ssl + certificate lines are added by certbot
}
```

The main site deliberately does **not** serve the portal. The `portal/`, `portal-src/` and `client-files/` folders still sit in the `manndev.com` web root (the subdomain serves them from there), so the HTTPS `manndev.com` server block refuses them:

```nginx
location ~ ^/(portal|portal-src|client-files)(/|$) {
    return 404;
}
```

This rule must live only in the `manndev.com` block, never in the `portal.manndev.com` one: there it would also match `/client-files/` and make every login look invalid.

DNS: an `A` record (or `CNAME` to `manndev.com`) for `portal` pointing at the same server. TLS: `sudo certbot --nginx -d portal.manndev.com`.

## 3. Give the client their login

Send the username and password separately if you can (e.g. username by email, password by text). They go to https://portal.manndev.com/, sign in, and get their files. They can change the password from the dashboard ("Change password") at any time.

## 4. Password-change service

`portal-src/server/portal_api.py` (Python 3 standard library only) listens on `127.0.0.1:8787` and exposes one endpoint, `POST /api/change-password` with `{ "oldKey", "newKey" }`. The dashboard derives both keys in the browser from the username plus the current and new passwords. The service checks that the old key's pointer exists, writes the new pointer, deletes the old one, stamps `passwordChangedAt` in the client's `info.json` and updates `client-files/.changed-at`. It never sees a password. Failed attempts are limited to 10 per IP per 15 minutes.

Install once on the server (after `git pull`):

```bash
sudo cp /srv/www/manndev/portal-src/server/portal-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now portal-api
sudo systemctl status portal-api
```

It runs as `lmann` (the owner of `client-files/`) and may only write inside `client-files/`. After a code change: `sudo systemctl restart portal-api`. Logs: `journalctl -u portal-api`.
