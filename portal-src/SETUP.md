# Client Portal — Setup

No Supabase, no database, no backend. Each client signs in with a username and password. The pair maps to a folder containing one zip file, served as a plain static file.

(This replaces the old Supabase-backed portal and its companion `admin-src`/`admin-api`/`admin` apps, which managed a `client_projects` table and live-preview zip uploads — both retired since nothing here reads that data anymore.)

## How it works

- `client-files/<key>/info.json` — `{ "name": "...", "username": "...", "file": "<zip filename>", "uploadedAt": "..." }`
- `client-files/<key>/<zip filename>` — the deliverable itself
- `client-files/<key>/preview/` — optional: the zip's contents unzipped, if it looked like a static site (has an `index.html`). The dashboard shows a "View live preview" link when this folder exists, in addition to the download.

`<key>` is a PBKDF2-SHA256 hash (150,000 iterations, salt `manndev-portal:v1:<lowercased username>`) of the client's password, as 64 hex characters. The login page derives it in the browser and does `fetch('/client-files/<key>/info.json')`. A 200 means the username and password are right; the dashboard reads that same file to show the client's name and a download link. Any other pair derives a different key and gets a 404. The folder isn't a directory listing, so there's no way to enumerate clients.

The server never stores a password, only the derived folder name, so **passwords can't be recovered**. To change one, remove the client in the admin page and add them again with a new password. This is still a static "secret path" pattern rather than server-side authentication (there's no rate limiting and no lockout), but with the admin page's generated passwords (12 characters, ~70 bits) and the deliberately slow hash, guessing a login isn't practical, unlike the old 4-digit codes (10,000 combinations).

Folders named with 4 digits are clients from the old code system. The admin page marks them "old code"; **Set login** moves one onto a username and password, bringing its files along. The old code stops working once the change is pushed.

The nginx location block for `/client-files/` needs `try_files $uri $uri/ =404;` (not just `try_files $uri =404;`) — the `$uri/` clause is what lets a `preview/` directory request resolve to its `index.html` instead of 404ing.

`client-files/` is gitignored at the repo root — this repo (`julienmann/manndev`) is public on GitHub, so client deliverables and their folder keys never touch git. It's managed locally and pushed to the server directly.

## 1. Manage clients with the admin page

`admin.html` is deployed alongside the portal (`https://portal.manndev.com/admin.html`), gated by a client-side password prompt (see `admin-gate.ts` — hashed, but not real security; anyone reading the JS bundle could brute-force it, it just keeps casual visitors out). It uses the File System Access API (Chrome/Edge only) to write directly into a folder you pick on your own machine — the tool never talks to the server directly, so picking a folder there doesn't give a stranger access to your real `client-files/`.

For local iteration: `cd portal-src && npm install && npm run dev`, then open `http://localhost:5173/admin.html`.

1. **Choose folder** → pick (or create) a `client-files/` folder in your local checkout of this repo. It's remembered for next time.
2. Fill in a username, a password (one is generated for you; copy it before saving), the client's name, and their zip file → **Save client**. This writes `info.json` + the zip into `client-files/<key>/`, and — if the zip has an `index.html` at its root (or in a single wrapping folder) — also unzips it into `client-files/<key>/preview/` for the live-preview link. `__MACOSX/` cruft and dotfiles are stripped automatically. If no `index.html` is found, the file is still saved, just without a preview.
3. The "Existing clients" list shows everything currently in the folder: username, name, file, and whether each has a preview. Usernames must be unique; the form refuses one that's already taken.

## 2. Deploy

The production server only runs `git pull` for the portal app itself — the portal's compiled JS/CSS still goes through the normal flow:

```bash
./scripts/build-portal.sh   # rebuilds portal-src and refreshes the top-level portal/ folder
git add portal-src portal
git commit -m "Update client portal"
git push
```

Then on the server: `git pull`.

`client-files/` is separate — it never goes through git. Push it straight to the server with rsync whenever you add or update a client:

```bash
rsync -av client-files/ lmann@lionelmann.com:/srv/www/manndev/client-files/
```

**Permissions note:** the File System Access API (used by `admin.html`) can create files/folders too restrictive for nginx's worker user to read (e.g. `700`/`600`), which makes even a correct login silently fail the same way an invalid one does. The obvious fix — `rsync --chmod=D755,F644` — doesn't work on macOS's stock rsync (it's `openrsync`, a BSD reimplementation that accepts the flag but silently no-ops it; the GNU-style `D755,F644` syntax is rejected outright as "invalid argument"). Instead, a cron job on the server (`crontab -l` as `lmann`) re-chmods `client-files/` to `755`/`644` every 5 minutes, scoped only to that one directory. So a sync with wrong permissions self-heals within a few minutes rather than needing a special rsync invocation. If you need it fixed immediately rather than waiting: `ssh lmann@lionelmann.com "find /srv/www/manndev/client-files -mindepth 1 -type d -exec chmod 755 {} \; ; find /srv/www/manndev/client-files -mindepth 1 -type f -exec chmod 644 {} \;"`.

The portal lives at **https://portal.manndev.com/**. It's built with `base: '/'` in `vite.config.ts`, and still fetches `/client-files/…` and `/img/…` by absolute path, so the subdomain's nginx block serves the built `portal/` folder at `/` and the repo root's `client-files/` and `img/` folders alongside it:

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

Send the username and password separately if you can (e.g. username by email, password by text). They go to https://portal.manndev.com/, sign in, and get their files. Updating their file later is re-running the admin flow with the same username and password; it overwrites (with a confirmation prompt).

When you remove or migrate a client, the old folder is deleted locally, but plain `rsync -av` never deletes on the server. Either delete it there too, or sync with `--delete` (which makes the server's `client-files/` an exact mirror of your local one).
