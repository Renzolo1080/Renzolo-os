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
