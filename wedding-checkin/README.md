# Wedding Seating Check-In (Angular + Supabase)

Mobile-friendly wedding check-in system with:

- Guest search page (`/`)
- Guest details page (`/guest/:id`)
- Protected admin login page (`/admin/login`) using Supabase Auth email/password
- Protected admin management page (`/admin`) with CRUD, check-in status, datetime, search, and pagination

## 1) Required Supabase schema

Current app expects `public.guests` columns:

- `id uuid primary key`
- `guest_name text not null`
- `table_name text`
- `table_code text`
- `seat_code text`
- `seat_number text`
- `original_text text`
- `checked_in boolean not null default false`
- `checked_in_at timestamptz`

Run this migration SQL:

```sql
alter table public.guests
  add column if not exists guest_name text,
  add column if not exists table_name text,
  add column if not exists table_code text,
  add column if not exists seat_code text,
  add column if not exists seat_number text,
  add column if not exists original_text text,
  add column if not exists checked_in boolean not null default false,
  add column if not exists checked_in_at timestamptz;

create index if not exists guests_guest_name_idx on public.guests (guest_name);
create index if not exists guests_checked_in_idx on public.guests (checked_in);
```

If `guest_name` is empty but old `full_name` has data:

```sql
update public.guests
set guest_name = coalesce(guest_name, full_name)
where guest_name is null;
```

## 2) RLS policies for frontend CRUD

```sql
alter table public.guests enable row level security;

drop policy if exists guests_select_anon on public.guests;
create policy guests_select_anon
on public.guests
for select
to anon
using (true);

drop policy if exists guests_insert_anon on public.guests;
create policy guests_insert_authenticated
on public.guests
for insert
to authenticated
with check (true);

drop policy if exists guests_update_anon on public.guests;
create policy guests_update_authenticated
on public.guests
for update
to authenticated
using (true)
with check (true);

drop policy if exists guests_delete_anon on public.guests;
create policy guests_delete_authenticated
on public.guests
for delete
to authenticated
using (true);
```

This keeps guest search readable by public users, while admin CRUD requires authenticated login.

## 3) Supabase Auth admin setup

1. In Supabase dashboard: Authentication -> Users -> Add user.
2. Create your admin email/password user.
3. Use those credentials at `/admin/login`.

## 4) Environment configuration

Update both files:

- [src/environments/environment.ts](src/environments/environment.ts)
- [src/environments/environment.prod.ts](src/environments/environment.prod.ts)

```ts
export const environment = {
  production: false,
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_PUBLISHABLE_KEY'
};
```

## 5) Run locally

```bash
npm install
npm start
```

## 6) Deploy to Vercel

1. Push to GitHub.
2. In Vercel settings:
3. Root Directory: `wedding-checkin`
4. Build Command: `npm run build`
5. Output Directory: `dist/wedding-checkin/browser`
6. Redeploy latest commit.

## 7) Search, pagination, and datetime behavior

- Admin search filters by `guest_name`.
- Search resets list to page 1.
- Pagination uses page size 20.
- Check-in toggle updates:
  - `checked_in`
  - `checked_in_at` (ISO timestamp)
- Admin table displays `checked_in_at` using local date formatting.

## 8) Security notes

- Use only Supabase publishable key in frontend.
- Never place Supabase secret/service role key in app code.
- Rotate secret keys if previously exposed.

## Project scripts

- `npm start` - Run dev server
- `npm run build` - Create production build
- `npm test` - Run unit tests
