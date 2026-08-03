# Wedding Seating Check-In (Angular + Supabase)

Mobile-friendly wedding guest check-in system:

- Guest page (`/`): Search guest name, check in, and open details page
- Guest details (`/guest/:id`): Show table/seat/check-in info
- Admin dashboard (`/admin`): Search guests and monitor check-in status

## 1) Supabase table setup

Create a `guests` table in Supabase SQL Editor:

```sql
create table if not exists public.guests (
	id uuid primary key default gen_random_uuid(),
	full_name text not null,
	table_name text,
	seat_label text,
	party_size int default 1,
	checked_in boolean not null default false,
	checked_in_at timestamptz
);

create index if not exists guests_full_name_idx
on public.guests (full_name);
```

Optional sample data:

```sql
insert into public.guests (full_name, table_name, seat_label, party_size)
values
	('Aisyah Rahman', 'Jasmine 1', 'A1', 2),
	('Hafiz Zulkifli', 'Jasmine 2', 'B4', 1),
	('Nur Amira', 'Rose 1', 'C2', 3);
```

## 2) Supabase access policy

For quick prototype testing, you can enable row level security and create broad policies:

```sql
alter table public.guests enable row level security;

create policy "Allow read guests"
on public.guests
for select
to anon
using (true);

create policy "Allow update guests"
on public.guests
for update
to anon
using (true)
with check (true);
```

For production, tighten policies or use authenticated admin access.

## 3) Environment configuration

Update [src/environments/environment.ts](src/environments/environment.ts):

```ts
export const environment = {
	production: false,
	supabaseUrl: 'https://YOUR-PROJECT.supabase.co',
	supabaseAnonKey: 'YOUR_ANON_KEY'
};
```

## 4) Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200`.

## 5) QR code flow

After deployment, generate a QR code that points to your public URL root (example: `https://your-app.vercel.app/`).
When guests scan the QR code, they land directly on the guest search/check-in home page.

## 6) Deploy to Vercel

1. Push this project to GitHub.
2. Import the repo in Vercel.
3. Build command: `npm run build`
4. Output directory: `dist/wedding-checkin/browser`
5. Add environment variables in Vercel (recommended):
	 - `SUPABASE_URL`
	 - `SUPABASE_ANON_KEY`

If you want to switch from file-based config to runtime env variables, add a runtime config endpoint or build-time replacement per environment.

## Project scripts

- `npm start` - Run dev server
- `npm run build` - Create production build
- `npm test` - Run unit tests
