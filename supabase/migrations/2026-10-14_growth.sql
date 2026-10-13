-- Growth launch: where founders come from, referrals, shareable scores,
-- emails, cohort applications and contact messages. Safe to run more
-- than once.

-- Where a founder came from (first ad / post / partner / referral link).
alter table snapshot_leads add column if not exists attribution jsonb;
alter table snapshot_leads add column if not exists marketing_consent boolean not null default false;
alter table profiles add column if not exists attribution jsonb;
alter table profiles add column if not exists marketing_consent boolean not null default false;
-- Referral codes. Not in the founder-editable column list (see the grant
-- on profiles), so only the server can set them.
alter table profiles add column if not exists referral_code text;
alter table profiles add column if not exists referred_by text;
create unique index if not exists profiles_referral_code_key on profiles (referral_code);

-- One free month for the referrer when a founder they invited first pays
-- for a membership. Applied at once if the referrer has an active paid
-- membership, otherwise on their next membership payment.
create table if not exists referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references profiles(id) on delete cascade,
  referred_id uuid not null unique references profiles(id) on delete cascade,
  payment_id uuid references payments(id) on delete set null,
  months integer not null default 1 check (months between 1 and 12),
  applied_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists referral_rewards_referrer_idx on referral_rewards (referrer_id) where applied_at is null;

-- "I scored 62 on my Venture Readiness" links. Only the score and tier
-- are stored — no name, email or answers. Read by the server only.
create table if not exists shared_scores (
  token text primary key check (token ~ '^[A-Za-z0-9]{10,32}$'),
  venture_score numeric not null,
  venture_tier text not null,
  plan_score numeric,
  referral_code text,
  source text not null check (source in ('snapshot', 'member')),
  created_at timestamptz not null default now()
);

create table if not exists cohort_applications (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid references profiles(id) on delete set null,
  full_name text not null,
  email text not null,
  company text,
  country text,
  venture_stage text,
  cohort text not null check (cohort in ('essentials_growth', 'elevate')),
  message text,
  attribution jsonb,
  created_at timestamptz not null default now()
);

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  company text,
  topic text not null,
  message text not null,
  attribution jsonb,
  created_at timestamptz not null default now()
);

-- Emails sent (one of each kind per address) and unsubscribes.
create table if not exists email_log (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  kind text not null,
  lead_id uuid references snapshot_leads(id) on delete set null,
  sent_at timestamptz not null default now(),
  unique (email, kind)
);
create table if not exists email_unsubscribes (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table referral_rewards enable row level security;
alter table shared_scores enable row level security;
alter table cohort_applications enable row level security;
alter table contact_messages enable row level security;
alter table email_log enable row level security;
alter table email_unsubscribes enable row level security;
-- Founders can see rewards they've earned; everything else is staff/server only.
do $$ begin
  create policy "referral_rewards: referrer or staff" on referral_rewards for select using (referrer_id = auth.uid() or is_staff());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "cohort_applications: staff" on cohort_applications for select using (is_staff());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "contact_messages: staff" on contact_messages for select using (is_staff());
exception when duplicate_object then null; end $$;

-- Records the reward when a referred founder's FIRST membership payment
-- lands, and applies it straight away if the referrer has an active paid
-- membership (a manual never-expiring grant needs no extra time).
create or replace function grant_referral_reward(p_founder uuid, p_payment uuid, p_now timestamptz) returns void
  language plpgsql security definer set search_path = public as $$
declare
  code text;
  referrer uuid;
  rid uuid;
  s public.subscriptions%rowtype;
begin
  select referred_by into code from public.profiles where id = p_founder;
  if code is null then return; end if;
  select id into referrer from public.profiles where referral_code = code;
  if referrer is null or referrer = p_founder then return; end if;
  if exists (select 1 from public.payments where founder_id = p_founder and product::text = 'subscription'
             and status = 'successful' and id <> p_payment) then
    return;
  end if;
  insert into public.referral_rewards (referrer_id, referred_id, payment_id, created_at)
  values (referrer, p_founder, p_payment, p_now)
  on conflict (referred_id) do nothing
  returning id into rid;
  if rid is null then return; end if;
  select * into s from public.subscriptions where founder_id = referrer for update;
  if found and s.status = 'active' and s.current_period_end is not null and s.current_period_end > p_now then
    update public.subscriptions
       set current_period_end = ((s.current_period_end at time zone 'UTC') + interval '1 month') at time zone 'UTC', updated_at = p_now
     where founder_id = referrer;
    update public.referral_rewards set applied_at = p_now where id = rid;
  end if;
end;
$$;

-- Adds any free months a founder has earned but not yet received to a
-- paid period that has just been applied.
create or replace function apply_pending_referral_rewards(p_founder uuid, p_now timestamptz) returns void
  language plpgsql security definer set search_path = public as $$
declare
  n integer;
begin
  select coalesce(sum(months), 0) into n from public.referral_rewards where referrer_id = p_founder and applied_at is null;
  if n = 0 then return; end if;
  update public.subscriptions
     set current_period_end = ((current_period_end at time zone 'UTC') + make_interval(months => n)) at time zone 'UTC', updated_at = p_now
   where founder_id = p_founder and current_period_end is not null;
  if found then
    update public.referral_rewards set applied_at = p_now where referrer_id = p_founder and applied_at is null;
  end if;
end;
$$;

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
    perform apply_pending_referral_rewards(pay.founder_id, p_now);
    perform grant_referral_reward(pay.founder_id, pay.id, p_now);
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

revoke all on function grant_referral_reward(uuid, uuid, timestamptz) from public, anon, authenticated;
revoke all on function apply_pending_referral_rewards(uuid, timestamptz) from public, anon, authenticated;
revoke all on function fulfil_payment(uuid, text, numeric, text, text, timestamptz) from public, anon, authenticated;
grant execute on function grant_referral_reward(uuid, uuid, timestamptz) to service_role;
grant execute on function apply_pending_referral_rewards(uuid, timestamptz) to service_role;
grant execute on function fulfil_payment(uuid, text, numeric, text, text, timestamptz) to service_role;
