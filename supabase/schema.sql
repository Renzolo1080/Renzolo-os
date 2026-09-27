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
  -- Which OPTIONAL dashboard widgets this founder has chosen to show,
  -- beyond the standard view (Venture Score, sub-scores, Health Index,
  -- report/subscribe, and the Founder Tools link, which are never
  -- optional). Valid values: 'reminders', 'valuation', 'goalsProgress'.
  dashboard_widgets jsonb not null default '["reminders","valuation","goalsProgress","progressOverview"]'::jsonb,
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
  business_type text,
  employee_count text,
  years_in_business text,
  annual_revenue text,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  scored_at timestamptz
);

-- One row per BMC block per assessment. `measures` holds the six 0-100
-- scores (clarity, evidence, economics, scalability, defensibility, risk)
-- as JSON so the scoring engine (lib/scoring.ts) can consume it directly.
create type goal_progress_status as enum ('not_started', 'on_track', 'at_risk', 'behind', 'done');

create table block_responses (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  block_key text not null,
  current_state text,
  future_state text,
  goal_target text,
  -- Structured target date for the founder's goal_target text above —
  -- separate from the free-text description so reminders/progress
  -- tracking have something to actually compute against.
  target_date date,
  progress_status goal_progress_status not null default 'not_started',
  progress_note text,
  progress_updated_at timestamptz,
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
  -- Instant valuation estimate (lib/valuation.ts) — a directional range,
  -- never a formal appraisal. valuation_method is 'qualitative' or
  -- 'revenue_multiple'; valuation_basis is the human-readable explanation
  -- shown alongside the range so it's never presented as an opaque number.
  valuation_low numeric,
  valuation_high numeric,
  valuation_method text,
  valuation_basis text,
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

-- Added for the free Readiness Snapshot lead-gen funnel (public, no login
-- required) — captures the lead and a quick preview score, per the
-- Phase 1 spec's "abbreviated BMC pass" lead-generation offer.
create table snapshot_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text,
  venture_stage text,
  industry text,
  block_ratings jsonb not null,
  preview_score numeric not null,
  preview_tier text not null,
  converted_to_user_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table snapshot_leads enable row level security;

-- Anyone (including anonymous visitors) can submit a snapshot lead, but
-- only advisors/admins can read the list back — this is a lead-capture
-- form, not a public dataset.
create policy "snapshot_leads: anyone can insert" on snapshot_leads for insert
  with check (true);
create policy "snapshot_leads: staff can read" on snapshot_leads for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('advisor','admin')));

-- Advisors/admins need to update reports (mark reviewed), not just read them.
create policy "reports: staff can update" on reports for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('advisor','admin')));

-- Paid 1:1 Advisor Coaching Session upsell — separate from the base
-- subscription. The AI Diagnostic Report is delivered instantly (see
-- app/api/report/route.ts); this is an optional add-on a founder can buy
-- after seeing their report, not a gate on receiving it. Scheduling
-- itself stays manual (Keep Manual) for launch — an advisor follows up
-- to actually put time on the calendar once a session is paid for.
create type advisor_session_status as enum ('requested', 'scheduled', 'completed', 'canceled');

create table advisor_sessions (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references profiles(id) on delete cascade,
  report_id uuid references reports(id),
  status advisor_session_status not null default 'requested',
  price numeric not null,
  currency text not null default 'USD',
  flutterwave_tx_ref text,
  advisor_id uuid references profiles(id),
  scheduled_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

alter table advisor_sessions enable row level security;

create policy "advisor_sessions: self or staff" on advisor_sessions for select
  using (founder_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('advisor','admin')));
create policy "advisor_sessions: founder can insert own" on advisor_sessions for insert
  with check (founder_id = auth.uid());
create policy "advisor_sessions: staff can update" on advisor_sessions for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('advisor','admin')));

-- Singleton settings row admins can flip at runtime (no redeploy needed).
-- qa_review_enabled controls whether EVERY new report is queued for a
-- human advisor to read before advisor_reviewed flips true — turn it on
-- during a pilot/testing phase, off once volume makes 100% human review
-- infeasible. Regardless of this flag, a Low-confidence report (thin
-- self-reported evidence) is always queued for review — see the
-- requiresReview logic in app/api/report/route.ts. Report delivery to
-- the founder is never gated on this either way (Keep Manual note: the
-- toggle changes the QA workflow, never what the founder receives).
create table app_settings (
  id boolean primary key default true,
  qa_review_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id),
  constraint app_settings_singleton check (id)
);

insert into app_settings (id, qa_review_enabled) values (true, true);

alter table app_settings enable row level security;

create policy "app_settings: admin can select" on app_settings for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "app_settings: admin can update" on app_settings for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Founder-created milestones (Founder Tools: milestone/goal planner).
-- Deliberately simple — one flat list per assessment, optionally tied to
-- a BMC block — rather than a separate quarterly/monthly hierarchy, per
-- the "not too complex" scope decision for this feature.
create table milestones (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  block_key text,
  title text not null,
  target_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table milestones enable row level security;

create policy "milestones: via assessment ownership" on milestones for all
  using (exists (select 1 from assessments a where a.id = assessment_id and (a.founder_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('advisor','admin')))));

-- Founder Tools, third tool: Recommendations — targets/goals/next-steps
-- surfaced from two sources: the AI Diagnostic Report's own action plan
-- (source='ai', parsed automatically — see lib/recommendations.ts and
-- app/api/report/route.ts) and a human advisor/coach adding their own
-- (source='advisor', app/advisor page). One shared table so a founder
-- sees both in one place on /tools.
create type recommendation_source as enum ('ai', 'advisor');

create table recommendations (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  report_id uuid references reports(id),
  source recommendation_source not null,
  block_key text,
  title text not null,
  detail text,
  -- Set for source='ai' rows to their position in the report's own
  -- "Recommended Next Steps" list (already ordered most-important-first
  -- by the AI prompt) — lets the dashboard's condensed Progress Overview
  -- pull the TOP few reliably, since created_at alone can't distinguish
  -- order within one bulk insert. Left null for source='advisor' rows,
  -- which sort by recency instead.
  priority integer,
  advisor_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table recommendations enable row level security;

create policy "recommendations: via assessment ownership" on recommendations for all
  using (exists (select 1 from assessments a where a.id = assessment_id and (a.founder_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('advisor','admin')))));
