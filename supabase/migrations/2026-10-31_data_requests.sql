-- Privacy requests from founders: deletion, a human review of their
-- readiness score, correction, objection. Answered within 30 days.
create table if not exists data_requests (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid references auth.users (id) on delete set null,
  email text,
  kind text not null check (kind in ('deletion', 'score_review', 'correction', 'objection')),
  details text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done', 'declined')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists data_requests_founder_idx on data_requests (founder_id);
create index if not exists data_requests_open_idx on data_requests (status) where status <> 'done';

alter table data_requests enable row level security;

drop policy if exists "founders read own data requests" on data_requests;
create policy "founders read own data requests" on data_requests
  for select using ((select auth.uid()) = founder_id);

drop policy if exists "founders create own data requests" on data_requests;
create policy "founders create own data requests" on data_requests
  for insert with check ((select auth.uid()) = founder_id and status = 'open');
