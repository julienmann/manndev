# Client Portal — Setup

## 1. Create the Supabase project

Create a project at supabase.com. In Project Settings → API, copy the Project URL and anon public key into `portal/.env` (copy from `.env.example`).

In Authentication → Providers, leave Email enabled and turn **off** "Confirm email" if you want the magic link to sign people in immediately on click (default Supabase behavior already does this for OTP/magic-link sign-in).

In Authentication → URL Configuration, add your portal's deployed URL (e.g. `https://dev.julienmann.ca/portal/dashboard.html`) to the Redirect URLs allow list, so `emailRedirectTo` is accepted.

## 2. Create the `client_projects` table

Run this in the Supabase SQL editor:

```sql
create table client_projects (
  user_id uuid primary key references auth.users (id) on delete cascade,
  business_name text,
  stage smallint check (stage between 0 and 4),
  launched_at timestamptz,
  live_url text,
  last_updated_at timestamptz,
  last_security_check_at timestamptz
);

alter table client_projects enable row level security;

create policy "Clients can read their own project"
  on client_projects for select
  using (auth.uid() = user_id);
```

Stages map to: `0` Brief & Discovery, `1` Design, `2` Build, `3` Review & Refine, `4` Launch. Once a project is live, set `launched_at` to switch that client's view from the status tracker to the maintenance dashboard.

## 3. Onboard a client

1. Have them visit the portal and request a magic link once — this creates their `auth.users` row.
2. In the Supabase Table Editor, insert a row into `client_projects` using that user's `id` (find it in Authentication → Users) as `user_id`, with their `business_name` and starting `stage`.
3. Update `stage`, `last_updated_at`, and `last_security_check_at` manually as the project progresses. There's no admin UI yet — this is a deliberate first-pass scope decision; revisit if managing more than a handful of clients by hand becomes painful.

## 4. Local development

```bash
cd portal-src
npm install
cp .env.example .env   # then fill in your Supabase values
npm run dev
```

## 5. Deployment

The production server only runs `git pull` — it has no Node/build step. So the build output is committed straight into the repo at the top-level `portal/` directory (separate from `portal-src/`, which is the app's source).

Whenever you change anything under `portal-src/`, rebuild and re-commit the artifacts:

```bash
./scripts/build-portal.sh   # rebuilds portal-src and refreshes the top-level portal/ folder
git add portal-src portal
git commit -m "Update client portal"
git push
```

Then on the server: `git pull`. Since the app is built with `base: '/portal/'` in `vite.config.ts`, its asset and redirect paths already assume it's served from `/portal` on the same domain as the marketing site — no separate subdomain or DNS entry needed.
