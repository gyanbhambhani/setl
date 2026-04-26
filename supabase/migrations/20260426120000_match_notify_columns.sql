-- Post-match notifications and landlord chase cron support.
alter table public.matches
  add column if not exists landlord_notified_at timestamptz;
alter table public.matches
  add column if not exists landlord_responded_at timestamptz;
alter table public.matches
  add column if not exists nudge_sent_at timestamptz;

alter table public.listings
  add column if not exists response_rate double precision default null;

alter table public.listings
  add column if not exists neighborhood text;
