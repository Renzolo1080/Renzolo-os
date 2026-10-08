-- RENZOLO OS™ — payments (run once on an EXISTING database)
--
-- Run AFTER 2026-10-08_fix_access_rules.sql. A brand-new project should
-- just run the current supabase/schema.sql, which already includes this.
--
-- Safe to run more than once. It adds one table and four columns and
-- tightens one access rule; no existing row is changed or removed.
--
-- What it adds:
--  1. A `payments` table: one row per checkout this app starts, holding
--     the amount and currency we EXPECT, so a payment can be checked
--     against it before any access is granted, and granted only once.
--  2. subscriptions: one row per founder (required for the app to save a
--     subscription at all), plus auto_renew and billing_email.
--  3. advisor_sessions.paid_at: lets the advisor queue show only sessions
--     that were actually paid for.
--  4. Founders can no longer create advisor_sessions rows directly from
--     the browser (they could have marked one as paid). The app creates
--     them server-side.

begin;

do $$ begin
  if not exists (select 1 from pg_proc where proname = 'is_staff') then
    raise exception 'Run supabase/migrations/2026-10-08_fix_access_rules.sql first.';
  end if;
end $$;

-- subscriptions -------------------------------------------------------
alter table subscriptions add column if not exists auto_renew boolean not null default false;
alter table subscriptions add column if not exists billing_email text;
-- If this fails with "could not create unique index", a founder has more
-- than one subscriptions row; remove the extra row(s) and run again.
create unique index if not exists subscriptions_founder_id_key on subscriptions (founder_id);
create index if not exists subscriptions_billing_email_idx on subscriptions (billing_email);

-- advisor_sessions ----------------------------------------------------
alter table advisor_sessions add column if not exists paid_at timestamptz;
drop policy if exists "advisor_sessions: founder can insert own" on advisor_sessions;

-- payments ------------------------------------------------------------
do $$ begin
  create type payment_status as enum ('pending', 'successful', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_product as enum ('subscription', 'advisor_session');
exception when duplicate_object then null; end $$;

create table if not exists payments (
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
  fulfilled_at timestamptz
);

create index if not exists payments_founder_id_idx on payments (founder_id);

alter table payments enable row level security;

drop policy if exists "payments: self or staff" on payments;
create policy "payments: self or staff" on payments for select
  using (founder_id = auth.uid() or is_staff());

commit;
