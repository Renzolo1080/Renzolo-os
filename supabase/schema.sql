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
create type payment_product as enum ('subscription', 'advisor_session');

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

-- Adds one billing period to a founder's subscription and returns the new
-- paid-through date. The row is locked while it runs, so two payments
-- landing at the same moment each add their own period instead of one
-- overwriting the other.
--  * Time already paid for is never lost: paying early extends from the
--    existing end date; paying after a lapse starts a fresh period.
--  * A manual never-expiring grant (active, no end date) stays that way.
--  * A one-off payment never switches card auto-renewal off, and never
--    changes what the next automatic renewal is expected to be.
--  * "One month" / "one year" are calendar periods counted in UTC
--    (31 January + 1 month = 28 or 29 February), whatever time zone the
--    database happens to be set to.
create or replace function extend_subscription(
  p_founder uuid, p_interval billing_interval, p_auto_renew boolean,
  p_email text, p_customer_id text, p_amount numeric, p_currency text, p_now timestamptz
) returns timestamptz
  language plpgsql security definer set search_path = public as $$
declare
  step interval := case when p_interval = 'annual' then interval '1 year' else interval '1 month' end;
  new_end timestamptz;
begin
  insert into public.subscriptions as s
    (founder_id, status, billing_interval, current_period_end, auto_renew, billing_email,
     flutterwave_customer_id, renewal_interval, renewal_amount, renewal_currency, updated_at)
  values
    (p_founder, 'active', p_interval, ((p_now at time zone 'UTC') + step) at time zone 'UTC', p_auto_renew, lower(p_email), p_customer_id,
     case when p_auto_renew then p_interval end,
     case when p_auto_renew then p_amount end,
     case when p_auto_renew then p_currency end,
     p_now)
  on conflict (founder_id) do update set
    current_period_end = case
      when s.status = 'active' and s.current_period_end is null then null
      else ((greatest(coalesce(s.current_period_end, p_now), p_now) at time zone 'UTC') + step) at time zone 'UTC'
    end,
    status = 'active',
    billing_interval = excluded.billing_interval,
    auto_renew = s.auto_renew or excluded.auto_renew,
    billing_email = coalesce(excluded.billing_email, s.billing_email),
    flutterwave_customer_id = coalesce(excluded.flutterwave_customer_id, s.flutterwave_customer_id),
    renewal_interval = case when excluded.auto_renew then excluded.renewal_interval else s.renewal_interval end,
    renewal_amount = case when excluded.auto_renew then excluded.renewal_amount else s.renewal_amount end,
    renewal_currency = case when excluded.auto_renew then excluded.renewal_currency else s.renewal_currency end,
    updated_at = p_now
  returning s.current_period_end into new_end;
  return new_end;
end;
$$;

-- Marks a payment successful AND grants what it paid for, as ONE step:
-- either both happen or neither does. That is what makes "granted exactly
-- once" true even if the webhook and the browser return arrive together,
-- or the server is cut off half-way — there is no moment where a payment
-- is recorded as paid but nothing was granted.
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

  if pay.product = 'subscription' then
    perform extend_subscription(pay.founder_id, coalesce(pay.billing_interval, 'monthly'), pay.auto_renew,
                                p_customer_email, p_customer_id, pay.amount, pay.currency, p_now);
  elsif pay.advisor_session_id is not null then
    update public.advisor_sessions set paid_at = p_now where id = pay.advisor_session_id and paid_at is null;
  end if;
  return 'fulfilled';
end;
$$;

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

-- Only the server (service role) may run the functions that grant access.
revoke all on function extend_subscription(uuid, billing_interval, boolean, text, text, numeric, text, timestamptz) from public, anon, authenticated;
revoke all on function fulfil_payment(uuid, text, numeric, text, text, timestamptz) from public, anon, authenticated;
revoke all on function record_renewal(uuid, text, numeric, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function extend_subscription(uuid, billing_interval, boolean, text, text, numeric, text, timestamptz) to service_role;
grant execute on function fulfil_payment(uuid, text, numeric, text, text, timestamptz) to service_role;
grant execute on function record_renewal(uuid, text, numeric, text, text, text, timestamptz) to service_role;
