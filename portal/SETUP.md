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
cd portal
npm install
cp .env.example .env   # then fill in your Supabase values
npm run dev
```

## 5. Deployment

Deploy `portal/`'s build output (`portal/dist`) to the `/portal` path of the main site (e.g. copy it into `/portal` on the same host that serves the marketing site, so it's reachable at `https://dev.julienmann.ca/portal/`). The app is built with `base: '/portal/'` in `vite.config.ts`, so its asset and redirect paths are already subpath-aware — no separate subdomain or DNS entry needed. Add the env vars from `.env.example` wherever the build step runs.
