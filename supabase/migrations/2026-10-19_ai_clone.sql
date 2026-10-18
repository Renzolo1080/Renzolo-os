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
