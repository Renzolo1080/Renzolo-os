-- Founder Trajectory(TM) membership tiers, part 2 of 2 (run part 1,
-- 2026-10-13_tiers_enums.sql, first). Safe to run more than once.
--
--  * Three tiers (Essentials, Growth, Elevate) on the subscription and on
--    each membership payment. An upgrade starts at once; a downgrade is
--    scheduled for the end of the current period.
--  * The one-time Readiness Assessment ($79) and coaching sessions are
--    new products. Coaching (bought or included in Growth/Elevate) is held
--    as credits that are used to book a session.
--  * An Elevate waitlist, for when seats are full.
--  * Reports bought with the one-time assessment stay readable without a
--    membership.

do $$ begin
  create type membership_tier as enum ('essentials', 'growth', 'elevate');
exception when duplicate_object then null; end $$;

alter table subscriptions add column if not exists tier membership_tier;
-- A downgrade that has been paid for: takes over from scheduled_from.
alter table subscriptions add column if not exists scheduled_tier membership_tier;
alter table subscriptions add column if not exists scheduled_from timestamptz;

alter table payments add column if not exists tier membership_tier;
alter table payments add column if not exists change_kind text;
-- Credit for unused time taken off this payment (upgrades), and unused
-- time worth more than the payment, given as extra days instead.
alter table payments add column if not exists credit_applied numeric not null default 0;
alter table payments add column if not exists extra_days numeric not null default 0;
-- Coaching sessions bought in this payment.
alter table payments add column if not exists quantity integer;
do $$ begin
  alter table payments add constraint payments_change_kind_check check (change_kind is null or change_kind in ('new', 'renewal', 'upgrade', 'downgrade'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table payments add constraint payments_extra_days_check check (extra_days >= 0 and extra_days <= 400 and credit_applied >= 0);
exception when duplicate_object then null; end $$;

-- One-time Readiness Assessment purchases.
create table if not exists assessment_purchases (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references profiles(id) on delete cascade,
  payment_id uuid unique references payments(id) on delete set null,
  purchased_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists assessment_purchases_founder_idx on assessment_purchases (founder_id);

-- Coaching sessions a founder can book: bought (valid a year) or included
-- in Growth (2 per quarter) or Elevate (2 per month). Included sessions
-- don't roll over: each batch expires at the end of its period.
create table if not exists coaching_credits (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references profiles(id) on delete cascade,
  source text not null check (source in ('membership', 'purchase', 'manual')),
  tier membership_tier,
  quantity integer not null check (quantity > 0),
  used integer not null default 0,
  available_from timestamptz not null,
  expires_at timestamptz not null,
  payment_id uuid references payments(id) on delete set null,
  created_at timestamptz not null default now(),
  check (used >= 0 and used <= quantity),
  check (expires_at > available_from)
);
create index if not exists coaching_credits_founder_idx on coaching_credits (founder_id, expires_at);

create table if not exists elevate_waitlist (
  founder_id uuid primary key references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  notified_at timestamptz
);

alter table advisor_sessions add column if not exists coaching_credit_id uuid references coaching_credits(id) on delete set null;
alter table reports add column if not exists assessment_purchase_id uuid references assessment_purchases(id) on delete set null;
-- 'summary' for Essentials, 'full' for Growth, Elevate and the one-time assessment.
alter table reports add column if not exists level text not null default 'full';
do $$ begin
  alter table reports add constraint reports_level_check check (level in ('summary', 'full'));
exception when duplicate_object then null; end $$;

alter table assessment_purchases enable row level security;
alter table coaching_credits enable row level security;
alter table elevate_waitlist enable row level security;
-- Founders read their own rows; all writes are made by the server.
do $$ begin
  create policy "assessment_purchases: self or staff" on assessment_purchases for select using (founder_id = auth.uid() or is_staff());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "coaching_credits: self or staff" on coaching_credits for select using (founder_id = auth.uid() or is_staff());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "elevate_waitlist: self or staff" on elevate_waitlist for select using (founder_id = auth.uid() or is_staff());
exception when duplicate_object then null; end $$;

-- A report stays readable to its owner while they're a member, or for
-- good if it was bought with the one-time assessment.
alter policy "reports: via assessment ownership" on reports
  using (is_staff() or (
    exists (select 1 from assessments a where a.id = assessment_id and a.founder_id = auth.uid())
    and (has_active_subscription() or assessment_purchase_id is not null)
  ));

create or replace function tier_rank(t membership_tier) returns integer
  language sql immutable set search_path = public as $$
  select case t::text when 'essentials' then 1 when 'growth' then 2 when 'elevate' then 3 else 0 end;
$$;

-- Included coaching for one paid period of a tier, as credits that expire
-- at the end of each quarter (Growth) or month (Elevate).
create or replace function grant_included_coaching(
  p_founder uuid, p_tier membership_tier, p_start timestamptz, p_months integer, p_payment uuid
) returns void
  language plpgsql security definer set search_path = public as $$
declare
  chunk integer;
  n integer;
  i integer;
begin
  if p_tier::text = 'growth' then chunk := 3;
  elsif p_tier::text = 'elevate' then chunk := 1;
  else return;
  end if;
  n := greatest(1, p_months / chunk);
  for i in 0 .. n - 1 loop
    insert into public.coaching_credits (founder_id, source, tier, quantity, available_from, expires_at, payment_id)
    values (p_founder, 'membership', p_tier, 2,
            ((p_start at time zone 'UTC') + make_interval(months => i * chunk)) at time zone 'UTC',
            ((p_start at time zone 'UTC') + make_interval(months => (i + 1) * chunk)) at time zone 'UTC',
            p_payment);
  end loop;
end;
$$;

-- Applies one paid membership period and returns the new paid-through
-- date. The subscription row is locked while it runs. Mirrors planChange
-- in lib/membership.ts:
--  * no membership, or a lapsed one: a new period starting now;
--  * a higher tier (upgrade): starts now, plus any extra days the unused
--    time was worth (worked out at checkout);
--  * the same tier (renewal): added on after the current period, so time
--    already paid for is never lost;
--  * a lower tier (downgrade): added on after the current period, and the
--    current tier is kept until then (scheduled_tier / scheduled_from);
--  * a manual never-expiring grant stays never-expiring.
-- Periods are calendar months counted in UTC whatever the database's time
-- zone. p_tier null means "the tier already in force" (card renewals).
create or replace function apply_membership(
  p_founder uuid, p_tier membership_tier, p_interval billing_interval, p_extra_days numeric,
  p_auto_renew boolean, p_email text, p_customer_id text, p_amount numeric, p_currency text,
  p_now timestamptz, p_payment uuid
) returns timestamptz
  language plpgsql security definer set search_path = public as $$
declare
  s public.subscriptions%rowtype;
  has_row boolean;
  cur membership_tier;
  tgt membership_tier;
  months integer := case p_interval::text when 'annual' then 12 when 'quarterly' then 3 else 1 end;
  step interval;
  extra interval := make_interval(secs => greatest(0, coalesce(p_extra_days, 0)) * 86400);
  is_active boolean;
  start_at timestamptz;
  new_end timestamptz;
begin
  step := make_interval(months => months);
  select * into s from public.subscriptions where founder_id = p_founder for update;
  has_row := found;
  if has_row and s.scheduled_tier is not null and s.scheduled_from <= p_now then
    s.tier := s.scheduled_tier;
    s.scheduled_tier := null;
    s.scheduled_from := null;
  end if;
  cur := coalesce(s.tier, 'essentials');
  tgt := coalesce(p_tier, cur);
  is_active := has_row and s.status = 'active' and (
    s.current_period_end is null
    or s.current_period_end + (case when s.auto_renew then interval '3 days' else interval '0' end) > p_now);

  if not has_row then
    start_at := p_now;
    new_end := (((p_now at time zone 'UTC') + step) at time zone 'UTC') + extra;
    insert into public.subscriptions
      (founder_id, status, tier, billing_interval, current_period_end, auto_renew, billing_email,
       flutterwave_customer_id, renewal_interval, renewal_amount, renewal_currency, updated_at)
    values
      (p_founder, 'active', tgt, p_interval, new_end, p_auto_renew, lower(p_email), p_customer_id,
       case when p_auto_renew then p_interval end,
       case when p_auto_renew then p_amount end,
       case when p_auto_renew then p_currency end,
       p_now);
  else
    if is_active and s.current_period_end is null then
      start_at := p_now;
      new_end := null;
      if tier_rank(tgt) > tier_rank(cur) then s.tier := tgt; end if;
    elsif not is_active then
      start_at := p_now;
      new_end := (((p_now at time zone 'UTC') + step) at time zone 'UTC') + extra;
      s.tier := tgt; s.scheduled_tier := null; s.scheduled_from := null;
    elsif tier_rank(tgt) > tier_rank(cur) then
      start_at := p_now;
      new_end := (((p_now at time zone 'UTC') + step) at time zone 'UTC') + extra;
      s.tier := tgt; s.scheduled_tier := null; s.scheduled_from := null;
    elsif tier_rank(tgt) < tier_rank(cur) then
      start_at := s.current_period_end;
      new_end := ((s.current_period_end at time zone 'UTC') + step) at time zone 'UTC';
      s.scheduled_tier := tgt; s.scheduled_from := s.current_period_end;
    else
      start_at := greatest(s.current_period_end, p_now);
      new_end := ((start_at at time zone 'UTC') + step) at time zone 'UTC';
      s.tier := cur; s.scheduled_tier := null; s.scheduled_from := null;
    end if;

    update public.subscriptions set
      status = 'active',
      tier = s.tier,
      scheduled_tier = s.scheduled_tier,
      scheduled_from = s.scheduled_from,
      billing_interval = p_interval,
      current_period_end = new_end,
      auto_renew = s.auto_renew or p_auto_renew,
      billing_email = coalesce(lower(p_email), s.billing_email),
      flutterwave_customer_id = coalesce(p_customer_id, s.flutterwave_customer_id),
      renewal_interval = case when p_auto_renew then p_interval else s.renewal_interval end,
      renewal_amount = case when p_auto_renew then p_amount else s.renewal_amount end,
      renewal_currency = case when p_auto_renew then p_currency else s.renewal_currency end,
      updated_at = p_now
    where founder_id = p_founder;
  end if;

  perform grant_included_coaching(p_founder, tgt, start_at, months, p_payment);
  return new_end;
end;
$$;

-- The original one-period extension, kept for card renewals and earlier
-- callers: renews the tier already in force.
create or replace function extend_subscription(
  p_founder uuid, p_interval billing_interval, p_auto_renew boolean,
  p_email text, p_customer_id text, p_amount numeric, p_currency text, p_now timestamptz
) returns timestamptz
  language plpgsql security definer set search_path = public as $$
begin
  return apply_membership(p_founder, null, p_interval, 0, p_auto_renew, p_email, p_customer_id, p_amount, p_currency, p_now, null);
end;
$$;

-- Marks a payment successful AND grants what it paid for, as ONE step:
-- either both happen or neither does, and never twice.
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

  if pay.product::text = 'subscription' then
    -- The renewal amount remembered for card auto-renewal is the full
    -- price, not a first payment reduced by an upgrade credit.
    perform apply_membership(pay.founder_id, pay.tier, coalesce(pay.billing_interval, 'monthly'), pay.extra_days, pay.auto_renew,
                             p_customer_email, p_customer_id, pay.amount + pay.credit_applied, pay.currency, p_now, pay.id);
  elsif pay.product::text = 'assessment' then
    insert into public.assessment_purchases (founder_id, payment_id, purchased_at)
    values (pay.founder_id, pay.id, p_now)
    on conflict (payment_id) do nothing;
  elsif pay.product::text = 'coaching' then
    insert into public.coaching_credits (founder_id, source, quantity, available_from, expires_at, payment_id)
    values (pay.founder_id, 'purchase', greatest(1, coalesce(pay.quantity, 1)), p_now,
            ((p_now at time zone 'UTC') + interval '1 year') at time zone 'UTC', pay.id);
  elsif pay.advisor_session_id is not null then
    update public.advisor_sessions set paid_at = p_now where id = pay.advisor_session_id and paid_at is null;
  end if;
  return 'fulfilled';
end;
$$;

-- Books a coaching session with the founder's soonest-expiring available
-- credit. Returns the new session's id, or null if they have no credit.
create or replace function use_coaching_credit(p_founder uuid, p_now timestamptz default now()) returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  c public.coaching_credits%rowtype;
  sid uuid;
begin
  select * into c from public.coaching_credits
   where founder_id = p_founder and used < quantity and available_from <= p_now and expires_at > p_now
   order by expires_at, created_at
   limit 1
   for update;
  if not found then
    return null;
  end if;
  update public.coaching_credits set used = used + 1 where id = c.id;
  insert into public.advisor_sessions (founder_id, status, price, currency, paid_at, notes, coaching_credit_id)
  values (p_founder, 'requested', 0, 'USD', p_now, 'Booked with a coaching session credit', c.id)
  returning id into sid;
  return sid;
end;
$$;

-- Only the server (service role) may run the functions that grant access.
revoke all on function tier_rank(membership_tier) from public, anon, authenticated;
revoke all on function grant_included_coaching(uuid, membership_tier, timestamptz, integer, uuid) from public, anon, authenticated;
revoke all on function apply_membership(uuid, membership_tier, billing_interval, numeric, boolean, text, text, numeric, text, timestamptz, uuid) from public, anon, authenticated;
revoke all on function extend_subscription(uuid, billing_interval, boolean, text, text, numeric, text, timestamptz) from public, anon, authenticated;
revoke all on function fulfil_payment(uuid, text, numeric, text, text, timestamptz) from public, anon, authenticated;
revoke all on function use_coaching_credit(uuid, timestamptz) from public, anon, authenticated;
grant execute on function tier_rank(membership_tier) to service_role;
grant execute on function grant_included_coaching(uuid, membership_tier, timestamptz, integer, uuid) to service_role;
grant execute on function apply_membership(uuid, membership_tier, billing_interval, numeric, boolean, text, text, numeric, text, timestamptz, uuid) to service_role;
grant execute on function extend_subscription(uuid, billing_interval, boolean, text, text, numeric, text, timestamptz) to service_role;
grant execute on function fulfil_payment(uuid, text, numeric, text, text, timestamptz) to service_role;
grant execute on function use_coaching_credit(uuid, timestamptz) to service_role;
