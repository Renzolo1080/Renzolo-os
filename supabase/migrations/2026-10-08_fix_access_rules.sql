-- RENZOLO OS™ — fix database access rules (run once on an EXISTING database)
--
-- Only needed if your Supabase project was created from supabase/schema.sql
-- as it stood before 2026-10-08. A brand-new project should just run the
-- current supabase/schema.sql, which already includes everything here.
--
-- Safe to run more than once. It changes access rules only — no table,
-- column or row of data is added, altered or removed.
--
-- What it fixes:
--  1. Every logged-in query failed with "infinite recursion detected in
--     policy for relation profiles", because the policies checked a user's
--     role by reading profiles from inside a profiles policy.
--  2. Any signed-in user could set role = 'admin' on their own profile.
--
-- Scores and reports stay read-only to founders; the app now writes them
-- server-side with the service role (see app/api/score, app/api/report).

begin;

create or replace function is_staff() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('advisor','admin'));
$$;

create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

alter function handle_new_user() set search_path = public;

-- profiles
drop policy if exists "profiles: self or staff" on profiles;
create policy "profiles: self or staff" on profiles for select
  using (id = auth.uid() or is_staff());

drop policy if exists "profiles: self update" on profiles;
create policy "profiles: self update" on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

revoke update on profiles from authenticated, anon;
grant update (full_name, country, venture_stage, industry, dashboard_widgets) on profiles to authenticated;

-- assessments
drop policy if exists "assessments: owner or staff" on assessments;
create policy "assessments: owner or staff" on assessments for all
  using (founder_id = auth.uid() or is_staff());

-- block_responses
drop policy if exists "block_responses: via assessment ownership" on block_responses;
create policy "block_responses: via assessment ownership" on block_responses for all
  using (exists (select 1 from assessments a where a.id = assessment_id and (a.founder_id = auth.uid() or is_staff())));

-- scores
drop policy if exists "scores: via assessment ownership" on scores;
create policy "scores: via assessment ownership" on scores for select
  using (exists (select 1 from assessments a where a.id = assessment_id and (a.founder_id = auth.uid() or is_staff())));

-- reports
drop policy if exists "reports: via assessment ownership" on reports;
create policy "reports: via assessment ownership" on reports for select
  using (exists (select 1 from assessments a where a.id = assessment_id and (a.founder_id = auth.uid() or is_staff())));

drop policy if exists "reports: staff can update" on reports;
create policy "reports: staff can update" on reports for update
  using (is_staff());

-- subscriptions
drop policy if exists "subscriptions: self or staff" on subscriptions;
create policy "subscriptions: self or staff" on subscriptions for select
  using (founder_id = auth.uid() or is_staff());

-- snapshot_leads
drop policy if exists "snapshot_leads: staff can read" on snapshot_leads;
create policy "snapshot_leads: staff can read" on snapshot_leads for select
  using (is_staff());

-- advisor_sessions
drop policy if exists "advisor_sessions: self or staff" on advisor_sessions;
create policy "advisor_sessions: self or staff" on advisor_sessions for select
  using (founder_id = auth.uid() or is_staff());

drop policy if exists "advisor_sessions: staff can update" on advisor_sessions;
create policy "advisor_sessions: staff can update" on advisor_sessions for update
  using (is_staff());

-- app_settings
drop policy if exists "app_settings: admin can select" on app_settings;
create policy "app_settings: admin can select" on app_settings for select
  using (is_admin());

drop policy if exists "app_settings: admin can update" on app_settings;
create policy "app_settings: admin can update" on app_settings for update
  using (is_admin());

-- milestones
drop policy if exists "milestones: via assessment ownership" on milestones;
create policy "milestones: via assessment ownership" on milestones for all
  using (exists (select 1 from assessments a where a.id = assessment_id and (a.founder_id = auth.uid() or is_staff())));

-- recommendations
drop policy if exists "recommendations: via assessment ownership" on recommendations;
create policy "recommendations: via assessment ownership" on recommendations for all
  using (exists (select 1 from assessments a where a.id = assessment_id and (a.founder_id = auth.uid() or is_staff())));

-- quiz_leads
drop policy if exists "quiz_leads: staff can read" on quiz_leads;
create policy "quiz_leads: staff can read" on quiz_leads for select
  using (is_staff());

commit;
