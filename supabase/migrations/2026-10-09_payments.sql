-- RENZOLO OS™ — payments (run once on an EXISTING database)
--
-- Run AFTER 2026-10-08_fix_access_rules.sql. A brand-new project should
-- just run the current supabase/schema.sql, which already includes this.
--
-- Safe to run more than once. It adds one table, a few columns and four
-- functions, and tightens two access rules; no existing row is changed
-- or removed.
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
--  5. Database functions that mark a payment paid and grant what it paid
--     for as one all-or-nothing step, runnable only by the server.
--  6. A founder can read their own reports only while subscribed.
--
-- BEFORE running, check for subscriptions that will become permanent:
--   select * from subscriptions where status = 'active' and current_period_end is null;
-- From now on "active with no end date" means a manual grant that never
-- expires. If that query returns rows you did not grant on purpose, give
-- them an end date or set their status to 'none' first.

begin;

do $$ begin
  if not exists (select 1 from pg_proc where proname = 'is_staff') then
    raise exception 'Run supabase/migrations/2026-10-08_fix_access_rules.sql first.';
  end if;
end $$;

-- subscriptions -------------------------------------------------------
alter table subscriptions add column if not exists auto_renew boolean not null default false;
alter table subscriptions add column if not exists billing_email text;
alter table subscriptions add column if not exists renewal_interval billing_interval;
alter table subscriptions add column if not exists renewal_amount numeric;
alter table subscriptions add column if not exists renewal_currency text;
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
  fulfilled_at timestamptz,
  last_checked_at timestamptz
);
alter table payments add column if not exists last_checked_at timestamptz;

create index if not exists payments_founder_id_idx on payments (founder_id);

alter table payments enable row level security;

drop policy if exists "payments: self or staff" on payments;
create policy "payments: self or staff" on payments for select
  using (founder_id = auth.uid() or is_staff());

-- functions -----------------------------------------------------------
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

-- reports: readable by their founder only while subscribed ---------------
drop policy if exists "reports: via assessment ownership" on reports;
create policy "reports: via assessment ownership" on reports for select
  using (is_staff() or (has_active_subscription() and exists (select 1 from assessments a where a.id = assessment_id and a.founder_id = auth.uid())));

commit;
