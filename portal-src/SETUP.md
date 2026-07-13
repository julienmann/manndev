# Client Portal — Setup

No Supabase, no database, no backend. Access is a 4-digit code per client. Each code maps to a folder containing one zip file, served as a plain static file.

(This replaces the old Supabase-backed portal and its companion `admin-src`/`admin-api`/`admin` apps, which managed a `client_projects` table and live-preview zip uploads — both retired since nothing here reads that data anymore.)

## How it works

- `client-files/<pin>/info.json` — `{ "name": "...", "file": "<zip filename>", "uploadedAt": "..." }`
- `client-files/<pin>/<zip filename>` — the deliverable itself
- `client-files/<pin>/preview/` — optional: the zip's contents unzipped, if it looked like a static site (has an `index.html`). The dashboard shows a "View live preview" link when this folder exists, in addition to the download.

The portal's login page does `fetch('/client-files/<pin>/info.json')`. A 200 means the code is valid; the dashboard reads that same file to show the client's name and a download link. There's no way to list all codes — the folder isn't a directory listing, so it just returns 404 for anything wrong. This is a static-hosting "secret path" pattern, not real authentication: a 4-digit code is only 10,000 combinations and there's no rate limiting, so it's fine as a casual gate but not for anything where an unauthorized download would actually matter.

The nginx location block for `/client-files/` needs `try_files $uri $uri/ =404;` (not just `try_files $uri =404;`) — the `$uri/` clause is what lets a `preview/` directory request resolve to its `index.html` instead of 404ing.

`client-files/` is gitignored at the repo root — this repo (`julienmann/manndev`) is public on GitHub, so client deliverables and their codes never touch git. It's managed locally and pushed to the server directly.

## 1. Manage clients with the admin page

`admin.html` is deployed alongside the portal (`/portal/admin.html`), gated by a client-side password prompt (see `admin-gate.ts` — hashed, but not real security; anyone reading the JS bundle could brute-force it, it just keeps casual visitors out). It uses the File System Access API (Chrome/Edge only) to write directly into a folder you pick on your own machine — the tool never talks to the server directly, so picking a folder there doesn't give a stranger access to your real `client-files/`.

For local iteration: `cd portal-src && npm install && npm run dev`, then open `http://localhost:5173/admin.html`.

1. **Choose folder** → pick (or create) a `client-files/` folder in your local checkout of this repo. It's remembered for next time.
2. Fill in a 4-digit code, the client's name, and their zip file → **Save client**. This writes `info.json` + the zip into `client-files/<pin>/`, and — if the zip has an `index.html` at its root (or in a single wrapping folder) — also unzips it into `client-files/<pin>/preview/` for the live-preview link. `__MACOSX/` cruft and dotfiles are stripped automatically. If no `index.html` is found, the file is still saved, just without a preview.
3. The "Existing clients" list shows everything currently in the folder (and whether each has a preview), so you can see codes already in use before picking a new one.

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

**Permissions note:** the File System Access API (used by `admin.html`) can create files/folders too restrictive for nginx's worker user to read (e.g. `700`/`600`), which makes even a correct code silently fail the same way an invalid one does. The obvious fix — `rsync --chmod=D755,F644` — doesn't work on macOS's stock rsync (it's `openrsync`, a BSD reimplementation that accepts the flag but silently no-ops it; the GNU-style `D755,F644` syntax is rejected outright as "invalid argument"). Instead, a cron job on the server (`crontab -l` as `lmann`) re-chmods `client-files/` to `755`/`644` every 5 minutes, scoped only to that one directory. So a sync with wrong permissions self-heals within a few minutes rather than needing a special rsync invocation. If you need it fixed immediately rather than waiting: `ssh lmann@lionelmann.com "find /srv/www/manndev/client-files -mindepth 1 -type d -exec chmod 755 {} \; ; find /srv/www/manndev/client-files -mindepth 1 -type f -exec chmod 644 {} \;"`.

Since the app is built with `base: '/portal/'` in `vite.config.ts`, it assumes `/portal/` and `/client-files/` are sibling paths served from the same domain — no separate subdomain or DNS entry needed, just make sure the web server serves the repo root's static folders as-is.

## 3. Give the client their code

Send the 4-digit code however you'd send a door code (text, in person, etc.). They go to the portal, enter it, and get a download link. Updating their file later is just re-running the admin flow with the same code — it overwrites (with a confirmation prompt).
