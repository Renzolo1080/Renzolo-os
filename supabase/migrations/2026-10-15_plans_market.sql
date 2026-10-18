-- Full assessment, Plan Builder, AI plan review, Market Intelligence and
-- the customisable dashboard. Safe to run more than once.

-- Dashboard: which ready-made view a founder last chose ('custom' means
-- their own cards, kept in dashboard_widgets in the order they picked).
alter table profiles add column if not exists dashboard_view text not null default 'overview';
do $$ begin
  alter table profiles add constraint profiles_dashboard_view_check
    check (dashboard_view in ('overview', 'investor', 'customer', 'operations', 'plan', 'custom'));
exception when duplicate_object then null; end $$;
grant update (dashboard_view) on profiles to authenticated;

-- One living strategic plan per founder, built in the guided Plan Builder
-- (no uploads: every plan has the same shape, so it can be reviewed and
-- tracked). `data` is validated by the app (lib/plan.ts sanitizePlan).
create table if not exists strategic_plans (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null unique references profiles(id) on delete cascade,
  -- The assessment the plan was last checked against.
  assessment_id uuid references assessments(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  completeness integer not null default 0 check (completeness between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- AI reviews of a plan. Written by the server only, so a review can't be
-- made up from the browser; founders read their own.
create table if not exists plan_reviews (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references profiles(id) on delete cascade,
  plan_id uuid not null references strategic_plans(id) on delete cascade,
  -- The plan's updated_at when it was reviewed, to tell when it has
  -- changed since.
  plan_updated_at timestamptz not null,
  overall integer not null check (overall between 0 and 100),
  result jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists plan_reviews_founder_idx on plan_reviews (founder_id, created_at desc);

-- Market Intelligence briefs (AI with live web research), refreshed
-- monthly. Server-written, founder-readable.
create table if not exists market_briefs (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references profiles(id) on delete cascade,
  industry text not null,
  country text not null,
  markdown text not null,
  sources jsonb not null default '[]'::jsonb,
  -- Structured plan recommendations and target checks (lib/market.ts).
  insights jsonb not null default '{}'::jsonb,
  -- The plan's updated_at when the brief was written.
  plan_updated_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists market_briefs_founder_idx on market_briefs (founder_id, created_at desc);

alter table strategic_plans enable row level security;
alter table plan_reviews enable row level security;
alter table market_briefs enable row level security;

do $$ begin
  create policy "strategic_plans: owner" on strategic_plans for all
    using (founder_id = auth.uid()) with check (founder_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "strategic_plans: staff read" on strategic_plans for select using (is_staff());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "plan_reviews: self or staff" on plan_reviews for select using (founder_id = auth.uid() or is_staff());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "market_briefs: self or staff" on market_briefs for select using (founder_id = auth.uid() or is_staff());
exception when duplicate_object then null; end $$;

-- Progress against plan goals: each check-in records the actual value of
-- a goal's measure on a date (goal_id is the goal's id inside the plan).
create table if not exists goal_checkins (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references profiles(id) on delete cascade,
  goal_id text not null check (length(goal_id) between 1 and 40),
  value numeric not null,
  note text check (note is null or length(note) <= 500),
  checked_on date not null,
  created_at timestamptz not null default now()
);
create index if not exists goal_checkins_founder_idx on goal_checkins (founder_id, goal_id, checked_on);

-- The founder's monthly update: key numbers plus wins, challenges and
-- where they need help (the same shape as an investor update).
create table if not exists founder_updates (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references profiles(id) on delete cascade,
  -- First day of the month the update is for.
  period date not null check (extract(day from period) = 1),
  revenue numeric check (revenue is null or revenue >= 0),
  customers integer check (customers is null or customers >= 0),
  cash numeric,
  wins text check (wins is null or length(wins) <= 1500),
  challenges text check (challenges is null or length(challenges) <= 1500),
  asks text check (asks is null or length(asks) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (founder_id, period)
);

alter table goal_checkins enable row level security;
alter table founder_updates enable row level security;
do $$ begin
  create policy "goal_checkins: owner" on goal_checkins for all
    using (founder_id = auth.uid()) with check (founder_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "goal_checkins: staff read" on goal_checkins for select using (is_staff());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "founder_updates: owner" on founder_updates for all
    using (founder_id = auth.uid()) with check (founder_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "founder_updates: staff read" on founder_updates for select using (is_staff());
exception when duplicate_object then null; end $$;
