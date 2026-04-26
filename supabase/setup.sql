-- Setl v1 schema
-- Run this in the Supabase SQL editor for a fresh project, or via the
-- Supabase CLI. After creation, also create a public Storage bucket named
-- "listing-videos" (Storage > New Bucket > Public). The dashboard step is
-- the safest place to manage Storage configuration.

create extension if not exists "pgcrypto";

-- Renters ---------------------------------------------------------------
create table if not exists public.renters (
  id            uuid primary key default gen_random_uuid(),
  email         text,
  budget_min    int,
  budget_max    int,
  move_date     date,
  roommates     int,
  neighborhoods text[],
  dealbreakers  text[],
  description   text,
  created_at    timestamptz not null default now()
);

create index if not exists renters_created_at_idx
  on public.renters (created_at desc);

create index if not exists renters_email_idx
  on public.renters (email);

-- Listings --------------------------------------------------------------
create table if not exists public.listings (
  id              uuid primary key default gen_random_uuid(),
  landlord_email  text,
  landlord_phone  text,
  address         text,
  rent            int,
  available_date  date,
  bedrooms        int,
  bathrooms       numeric(3,1),
  amenities       text[],
  video_url       text,
  photo_urls      text[],
  status          text not null default 'pending',
  created_at      timestamptz not null default now()
);

alter table public.listings
  add column if not exists photo_urls text[];

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'listings_status_check'
  ) then
    alter table public.listings
      add constraint listings_status_check
      check (status in ('pending', 'approved', 'rejected'));
  end if;
end$$;

create index if not exists listings_created_at_idx
  on public.listings (created_at desc);

-- Partial indexes scoped by status (skill: query-partial-indexes).
create index if not exists listings_pending_created_at_idx
  on public.listings (created_at desc) where status = 'pending';

create index if not exists listings_approved_created_at_idx
  on public.listings (created_at desc) where status = 'approved';

-- Matches ---------------------------------------------------------------
create table if not exists public.matches (
  id          uuid primary key default gen_random_uuid(),
  renter_id   uuid references public.renters(id) on delete cascade,
  listing_id  uuid references public.listings(id) on delete cascade,
  direction   text not null,
  created_at  timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'matches_direction_check'
  ) then
    alter table public.matches
      add constraint matches_direction_check
      check (direction in ('left', 'right'));
  end if;
end$$;

-- Foreign-key indexes (skill: query-missing-indexes).
create index if not exists matches_renter_id_idx
  on public.matches (renter_id);

create index if not exists matches_listing_id_idx
  on public.matches (listing_id);

-- Prevent duplicate swipes for the same renter / listing pair.
create unique index if not exists matches_renter_listing_unique
  on public.matches (renter_id, listing_id);

-- Row Level Security ----------------------------------------------------
-- v1 writes/reads happen through API route handlers using the service
-- role key, so we lock all client-side access. Re-open with explicit
-- policies when client SDK access is needed.
alter table public.renters  enable row level security;
alter table public.listings enable row level security;
alter table public.matches  enable row level security;

-- Storage ---------------------------------------------------------------
-- Manual: create a public bucket named "listing-videos" in the Supabase
-- dashboard. Files are written via the service-role key from the API
-- route, and reads are public via the bucket's public URL.
