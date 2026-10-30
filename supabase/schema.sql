-- =============================================================================
-- TSUKUYOMI WATCH — SUPABASE POSTGRES SCHEMA & STORAGE MIGRATION
-- Chapter V: Samurai Honours (Stargazer Authentication & Celestial Uploads)
-- =============================================================================
-- Run this script in your Supabase Dashboard -> SQL Editor -> New Query.

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. TABLE: public.stargazer_users
-- Stores Stargazer authentication profiles, crest avatars, Honor XP, and stamps
-- -----------------------------------------------------------------------------
create table if not exists public.stargazer_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text unique not null,
  name text not null,
  password_hash text,
  location text not null default 'Kyoto, JP',
  avatar text not null default '🌸',
  honor_xp integer not null default 150,
  rank_title text not null default 'Star Seeker',
  stamps text[] not null default array['Perseid Watcher']::text[],
  prefill_demo boolean not null default true,
  registered_at timestamptz not null default now(),
  last_login_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_stargazer_users_email on public.stargazer_users (email);
create index if not exists idx_stargazer_users_honor_xp on public.stargazer_users (honor_xp desc);

-- -----------------------------------------------------------------------------
-- 2. TABLE: public.celestial_uploads
-- Stores uploaded astrophotography images, EXIF verification telemetry,
-- Spirit Lens status, and Shared Sky community reactions
-- -----------------------------------------------------------------------------
create table if not exists public.celestial_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.stargazer_users(id) on delete cascade,
  user_email text not null,
  author_name text not null,
  author_avatar text not null default '🌸',
  item_id text not null,
  item_name text not null,
  category text not null,
  observation_location text not null,
  camera_make text,
  camera_model text,
  camera_gear text,
  captured_at timestamptz,
  gps_latitude double precision,
  gps_longitude double precision,
  image_url text,
  storage_path text,
  spirit_lens_enhanced boolean not null default false,
  shared_to_sky boolean not null default true,
  verification_passed boolean not null default true,
  match_score integer not null default 95,
  honor_awarded integer not null default 50,
  artwork_seed integer not null default 101,
  lantern_count integer not null default 1,
  bow_count integer not null default 1,
  exif_checks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_celestial_uploads_user_id on public.celestial_uploads (user_id);
create index if not exists idx_celestial_uploads_user_email on public.celestial_uploads (user_email);
create index if not exists idx_celestial_uploads_shared on public.celestial_uploads (shared_to_sky, created_at desc);

-- -----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- Allows client read/write using the Supabase anon/authenticated key for demo
-- and production flexibility
-- -----------------------------------------------------------------------------
alter table public.stargazer_users enable row level security;
alter table public.celestial_uploads enable row level security;

-- Grant explicit Data API access to anon and authenticated roles
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.stargazer_users to anon, authenticated;
grant select, insert, update, delete on table public.celestial_uploads to anon, authenticated;

drop policy if exists "Allow public read stargazer_users" on public.stargazer_users;
create policy "Allow public read stargazer_users"
  on public.stargazer_users for select
  using (true);

drop policy if exists "Allow public insert stargazer_users" on public.stargazer_users;
create policy "Allow public insert stargazer_users"
  on public.stargazer_users for insert
  with check (true);

drop policy if exists "Allow public update stargazer_users" on public.stargazer_users;
create policy "Allow public update stargazer_users"
  on public.stargazer_users for update
  using (true)
  with check (true);

drop policy if exists "Allow public read celestial_uploads" on public.celestial_uploads;
create policy "Allow public read celestial_uploads"
  on public.celestial_uploads for select
  using (true);

drop policy if exists "Allow public insert celestial_uploads" on public.celestial_uploads;
create policy "Allow public insert celestial_uploads"
  on public.celestial_uploads for insert
  with check (true);

drop policy if exists "Allow public update celestial_uploads" on public.celestial_uploads;
create policy "Allow public update celestial_uploads"
  on public.celestial_uploads for update
  using (true)
  with check (true);

-- -----------------------------------------------------------------------------
-- 4. SUPABASE STORAGE BUCKET: celestial-uploads
-- Stores full-resolution uploaded astrophotography images (JPEG / PNG / WebP)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('celestial-uploads', 'celestial-uploads', true)
on conflict (id) do nothing;

drop policy if exists "Public read access for celestial-uploads" on storage.objects;
create policy "Public read access for celestial-uploads"
  on storage.objects for select
  using (bucket_id = 'celestial-uploads');

drop policy if exists "Public upload access for celestial-uploads" on storage.objects;
create policy "Public upload access for celestial-uploads"
  on storage.objects for insert
  with check (bucket_id = 'celestial-uploads');

-- -----------------------------------------------------------------------------
-- 5. SEED STARTER COMMUNITY STARGAZERS (Idempotent)
-- -----------------------------------------------------------------------------
insert into public.stargazer_users (email, name, location, avatar, honor_xp, rank_title, stamps)
values
  ('aiko.mori@tsukuyomi.jp', 'Aiko Mori', 'Kyoto, JP', '🌸', 4820, 'Celestial Chronicler', array['Blood Moon Eclipse 2026', 'Perseid Watcher']),
  ('ren.takeda@tsukuyomi.jp', 'Ren Takeda', 'Hokkaido, JP', '🦉', 3650, 'Celestial Chronicler', array['Blood Moon Eclipse 2026']),
  ('mei.lin@tsukuyomi.tw', 'Mei Lin', 'Taipei, TW', '🏮', 2940, 'Constellation Keeper', array['Lunar Master']),
  ('elena.rossi@atacama.cl', 'Elena Rossi', 'Atacama, CL', '🔭', 2450, 'Constellation Keeper', array['Atacama Pioneer']),
  ('kenji.ito@tsukuyomi.jp', 'Kenji Ito', 'Nagano, JP', '🌙', 1890, 'Constellation Keeper', array[]::text[])
on conflict (email) do nothing;
