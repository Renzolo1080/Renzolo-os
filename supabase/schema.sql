-- RENZOLO OS™ — Phase 1 Launch MVP schema
-- Run this in the Supabase SQL editor for a new project.

create type user_role as enum ('founder', 'advisor', 'admin');
create type assessment_status as enum ('in_progress', 'submitted', 'scored', 'reviewed');
create type subscription_status as enum ('none', 'active', 'past_due', 'canceled');
create type billing_interval as enum ('monthly', 'annual');

-- Extends Supabase's built-in auth.users with app-specific profile data.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role user_role not null default 'founder',
  country text,
  venture_stage text,
  industry text,
  created_at timestamptz not null default now()
);

create table assessments (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references profiles(id) on delete cascade,
  status assessment_status not null default 'in_progress',
  venture_stage text,
  industry text,
  geography text,
  time_horizon text,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  scored_at timestamptz
);

-- One row per BMC block per assessment. `measures` holds the six 0-100
-- scores (clarity, evidence, economics, scalability, defensibility, risk)
-- as JSON so the scoring engine (lib/scoring.ts) can consume it directly.
create table block_responses (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  block_key text not null,
  current_state text,
  future_state text,
  goal_target text,
  evidence_uploaded boolean not null default false,
  measures jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (assessment_id, block_key)
);

create table evidence_files (
  id uuid primary key default gen_random_uuid(),
  block_response_id uuid not null references block_responses(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  uploaded_at timestamptz not null default now()
);

-- One row per completed scoring run — kept so reassessment can show
-- progress over time rather than overwriting the prior score.
create table scores (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  venture_score numeric not null,
  venture_tier text not null,
  market_subscore numeric not null,
  customer_subscore numeric not null,
  investor_subscore numeric not null,
  health_index numeric not null,
  health_confidence text not null,
  evidence_completeness numeric not null,
  block_scores jsonb not null,
  gaps jsonb not null,
  created_at timestamptz not null default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  score_id uuid not null references scores(id) on delete cascade,
  diagnostic_markdown text not null,
  ninety_day_plan jsonb,
  advisor_reviewed boolean not null default false,
  advisor_id uuid references profiles(id),
  -- Keep Manual (Phase 1 spec): advisor review stays a human step; these
  -- two columns just track the SLA the business has committed to.
  review_due_by timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references profiles(id) on delete cascade,
  status subscription_status not null default 'none',
  billing_interval billing_interval,
  flutterwave_customer_id text,
  flutterwave_plan_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

-- Row Level Security: founders only see their own data; advisors/admins
-- see everything (kept simple for launch — refine per-advisor scoping
-- once the advisor-review workflow ships).
alter table profiles enable row level security;
alter table assessments enable row level security;
alter table block_responses enable row level security;
alter table evidence_files enable row level security;
alter table scores enable row level security;
alter table reports enable row level security;
alter table subscriptions enable row level security;

create policy "profiles: self or staff" on profiles for select
  using (id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('advisor','admin')));
create policy "profiles: self update" on profiles for update using (id = auth.uid());

create policy "assessments: owner or staff" on assessments for all
  using (founder_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('advisor','admin')));

create policy "block_responses: via assessment ownership" on block_responses for all
  using (exists (select 1 from assessments a where a.id = assessment_id and (a.founder_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('advisor','admin')))));

create policy "scores: via assessment ownership" on scores for select
  using (exists (select 1 from assessments a where a.id = assessment_id and (a.founder_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('advisor','admin')))));

create policy "reports: via assessment ownership" on reports for select
  using (exists (select 1 from assessments a where a.id = assessment_id and (a.founder_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('advisor','admin')))));

create policy "subscriptions: self or staff" on subscriptions for select
  using (founder_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('advisor','admin')));

-- Auto-create a profile row whenever a new auth user signs up.
create function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
