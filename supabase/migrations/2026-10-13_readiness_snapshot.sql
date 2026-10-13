-- Readiness Snapshot: keep the public Snapshot's full answers (so a
-- founder who then creates an account doesn't answer twice), the company
-- name, and the Strategic Plan Readiness score.
alter table snapshot_leads add column if not exists company_name text;
alter table snapshot_leads add column if not exists answers jsonb;
alter table snapshot_leads add column if not exists plan_score numeric;
create index if not exists snapshot_leads_email_unclaimed on snapshot_leads (email) where converted_to_user_id is null;
