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
