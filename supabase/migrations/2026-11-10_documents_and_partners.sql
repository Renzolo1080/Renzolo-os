-- 2026-11-10: AI document intake (capital readiness) and the partner portal.
-- Safe to run more than once. Not applied to the live database until
-- Lorenzo approves.

-- ===== Document intake =====
-- Only the figures and checks the AI pulled from a founder's document are
-- kept (lib/doc-intake.ts). The file itself is never stored.
create table if not exists document_extractions (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references profiles(id) on delete cascade,
  doc_type text not null check (doc_type in ('bank_statement', 'financial_statements', 'registration', 'tax_clearance')),
  file_name text not null check (length(file_name) between 1 and 80),
  result jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists document_extractions_founder_idx on document_extractions (founder_id, created_at desc);
alter table document_extractions enable row level security;
grant select, insert, update, delete on document_extractions to service_role;
grant select, insert, delete on document_extractions to authenticated;
revoke all on document_extractions from anon;
revoke update on document_extractions from authenticated;
do $$ begin
  create policy "document_extractions: own or staff read" on document_extractions for select using (founder_id = auth.uid() or is_staff());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "document_extractions: own insert" on document_extractions for insert with check (founder_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "document_extractions: own delete" on document_extractions for delete using (founder_id = auth.uid());
exception when duplicate_object then null; end $$;

-- ===== Partner portal =====
-- A partner (buyer, government agency, lender or investor, foundation)
-- sponsors cohorts. Founders join a cohort with its code and explicitly
-- agree to share their readiness progress with that partner; they can stop
-- sharing at any time. Partners never see assessment answers, documents or
-- coaching notes: the partner pages read only scores, progress and counts,
-- through the server (lib/partner-server.ts). Staff set partners up.
create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 120),
  kind text not null check (kind in ('buyer', 'government', 'lender_investor', 'foundation', 'other')),
  created_at timestamptz not null default now()
);
create table if not exists partner_users (
  partner_id uuid not null references partners(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (partner_id, user_id)
);
create table if not exists partner_cohorts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id) on delete cascade,
  name text not null check (length(name) between 2 and 120),
  join_code text not null unique check (join_code ~ '^[A-Z0-9]{6,12}$'),
  open boolean not null default true,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now()
);
create table if not exists cohort_members (
  cohort_id uuid not null references partner_cohorts(id) on delete cascade,
  founder_id uuid not null references profiles(id) on delete cascade,
  consent_version text not null check (length(consent_version) between 1 and 20),
  consented_at timestamptz not null default now(),
  -- Total Readiness Score when they joined, for "progress since joining".
  baseline_score integer check (baseline_score between 0 and 100),
  primary key (cohort_id, founder_id)
);
create index if not exists cohort_members_founder_idx on cohort_members (founder_id);

alter table partners enable row level security;
alter table partner_users enable row level security;
alter table partner_cohorts enable row level security;
alter table cohort_members enable row level security;

grant select, insert, update, delete on partners, partner_users, partner_cohorts, cohort_members to service_role;
grant select on partners, partner_users, partner_cohorts to authenticated;
grant select, insert, delete on cohort_members to authenticated;
revoke all on partners, partner_users, partner_cohorts, cohort_members from anon;
revoke insert, update, delete on partners, partner_users, partner_cohorts from authenticated;
revoke update on cohort_members from authenticated;

-- Partner staff see their own partner and cohorts; RENZOLO staff see all.
do $$ begin
  create policy "partners: own partner or staff" on partners for select
    using (is_staff() or exists (select 1 from partner_users pu where pu.partner_id = partners.id and pu.user_id = auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "partner_users: self or staff" on partner_users for select using (user_id = auth.uid() or is_staff());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "partner_cohorts: own partner or staff" on partner_cohorts for select
    using (is_staff() or exists (select 1 from partner_users pu where pu.partner_id = partner_cohorts.partner_id and pu.user_id = auth.uid()));
exception when duplicate_object then null; end $$;
-- Founders see, join and leave their own memberships. Joining by code is
-- done by the server after checking the code, so founders can't browse
-- other partners' cohorts.
do $$ begin
  create policy "cohort_members: own or staff read" on cohort_members for select using (founder_id = auth.uid() or is_staff());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "cohort_members: own insert" on cohort_members for insert with check (founder_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "cohort_members: own delete" on cohort_members for delete using (founder_id = auth.uid());
exception when duplicate_object then null; end $$;

-- Setting up a partner (run by RENZOLO staff in the SQL editor):
--   insert into partners (name, kind) values ('Example Agency', 'government') returning id;
--   insert into partner_cohorts (partner_id, name, join_code) values ('<partner id>', 'Q1 2027 supplier cohort', 'EXAMPLE27');
--   insert into partner_users (partner_id, user_id) values ('<partner id>', '<their RENZOLO user id>');
