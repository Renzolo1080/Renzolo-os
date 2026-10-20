-- RENZOLO OS™ — Phase 1 Launch MVP schema
-- Run this in the Supabase SQL editor for a new project.

-- Table access for the API roles, stated explicitly.
-- From 30 Oct 2026 Supabase no longer grants anon, authenticated and
-- service_role access to new tables in "public" automatically. This script
-- was written and tested against the old behaviour: the API roles hold
-- table privileges, and row level security plus the explicit revokes below
-- decide what each role can actually do. These lines keep that model for
-- every table this script creates; the last lines of the file switch the
-- automatic grants off again, so tables added later by migrations must
-- grant access themselves (see supabase/migrations/README.md).
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;

create type user_role as enum ('founder', 'advisor', 'admin');
create type assessment_status as enum ('in_progress', 'submitted', 'scored', 'reviewed');
create type subscription_status as enum ('none', 'active', 'past_due', 'canceled');
create type billing_interval as enum ('monthly', 'annual', 'quarterly');

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
  -- Quick Check answers with no column of their own: main goal, funding
  -- need, registration status, biggest challenges, where they heard of us.
  extra jsonb not null default '{}'::jsonb,
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
  -- Paid-through date. NULL with status 'active' means a manual grant
  -- that never expires (see isSubscriptionActive in lib/payments.ts).
  current_period_end timestamptz,
  -- True only when the founder chose card auto-renewal through a
  -- Flutterwave Payment Plan; mobile-money and other one-off payments
  -- buy a single period and are renewed by paying again.
  auto_renew boolean not null default false,
  -- The email Flutterwave has for this payer, used to match automatic
  -- renewal charges back to the founder.
  billing_email text,
  -- What the next AUTOMATIC card renewal is expected to be, fixed at the
  -- moment the founder chose auto-renew. Renewal charges are checked
  -- against these, not against today's price settings, so changing a
  -- price later doesn't strand existing subscribers.
  renewal_interval billing_interval,
  renewal_amount numeric,
  renewal_currency text,
  updated_at timestamptz not null default now()
);

-- One subscription row per founder; the app saves subscriptions with an
-- upsert on founder_id, which requires this.
create unique index subscriptions_founder_id_key on subscriptions (founder_id);
create index subscriptions_billing_email_idx on subscriptions (billing_email);

-- Role checks used by the policies below. These MUST be security-definer
-- functions rather than inline "exists (select ... from profiles ...)"
-- subqueries: a policy on profiles that itself reads profiles makes
-- Postgres raise "infinite recursion detected in policy for relation
-- profiles", which breaks every logged-in query in the app. Running as
-- the function owner reads the caller's own role without re-entering
-- row level security.
create or replace function is_staff() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('advisor','admin'));
$$;

create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

-- Whether the signed-in founder currently has paid access. Mirrors
-- isSubscriptionActive in lib/payments.ts (test/db.test.ts checks the two
-- agree): status 'active' AND (no end date — a manual grant — OR the end
-- date, plus a 3-day grace while a card auto-renewal is retried, is still
-- ahead). Takes no founder argument on purpose, so one founder can't use
-- it to find out whether another is subscribed.
create or replace function has_active_subscription() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions s
    where s.founder_id = auth.uid()
      and s.status = 'active'
      and (s.current_period_end is null
           or s.current_period_end + (case when s.auto_renew then interval '3 days' else interval '0' end) > now())
  );
$$;

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
  using (id = auth.uid() or is_staff());
create policy "profiles: self update" on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- A founder may edit their own profile details but never their own role:
-- without this, any signed-in user could set role = 'admin' on their own
-- row from the browser and read every founder's data. Roles are changed
-- only from the Supabase dashboard / service role.
revoke update on profiles from authenticated, anon;
grant update (full_name, country, venture_stage, industry, dashboard_widgets) on profiles to authenticated;

create policy "assessments: owner or staff" on assessments for all
  using (founder_id = auth.uid() or is_staff());

create policy "block_responses: via assessment ownership" on block_responses for all
  using (exists (select 1 from assessments a where a.id = assessment_id and (a.founder_id = auth.uid() or is_staff())));

-- scores and reports are read-only to founders on purpose: both are
-- written server-side with the service role (app/api/score and
-- app/api/report) after the route has confirmed ownership, so a Venture
-- Score or report can't be fabricated from the browser.
create policy "scores: via assessment ownership" on scores for select
  using (exists (select 1 from assessments a where a.id = assessment_id and (a.founder_id = auth.uid() or is_staff())));

-- A founder can read their own reports only while their subscription is
-- active — the report is the paid product, so the lock has to hold in the
-- database, not just in the page that displays it.
create policy "reports: via assessment ownership" on reports for select
  using (is_staff() or (has_active_subscription() and exists (select 1 from assessments a where a.id = assessment_id and a.founder_id = auth.uid())));

create policy "subscriptions: self or staff" on subscriptions for select
  using (founder_id = auth.uid() or is_staff());

-- Auto-create a profile row whenever a new auth user signs up.
create function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

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
  company_name text,
  -- Full Snapshot answers, carried into the founder's account when they
  -- sign up with the same confirmed email (lib/snapshot-save.ts).
  answers jsonb,
  plan_score numeric,
  converted_to_user_id uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index snapshot_leads_email_unclaimed on snapshot_leads (email) where converted_to_user_id is null;

alter table snapshot_leads enable row level security;

-- Anyone (including anonymous visitors) can submit a snapshot lead, but
-- only advisors/admins can read the list back — this is a lead-capture
-- form, not a public dataset.
create policy "snapshot_leads: anyone can insert" on snapshot_leads for insert
  with check (true);
create policy "snapshot_leads: staff can read" on snapshot_leads for select
  using (is_staff());

-- Advisors/admins need to update reports (mark reviewed), not just read them.
create policy "reports: staff can update" on reports for update
  using (is_staff());

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
  -- Set by the server once Flutterwave confirms the payment. The advisor
  -- queue only lists sessions where this is set.
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table advisor_sessions enable row level security;

create policy "advisor_sessions: self or staff" on advisor_sessions for select
  using (founder_id = auth.uid() or is_staff());
-- No insert policy for founders on purpose: sessions are created
-- server-side (app/api/advisor-session/checkout) so a founder can't
-- create one from the browser already marked as paid.
create policy "advisor_sessions: staff can update" on advisor_sessions for update
  using (is_staff());

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
  using (is_admin());
create policy "app_settings: admin can update" on app_settings for update
  using (is_admin());

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
  using (exists (select 1 from assessments a where a.id = assessment_id and (a.founder_id = auth.uid() or is_staff())));

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
  using (exists (select 1 from assessments a where a.id = assessment_id and (a.founder_id = auth.uid() or is_staff())));

-- 60-Second Readiness Quiz leads (marketing lead-gen for social
-- media/website — see lib/quiz.ts). Deliberately separate from
-- snapshot_leads: the quiz is a much shorter, coarser qualifying tool
-- one step earlier in the funnel (quiz -> free Snapshot -> full
-- Assessment + subscription), not a second copy of the real product.
create table quiz_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text,
  answers jsonb not null,
  challenge text,
  urgency text,
  score numeric not null,
  tier text not null,
  converted_to_user_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table quiz_leads enable row level security;

create policy "quiz_leads: anyone can insert" on quiz_leads for insert with check (true);
create policy "quiz_leads: staff can read" on quiz_leads for select
  using (is_staff());

-- Payments: one row per checkout this app starts with Flutterwave. It
-- records the amount and currency we EXPECT, so that when Flutterwave
-- reports a payment it can be checked against this row before any access
-- is granted, and granted exactly once (see lib/payments.ts). Automatic
-- card renewals, which Flutterwave charges on its own, are recorded here
-- too. Founders can read their own rows; only the server writes.
create type payment_status as enum ('pending', 'successful', 'failed');
create type payment_product as enum ('subscription', 'advisor_session', 'assessment', 'coaching');

create table payments (
  id uuid primary key default gen_random_uuid(),
  tx_ref text not null unique,
  founder_id uuid not null references profiles(id) on delete cascade,
  product payment_product not null,
  billing_interval billing_interval,
  auto_renew boolean not null default false,
  advisor_session_id uuid references advisor_sessions(id) on delete set null,
  amount numeric not null check (amount > 0),
  currency text not null,
  status payment_status not null default 'pending',
  flutterwave_transaction_id text unique,
  paid_amount numeric,
  note text,
  created_at timestamptz not null default now(),
  fulfilled_at timestamptz,
  -- When this still-pending payment was last re-checked with Flutterwave
  -- (see reconcilePendingPayments in lib/payments.ts).
  last_checked_at timestamptz
);

create index payments_founder_id_idx on payments (founder_id);

alter table payments enable row level security;

create policy "payments: self or staff" on payments for select
  using (founder_id = auth.uid() or is_staff());

-- Records an automatic card renewal (a charge Flutterwave made by itself
-- under a Payment Plan) and extends the subscription, as one step. Safe
-- to call again for the same transaction: the second call changes nothing.
-- Returns 'fulfilled', 'already_fulfilled', or 'no_auto_renew'.
create or replace function record_renewal(
  p_founder uuid, p_transaction_id text, p_amount numeric, p_currency text,
  p_customer_email text, p_customer_id text, p_now timestamptz default now()
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  sub public.subscriptions%rowtype;
begin
  select * into sub from public.subscriptions where founder_id = p_founder for update;
  if not found or not sub.auto_renew or sub.renewal_interval is null then
    return 'no_auto_renew';
  end if;

  begin
    insert into public.payments
      (tx_ref, founder_id, product, billing_interval, auto_renew, amount, currency, status,
       flutterwave_transaction_id, paid_amount, fulfilled_at, note)
    values
      ('flw-renewal-' || p_transaction_id, p_founder, 'subscription', sub.renewal_interval, true,
       p_amount, p_currency, 'successful', p_transaction_id, p_amount, p_now, 'automatic card renewal');
  exception when unique_violation then
    return 'already_fulfilled';
  end;

  perform extend_subscription(p_founder, sub.renewal_interval, true, p_customer_email, p_customer_id,
                              coalesce(sub.renewal_amount, p_amount), coalesce(sub.renewal_currency, p_currency), p_now);
  return 'fulfilled';
end;
$$;

-- Only the server (service role) may record a card renewal.
revoke all on function record_renewal(uuid, text, numeric, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function record_renewal(uuid, text, numeric, text, text, text, timestamptz) to service_role;

-- =====================================================================
-- Founder Trajectory(TM) membership tiers (same as
-- supabase/migrations/2026-10-13_tiers.sql).
-- =====================================================================
--  * Three tiers (Essentials, Growth, Elevate) on the subscription and on
--    each membership payment. An upgrade starts at once; a downgrade is
--    scheduled for the end of the current period.
--  * The one-time Readiness Assessment ($79) and coaching sessions are
--    new products. Coaching (bought or included in Growth/Elevate) is held
--    as credits that are used to book a session.
--  * An Elevate waitlist, for when seats are full.
--  * Reports bought with the one-time assessment stay readable without a
--    membership.

do $$ begin
  create type membership_tier as enum ('essentials', 'growth', 'elevate');
exception when duplicate_object then null; end $$;

alter table subscriptions add column if not exists tier membership_tier;
-- A downgrade that has been paid for: takes over from scheduled_from.
alter table subscriptions add column if not exists scheduled_tier membership_tier;
alter table subscriptions add column if not exists scheduled_from timestamptz;

alter table payments add column if not exists tier membership_tier;
alter table payments add column if not exists change_kind text;
-- Credit for unused time taken off this payment (upgrades), and unused
-- time worth more than the payment, given as extra days instead.
alter table payments add column if not exists credit_applied numeric not null default 0;
alter table payments add column if not exists extra_days numeric not null default 0;
-- Coaching sessions bought in this payment.
alter table payments add column if not exists quantity integer;
do $$ begin
  alter table payments add constraint payments_change_kind_check check (change_kind is null or change_kind in ('new', 'renewal', 'upgrade', 'downgrade'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table payments add constraint payments_extra_days_check check (extra_days >= 0 and extra_days <= 400 and credit_applied >= 0);
exception when duplicate_object then null; end $$;

-- One-time Readiness Assessment purchases.
create table if not exists assessment_purchases (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references profiles(id) on delete cascade,
  payment_id uuid unique references payments(id) on delete set null,
  purchased_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists assessment_purchases_founder_idx on assessment_purchases (founder_id);

-- Coaching sessions a founder can book: bought (valid a year) or included
-- in Growth (2 per quarter) or Elevate (2 per month). Included sessions
-- don't roll over: each batch expires at the end of its period.
create table if not exists coaching_credits (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references profiles(id) on delete cascade,
  source text not null check (source in ('membership', 'purchase', 'manual')),
  tier membership_tier,
  quantity integer not null check (quantity > 0),
  used integer not null default 0,
  available_from timestamptz not null,
  expires_at timestamptz not null,
  payment_id uuid references payments(id) on delete set null,
  created_at timestamptz not null default now(),
  check (used >= 0 and used <= quantity),
  check (expires_at > available_from)
);
create index if not exists coaching_credits_founder_idx on coaching_credits (founder_id, expires_at);

create table if not exists elevate_waitlist (
  founder_id uuid primary key references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  notified_at timestamptz
);

alter table advisor_sessions add column if not exists coaching_credit_id uuid references coaching_credits(id) on delete set null;
alter table reports add column if not exists assessment_purchase_id uuid references assessment_purchases(id) on delete set null;
-- 'summary' for Essentials, 'full' for Growth, Elevate and the one-time assessment.
alter table reports add column if not exists level text not null default 'full';
do $$ begin
  alter table reports add constraint reports_level_check check (level in ('summary', 'full'));
exception when duplicate_object then null; end $$;

alter table assessment_purchases enable row level security;
alter table coaching_credits enable row level security;
alter table elevate_waitlist enable row level security;
-- Founders read their own rows; all writes are made by the server.
do $$ begin
  create policy "assessment_purchases: self or staff" on assessment_purchases for select using (founder_id = auth.uid() or is_staff());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "coaching_credits: self or staff" on coaching_credits for select using (founder_id = auth.uid() or is_staff());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "elevate_waitlist: self or staff" on elevate_waitlist for select using (founder_id = auth.uid() or is_staff());
exception when duplicate_object then null; end $$;

-- A report stays readable to its owner while they're a member, or for
-- good if it was bought with the one-time assessment.
alter policy "reports: via assessment ownership" on reports
  using (is_staff() or (
    exists (select 1 from assessments a where a.id = assessment_id and a.founder_id = auth.uid())
    and (has_active_subscription() or assessment_purchase_id is not null)
  ));

create or replace function tier_rank(t membership_tier) returns integer
  language sql immutable set search_path = public as $$
  select case t::text when 'essentials' then 1 when 'growth' then 2 when 'elevate' then 3 else 0 end;
$$;

-- Included coaching for one paid period of a tier, as credits that expire
-- at the end of each quarter (Growth) or month (Elevate).
create or replace function grant_included_coaching(
  p_founder uuid, p_tier membership_tier, p_start timestamptz, p_months integer, p_payment uuid
) returns void
  language plpgsql security definer set search_path = public as $$
declare
  chunk integer;
  n integer;
  i integer;
begin
  if p_tier::text = 'growth' then chunk := 3;
  elsif p_tier::text = 'elevate' then chunk := 1;
  else return;
  end if;
  n := greatest(1, p_months / chunk);
  for i in 0 .. n - 1 loop
    insert into public.coaching_credits (founder_id, source, tier, quantity, available_from, expires_at, payment_id)
    values (p_founder, 'membership', p_tier, 2,
            ((p_start at time zone 'UTC') + make_interval(months => i * chunk)) at time zone 'UTC',
            ((p_start at time zone 'UTC') + make_interval(months => (i + 1) * chunk)) at time zone 'UTC',
            p_payment);
  end loop;
end;
$$;

-- Applies one paid membership period and returns the new paid-through
-- date. The subscription row is locked while it runs. Mirrors planChange
-- in lib/membership.ts:
--  * no membership, or a lapsed one: a new period starting now;
--  * a higher tier (upgrade): starts now, plus any extra days the unused
--    time was worth (worked out at checkout);
--  * the same tier (renewal): added on after the current period, so time
--    already paid for is never lost;
--  * a lower tier (downgrade): added on after the current period, and the
--    current tier is kept until then (scheduled_tier / scheduled_from);
--  * a manual never-expiring grant stays never-expiring.
-- Periods are calendar months counted in UTC whatever the database's time
-- zone. p_tier null means "the tier already in force" (card renewals).
create or replace function apply_membership(
  p_founder uuid, p_tier membership_tier, p_interval billing_interval, p_extra_days numeric,
  p_auto_renew boolean, p_email text, p_customer_id text, p_amount numeric, p_currency text,
  p_now timestamptz, p_payment uuid
) returns timestamptz
  language plpgsql security definer set search_path = public as $$
declare
  s public.subscriptions%rowtype;
  has_row boolean;
  cur membership_tier;
  tgt membership_tier;
  months integer := case p_interval::text when 'annual' then 12 when 'quarterly' then 3 else 1 end;
  step interval;
  extra interval := make_interval(secs => greatest(0, coalesce(p_extra_days, 0)) * 86400);
  is_active boolean;
  start_at timestamptz;
  new_end timestamptz;
begin
  step := make_interval(months => months);
  select * into s from public.subscriptions where founder_id = p_founder for update;
  has_row := found;
  if has_row and s.scheduled_tier is not null and s.scheduled_from <= p_now then
    s.tier := s.scheduled_tier;
    s.scheduled_tier := null;
    s.scheduled_from := null;
  end if;
  cur := coalesce(s.tier, 'essentials');
  tgt := coalesce(p_tier, cur);
  is_active := has_row and s.status = 'active' and (
    s.current_period_end is null
    or s.current_period_end + (case when s.auto_renew then interval '3 days' else interval '0' end) > p_now);

  if not has_row then
    start_at := p_now;
    new_end := (((p_now at time zone 'UTC') + step) at time zone 'UTC') + extra;
    insert into public.subscriptions
      (founder_id, status, tier, billing_interval, current_period_end, auto_renew, billing_email,
       flutterwave_customer_id, renewal_interval, renewal_amount, renewal_currency, updated_at)
    values
      (p_founder, 'active', tgt, p_interval, new_end, p_auto_renew, lower(p_email), p_customer_id,
       case when p_auto_renew then p_interval end,
       case when p_auto_renew then p_amount end,
       case when p_auto_renew then p_currency end,
       p_now);
  else
    if is_active and s.current_period_end is null then
      start_at := p_now;
      new_end := null;
      if tier_rank(tgt) > tier_rank(cur) then s.tier := tgt; end if;
    elsif not is_active then
      start_at := p_now;
      new_end := (((p_now at time zone 'UTC') + step) at time zone 'UTC') + extra;
      s.tier := tgt; s.scheduled_tier := null; s.scheduled_from := null;
    elsif tier_rank(tgt) > tier_rank(cur) then
      start_at := p_now;
      new_end := (((p_now at time zone 'UTC') + step) at time zone 'UTC') + extra;
      s.tier := tgt; s.scheduled_tier := null; s.scheduled_from := null;
    elsif tier_rank(tgt) < tier_rank(cur) then
      start_at := s.current_period_end;
      new_end := ((s.current_period_end at time zone 'UTC') + step) at time zone 'UTC';
      s.scheduled_tier := tgt; s.scheduled_from := s.current_period_end;
    else
      start_at := greatest(s.current_period_end, p_now);
      new_end := ((start_at at time zone 'UTC') + step) at time zone 'UTC';
      s.tier := cur; s.scheduled_tier := null; s.scheduled_from := null;
    end if;

    update public.subscriptions set
      status = 'active',
      tier = s.tier,
      scheduled_tier = s.scheduled_tier,
      scheduled_from = s.scheduled_from,
      billing_interval = p_interval,
      current_period_end = new_end,
      auto_renew = s.auto_renew or p_auto_renew,
      billing_email = coalesce(lower(p_email), s.billing_email),
      flutterwave_customer_id = coalesce(p_customer_id, s.flutterwave_customer_id),
      renewal_interval = case when p_auto_renew then p_interval else s.renewal_interval end,
      renewal_amount = case when p_auto_renew then p_amount else s.renewal_amount end,
      renewal_currency = case when p_auto_renew then p_currency else s.renewal_currency end,
      updated_at = p_now
    where founder_id = p_founder;
  end if;

  perform grant_included_coaching(p_founder, tgt, start_at, months, p_payment);
  return new_end;
end;
$$;

-- The original one-period extension, kept for card renewals and earlier
-- callers: renews the tier already in force.
create or replace function extend_subscription(
  p_founder uuid, p_interval billing_interval, p_auto_renew boolean,
  p_email text, p_customer_id text, p_amount numeric, p_currency text, p_now timestamptz
) returns timestamptz
  language plpgsql security definer set search_path = public as $$
begin
  return apply_membership(p_founder, null, p_interval, 0, p_auto_renew, p_email, p_customer_id, p_amount, p_currency, p_now, null);
end;
$$;

-- Marks a payment successful AND grants what it paid for, as ONE step:
-- either both happen or neither does, and never twice.
-- Returns 'fulfilled', or 'already_fulfilled' if it was granted before.
create or replace function fulfil_payment(
  p_payment_id uuid, p_transaction_id text, p_paid_amount numeric,
  p_customer_email text, p_customer_id text, p_now timestamptz default now()
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  pay public.payments%rowtype;
begin
  update public.payments
     set status = 'successful', flutterwave_transaction_id = p_transaction_id,
         paid_amount = p_paid_amount, fulfilled_at = p_now, note = null
   where id = p_payment_id and status <> 'successful'
  returning * into pay;
  if not found then
    return 'already_fulfilled';
  end if;

  if pay.product::text = 'subscription' then
    -- The renewal amount remembered for card auto-renewal is the full
    -- price, not a first payment reduced by an upgrade credit.
    perform apply_membership(pay.founder_id, pay.tier, coalesce(pay.billing_interval, 'monthly'), pay.extra_days, pay.auto_renew,
                             p_customer_email, p_customer_id, pay.amount + pay.credit_applied, pay.currency, p_now, pay.id);
  elsif pay.product::text = 'assessment' then
    insert into public.assessment_purchases (founder_id, payment_id, purchased_at)
    values (pay.founder_id, pay.id, p_now)
    on conflict (payment_id) do nothing;
  elsif pay.product::text = 'coaching' then
    insert into public.coaching_credits (founder_id, source, quantity, available_from, expires_at, payment_id)
    values (pay.founder_id, 'purchase', greatest(1, coalesce(pay.quantity, 1)), p_now,
            ((p_now at time zone 'UTC') + interval '1 year') at time zone 'UTC', pay.id);
  elsif pay.advisor_session_id is not null then
    update public.advisor_sessions set paid_at = p_now where id = pay.advisor_session_id and paid_at is null;
  end if;
  return 'fulfilled';
end;
$$;

-- Books a coaching session with the founder's soonest-expiring available
-- credit. Returns the new session's id, or null if they have no credit.
create or replace function use_coaching_credit(p_founder uuid, p_now timestamptz default now()) returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  c public.coaching_credits%rowtype;
  sid uuid;
begin
  select * into c from public.coaching_credits
   where founder_id = p_founder and used < quantity and available_from <= p_now and expires_at > p_now
   order by expires_at, created_at
   limit 1
   for update;
  if not found then
    return null;
  end if;
  update public.coaching_credits set used = used + 1 where id = c.id;
  insert into public.advisor_sessions (founder_id, status, price, currency, paid_at, notes, coaching_credit_id)
  values (p_founder, 'requested', 0, 'USD', p_now, 'Booked with a coaching session credit', c.id)
  returning id into sid;
  return sid;
end;
$$;

-- Only the server (service role) may run the functions that grant access.
revoke all on function tier_rank(membership_tier) from public, anon, authenticated;
revoke all on function grant_included_coaching(uuid, membership_tier, timestamptz, integer, uuid) from public, anon, authenticated;
revoke all on function apply_membership(uuid, membership_tier, billing_interval, numeric, boolean, text, text, numeric, text, timestamptz, uuid) from public, anon, authenticated;
revoke all on function extend_subscription(uuid, billing_interval, boolean, text, text, numeric, text, timestamptz) from public, anon, authenticated;
revoke all on function fulfil_payment(uuid, text, numeric, text, text, timestamptz) from public, anon, authenticated;
revoke all on function use_coaching_credit(uuid, timestamptz) from public, anon, authenticated;
grant execute on function tier_rank(membership_tier) to service_role;
grant execute on function grant_included_coaching(uuid, membership_tier, timestamptz, integer, uuid) to service_role;
grant execute on function apply_membership(uuid, membership_tier, billing_interval, numeric, boolean, text, text, numeric, text, timestamptz, uuid) to service_role;
grant execute on function extend_subscription(uuid, billing_interval, boolean, text, text, numeric, text, timestamptz) to service_role;
grant execute on function fulfil_payment(uuid, text, numeric, text, text, timestamptz) to service_role;
grant execute on function use_coaching_credit(uuid, timestamptz) to service_role;

-- =====================================================================
-- Growth launch (same as supabase/migrations/2026-10-14_growth.sql).
-- =====================================================================

-- Where a founder came from (first ad / post / partner / referral link).
alter table snapshot_leads add column if not exists attribution jsonb;
alter table snapshot_leads add column if not exists marketing_consent boolean not null default false;
alter table profiles add column if not exists attribution jsonb;
alter table profiles add column if not exists marketing_consent boolean not null default false;
-- Referral codes. Not in the founder-editable column list (see the grant
-- on profiles), so only the server can set them.
alter table profiles add column if not exists referral_code text;
alter table profiles add column if not exists referred_by text;
create unique index if not exists profiles_referral_code_key on profiles (referral_code);

-- One free month for the referrer when a founder they invited first pays
-- for a membership. Applied at once if the referrer has an active paid
-- membership, otherwise on their next membership payment.
create table if not exists referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references profiles(id) on delete cascade,
  referred_id uuid not null unique references profiles(id) on delete cascade,
  payment_id uuid references payments(id) on delete set null,
  months integer not null default 1 check (months between 1 and 12),
  applied_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists referral_rewards_referrer_idx on referral_rewards (referrer_id) where applied_at is null;

-- "I scored 62 on my Venture Readiness" links. Only the score and tier
-- are stored — no name, email or answers. Read by the server only.
create table if not exists shared_scores (
  token text primary key check (token ~ '^[A-Za-z0-9]{10,32}$'),
  venture_score numeric not null,
  venture_tier text not null,
  plan_score numeric,
  referral_code text,
  source text not null check (source in ('snapshot', 'member')),
  created_at timestamptz not null default now()
);

create table if not exists cohort_applications (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid references profiles(id) on delete set null,
  full_name text not null,
  email text not null,
  company text,
  country text,
  venture_stage text,
  cohort text not null check (cohort in ('foundations', 'growth', 'elevate', 'essentials_growth')),
  message text,
  attribution jsonb,
  created_at timestamptz not null default now()
);

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  company text,
  topic text not null,
  message text not null,
  attribution jsonb,
  created_at timestamptz not null default now()
);

-- Emails sent (one of each kind per address) and unsubscribes.
create table if not exists email_log (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  kind text not null,
  lead_id uuid references snapshot_leads(id) on delete set null,
  sent_at timestamptz not null default now(),
  unique (email, kind)
);
create table if not exists email_unsubscribes (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table referral_rewards enable row level security;
alter table shared_scores enable row level security;
alter table cohort_applications enable row level security;
alter table contact_messages enable row level security;
alter table email_log enable row level security;
alter table email_unsubscribes enable row level security;
-- Founders can see rewards they've earned; everything else is staff/server only.
do $$ begin
  create policy "referral_rewards: referrer or staff" on referral_rewards for select using (referrer_id = auth.uid() or is_staff());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "cohort_applications: staff" on cohort_applications for select using (is_staff());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "contact_messages: staff" on contact_messages for select using (is_staff());
exception when duplicate_object then null; end $$;

-- Records the reward when a referred founder's FIRST membership payment
-- lands, and applies it straight away if the referrer has an active paid
-- membership (a manual never-expiring grant needs no extra time).
create or replace function grant_referral_reward(p_founder uuid, p_payment uuid, p_now timestamptz) returns void
  language plpgsql security definer set search_path = public as $$
declare
  code text;
  referrer uuid;
  rid uuid;
  s public.subscriptions%rowtype;
begin
  select referred_by into code from public.profiles where id = p_founder;
  if code is null then return; end if;
  select id into referrer from public.profiles where referral_code = code;
  if referrer is null or referrer = p_founder then return; end if;
  if exists (select 1 from public.payments where founder_id = p_founder and product::text = 'subscription'
             and status = 'successful' and id <> p_payment) then
    return;
  end if;
  insert into public.referral_rewards (referrer_id, referred_id, payment_id, created_at)
  values (referrer, p_founder, p_payment, p_now)
  on conflict (referred_id) do nothing
  returning id into rid;
  if rid is null then return; end if;
  select * into s from public.subscriptions where founder_id = referrer for update;
  if found and s.status = 'active' and s.current_period_end is not null and s.current_period_end > p_now then
    update public.subscriptions
       set current_period_end = ((s.current_period_end at time zone 'UTC') + interval '1 month') at time zone 'UTC', updated_at = p_now
     where founder_id = referrer;
    update public.referral_rewards set applied_at = p_now where id = rid;
  end if;
end;
$$;

-- Adds any free months a founder has earned but not yet received to a
-- paid period that has just been applied.
create or replace function apply_pending_referral_rewards(p_founder uuid, p_now timestamptz) returns void
  language plpgsql security definer set search_path = public as $$
declare
  n integer;
begin
  select coalesce(sum(months), 0) into n from public.referral_rewards where referrer_id = p_founder and applied_at is null;
  if n = 0 then return; end if;
  update public.subscriptions
     set current_period_end = ((current_period_end at time zone 'UTC') + make_interval(months => n)) at time zone 'UTC', updated_at = p_now
   where founder_id = p_founder and current_period_end is not null;
  if found then
    update public.referral_rewards set applied_at = p_now where referrer_id = p_founder and applied_at is null;
  end if;
end;
$$;

create or replace function fulfil_payment(
  p_payment_id uuid, p_transaction_id text, p_paid_amount numeric,
  p_customer_email text, p_customer_id text, p_now timestamptz default now()
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  pay public.payments%rowtype;
begin
  update public.payments
     set status = 'successful', flutterwave_transaction_id = p_transaction_id,
         paid_amount = p_paid_amount, fulfilled_at = p_now, note = null
   where id = p_payment_id and status <> 'successful'
  returning * into pay;
  if not found then
    return 'already_fulfilled';
  end if;

  if pay.product::text = 'subscription' then
    -- The renewal amount remembered for card auto-renewal is the full
    -- price, not a first payment reduced by an upgrade credit.
    perform apply_membership(pay.founder_id, pay.tier, coalesce(pay.billing_interval, 'monthly'), pay.extra_days, pay.auto_renew,
                             p_customer_email, p_customer_id, pay.amount + pay.credit_applied, pay.currency, p_now, pay.id);
    perform apply_pending_referral_rewards(pay.founder_id, p_now);
    perform grant_referral_reward(pay.founder_id, pay.id, p_now);
  elsif pay.product::text = 'assessment' then
    insert into public.assessment_purchases (founder_id, payment_id, purchased_at)
    values (pay.founder_id, pay.id, p_now)
    on conflict (payment_id) do nothing;
  elsif pay.product::text = 'coaching' then
    insert into public.coaching_credits (founder_id, source, quantity, available_from, expires_at, payment_id)
    values (pay.founder_id, 'purchase', greatest(1, coalesce(pay.quantity, 1)), p_now,
            ((p_now at time zone 'UTC') + interval '1 year') at time zone 'UTC', pay.id);
  elsif pay.advisor_session_id is not null then
    update public.advisor_sessions set paid_at = p_now where id = pay.advisor_session_id and paid_at is null;
  end if;
  return 'fulfilled';
end;
$$;

revoke all on function grant_referral_reward(uuid, uuid, timestamptz) from public, anon, authenticated;
revoke all on function apply_pending_referral_rewards(uuid, timestamptz) from public, anon, authenticated;
revoke all on function fulfil_payment(uuid, text, numeric, text, text, timestamptz) from public, anon, authenticated;
grant execute on function grant_referral_reward(uuid, uuid, timestamptz) to service_role;
grant execute on function apply_pending_referral_rewards(uuid, timestamptz) to service_role;
grant execute on function fulfil_payment(uuid, text, numeric, text, text, timestamptz) to service_role;

-- ===== 2026-10-15: full assessment, Plan Builder, plan review, Market Intelligence, dashboard views =====
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

-- ===== 2026-10-16: coaching cycle (same as supabase/migrations/2026-10-16_coaching.sql) =====
-- Founder Trajectory(TM) Coaching Cycle: agreement, founder prep, coach
-- prep brief, GROW notes, commitments, rating. Safe to run more than once.
--
-- Coaching sessions live in advisor_sessions (one row per session, created
-- when a founder uses a coaching credit or buys a session). Founders can
-- read their own sessions; every write goes through the server, which
-- checks who is asking (founder: their own prep, commitment status and
-- rating; coach/admin: everything else).

alter table advisor_sessions add column if not exists kind text not null default 'coaching';
do $$ begin
  alter table advisor_sessions add constraint advisor_sessions_kind_check check (kind in ('coaching', 'quarterly_review'));
exception when duplicate_object then null; end $$;
-- What the founder wants from the session (focus, wins, challenge).
alter table advisor_sessions add column if not exists founder_prep jsonb not null default '{}'::jsonb;
-- AI-drafted brief for the coach, from the founder's report, plan and progress.
alter table advisor_sessions add column if not exists prep_brief text;
-- The coach's GROW notes: goal, reality, options, will. Coach-only.
alter table advisor_sessions add column if not exists coach_notes jsonb not null default '{}'::jsonb;
-- Notes the founder can see: a short summary of the session.
alter table advisor_sessions add column if not exists summary text;
-- Commitments agreed in the session: [{id, text, due, status, area}].
alter table advisor_sessions add column if not exists commitments jsonb not null default '[]'::jsonb;
alter table advisor_sessions add column if not exists completed_at timestamptz;
alter table advisor_sessions add column if not exists rating integer;
do $$ begin
  alter table advisor_sessions add constraint advisor_sessions_rating_check check (rating is null or rating between 1 and 5);
exception when duplicate_object then null; end $$;
alter table advisor_sessions add column if not exists feedback text;

-- Coach-only notes must never reach the founder's browser: signed-in
-- users may read every column EXCEPT coach_notes and prep_brief. The coach
-- pages read those with the service role after checking the coach's role.
revoke select on advisor_sessions from authenticated, anon;
grant select (id, founder_id, report_id, status, price, currency, flutterwave_tx_ref, advisor_id, scheduled_at, notes, paid_at, created_at,
              coaching_credit_id, kind, founder_prep, summary, commitments, completed_at, rating, feedback)
  on advisor_sessions to authenticated;

-- The founder's acceptance of the coaching agreement (confidentiality,
-- goals, rescheduling). One row per founder per agreement version.
create table if not exists coaching_agreements (
  founder_id uuid not null references profiles(id) on delete cascade,
  version text not null,
  accepted_at timestamptz not null default now(),
  primary key (founder_id, version)
);
alter table coaching_agreements enable row level security;
do $$ begin
  create policy "coaching_agreements: self or staff" on coaching_agreements for select using (founder_id = auth.uid() or is_staff());
exception when duplicate_object then null; end $$;

-- ===== 2026-10-17: cohort names (same as supabase/migrations/2026-10-17_cohort_names.sql) =====
-- Academy cohorts renamed so they can't be confused with membership
-- levels: Launch (8 weeks), Build (12 weeks) and Scale (6 months).
-- Safe to run more than once.
alter table cohort_applications drop constraint if exists cohort_applications_cohort_check;
update cohort_applications set cohort = case cohort
  when 'foundations' then 'launch'
  when 'essentials_growth' then 'launch'
  when 'growth' then 'build'
  when 'elevate' then 'scale'
  else cohort end
where cohort in ('foundations', 'essentials_growth', 'growth', 'elevate');
alter table cohort_applications add constraint cohort_applications_cohort_check
  check (cohort in ('launch', 'build', 'scale'));

-- ===== 2026-10-18: AI coaching (same as supabase/migrations/2026-10-18_ai_coach.sql) =====
-- AI coaching: conversations and weekly check-ins with the Founder
-- Trajectory(TM) AI coach. Every row is written by the server (which
-- checks access and the daily limit); founders read their own.
-- Safe to run more than once.
create table if not exists ai_coach_threads (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references profiles(id) on delete cascade,
  kind text not null default 'chat' check (kind in ('chat', 'checkin', 'insights')),
  title text not null check (length(title) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ai_coach_threads_founder_idx on ai_coach_threads (founder_id, updated_at desc);

create table if not exists ai_coach_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references ai_coach_threads(id) on delete cascade,
  founder_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (length(content) between 1 and 12000),
  -- Plan actions the coach suggested in this reply: [{area, text, due}].
  actions jsonb not null default '[]'::jsonb,
  -- Web pages the coach read for this reply: [{title, url}].
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ai_coach_messages_thread_idx on ai_coach_messages (thread_id, created_at);
create index if not exists ai_coach_messages_founder_idx on ai_coach_messages (founder_id, created_at desc);

alter table ai_coach_threads enable row level security;
alter table ai_coach_messages enable row level security;
do $$ begin
  create policy "ai_coach_threads: self or staff" on ai_coach_threads for select using (founder_id = auth.uid() or is_staff());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "ai_coach_messages: self or staff" on ai_coach_messages for select using (founder_id = auth.uid() or is_staff());
exception when duplicate_object then null; end $$;

-- Lorenzo · AI video sessions (Tavus). One row per session started; the
-- server writes them after checking access, consent and the monthly
-- limit. Founders read their own. Safe to run more than once.
create table if not exists ai_clone_sessions (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references profiles(id) on delete cascade,
  conversation_id text not null check (length(conversation_id) between 1 and 120),
  consent_version text not null check (length(consent_version) between 1 and 20),
  max_seconds integer not null check (max_seconds between 60 and 3600),
  created_at timestamptz not null default now()
);
create index if not exists ai_clone_sessions_founder_idx on ai_clone_sessions (founder_id, created_at desc);

alter table ai_clone_sessions enable row level security;
do $$ begin
  create policy "ai_clone_sessions: self or staff" on ai_clone_sessions for select using (founder_id = auth.uid() or is_staff());
exception when duplicate_object then null; end $$;
-- =====================================================================
-- Function privileges (same as supabase/migrations/2026-10-16_function_privileges.sql).
-- =====================================================================

revoke execute on function handle_new_user() from public, anon, authenticated;

-- is_staff(), is_admin() and has_active_subscription() are used by the
-- access rules, which run as the signed-in founder, so signed-in founders
-- keep access (each only ever answers about the caller). Signed-out
-- visitors never need them: everything they submit goes through the server.
revoke execute on function is_staff() from public, anon;
revoke execute on function is_admin() from public, anon;
revoke execute on function has_active_subscription() from public, anon;
grant execute on function is_staff() to authenticated, service_role;
grant execute on function is_admin() to authenticated, service_role;
grant execute on function has_active_subscription() to authenticated, service_role;
-- =====================================================================
-- Statement acknowledgments (same as supabase/migrations/2026-10-16_acknowledgments.sql).
-- =====================================================================

create table if not exists acknowledgments (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references profiles(id) on delete cascade,
  statement text not null check (statement in ('matching')),
  version text not null check (char_length(version) between 1 and 20),
  acknowledged_at timestamptz not null default now(),
  source text not null default 'login' check (source in ('checkout', 'login')),
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

-- ===== 2026-10-20: method guide leads (same as supabase/migrations/2026-10-20_guide_leads.sql) =====
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
-- Explicit grants (Supabase stops adding them automatically on 30 Oct 2026):
-- the server writes, signed-in staff read (the policy above), visitors get nothing.
grant select, insert, update, delete on guide_leads to service_role;
grant select on guide_leads to authenticated;
revoke all on guide_leads from anon;
revoke insert, update, delete on guide_leads from anon, authenticated;

-- End of the tables this script creates: from here on, new tables in
-- "public" get no automatic access (Supabase's behaviour from 30 Oct 2026).
alter default privileges in schema public revoke all on tables from anon, authenticated, service_role;
