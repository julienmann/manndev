# Client Portal — Setup

No Supabase, no database, no backend. Access is a 4-digit code per client. Each code maps to a folder containing one zip file, served as a plain static file.

(This replaces the old Supabase-backed portal and its companion `admin-src`/`admin-api`/`admin` apps, which managed a `client_projects` table and live-preview zip uploads — both retired since nothing here reads that data anymore.)

## How it works

- `client-files/<pin>/info.json` — `{ "name": "...", "file": "<zip filename>", "uploadedAt": "..." }`
- `client-files/<pin>/<zip filename>` — the deliverable itself

The portal's login page does `fetch('/client-files/<pin>/info.json')`. A 200 means the code is valid; the dashboard reads that same file to show the client's name and a download link. There's no way to list all codes — the folder isn't a directory listing, so it just returns 404 for anything wrong. This is a static-hosting "secret path" pattern, not real authentication: a 4-digit code is only 10,000 combinations and there's no rate limiting, so it's fine as a casual gate but not for anything where an unauthorized download would actually matter.

`client-files/` is gitignored at the repo root — this repo (`julienmann/manndev`) is public on GitHub, so client deliverables and their codes never touch git. It's managed locally and pushed to the server directly.

## 1. Manage clients with the local admin page

`admin.html` (in `portal-src/`) is a small local-only tool — it's excluded from the production build on purpose, so it only exists when you run the dev server on your own machine. It uses the File System Access API (Chrome/Edge only) to write directly into a folder you pick, no server involved.

```bash
cd portal-src
npm install
npm run dev
```

Then open `http://localhost:5173/admin.html`:

1. **Choose folder** → pick (or create) a `client-files/` folder in your local checkout of this repo. It's remembered for next time.
2. Fill in a 4-digit code, the client's name, and their zip file → **Save client**. This writes the `info.json` + zip into `client-files/<pin>/`.
3. The "Existing clients" list shows everything currently in the folder, so you can see codes already in use before picking a new one.

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
rsync -av client-files/ user@host:/srv/www/manndev/client-files/
```

Since the app is built with `base: '/portal/'` in `vite.config.ts`, it assumes `/portal/` and `/client-files/` are sibling paths served from the same domain — no separate subdomain or DNS entry needed, just make sure the web server serves the repo root's static folders as-is.

## 3. Give the client their code

Send the 4-digit code however you'd send a door code (text, in person, etc.). They go to the portal, enter it, and get a download link. Updating their file later is just re-running the admin flow with the same code — it overwrites (with a confirmation prompt).
