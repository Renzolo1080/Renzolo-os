-- RENZOLO OS™ — statement acknowledgments (run once on an EXISTING database)
--
-- Records each founder's acknowledgment of a versioned statement, starting
-- with the RENZOLO Network™ Matching Statement. One row per founder, per
-- statement, per version. Founders may add their own row and read their
-- own rows; nobody edits or deletes a row from the browser. Safe to run
-- more than once; changes no existing rows.

create table if not exists acknowledgments (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references profiles(id) on delete cascade,
  statement text not null check (statement in ('matching')),
  version text not null check (char_length(version) between 1 and 20),
  acknowledged_at timestamptz not null default now(),
  source text not null default 'login' check (source in ('registration', 'login')),
  user_agent text check (user_agent is null or char_length(user_agent) <= 400),
  unique (founder_id, statement, version)
);

alter table acknowledgments enable row level security;

do $$ begin
  create policy "acknowledgments: self or staff can read" on acknowledgments for select
    using (founder_id = auth.uid() or is_staff());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "acknowledgments: self can add" on acknowledgments for insert
    with check (founder_id = auth.uid());
exception when duplicate_object then null; end $$;

-- A record of agreement must not change after the fact.
revoke update, delete on acknowledgments from authenticated, anon;
