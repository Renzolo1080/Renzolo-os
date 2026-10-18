-- Founder Trajectory(TM) Method guide: people who downloaded the free guide
-- from the website and agreed to hear from RENZOLO. Server-written only
-- (no browser access); staff can read the list. Safe to run more than once.
create table if not exists guide_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (length(email) between 3 and 254),
  full_name text check (full_name is null or length(full_name) <= 120),
  country text check (country is null or length(country) <= 80),
  source text not null default 'website' check (length(source) between 1 and 40),
  guide_version text not null check (length(guide_version) between 1 and 20),
  consented_at timestamptz not null default now(),
  attribution jsonb,
  created_at timestamptz not null default now()
);
alter table guide_leads enable row level security;
do $$ begin
  create policy "guide_leads: staff read" on guide_leads for select using (is_staff());
exception when duplicate_object then null; end $$;
revoke insert, update, delete on guide_leads from anon, authenticated;
