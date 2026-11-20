-- Founder Trajectory(TM) Academy courses, part 2 of 2 (approved Nov 19 2026).
-- Run 2026-11-19_courses_enums.sql first. Safe to run more than once.
--
-- Recorded courses are a one-time purchase, separate from membership
-- (members get a discount; a course is never included in a membership).
-- Course content lives in lib/courses.ts; the database only records who
-- bought what, each founder's progress and VOLT cards, and the video ID
-- for each lesson.

-- Which course (or the bundle) a payment is for.
alter table public.payments add column if not exists course_slug text;

-- Access: one row per founder per course. Written only by fulfil_payment
-- (or by an admin through the server), never by the founder.
create table if not exists public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.profiles(id) on delete cascade,
  course_slug text not null check (course_slug in ('customer-readiness', 'capital-readiness', 'investor-readiness')),
  payment_id uuid references public.payments(id) on delete set null,
  enrolled_at timestamptz not null default now(),
  unique (founder_id, course_slug)
);
alter table public.course_enrollments enable row level security;
grant select, insert, update, delete on public.course_enrollments to service_role;
grant select on public.course_enrollments to authenticated;
drop policy if exists "course_enrollments: read own" on public.course_enrollments;
create policy "course_enrollments: read own" on public.course_enrollments
  for select using (founder_id = auth.uid() or is_admin());

-- Progress and the VOLT card for each lesson. A founder can only write
-- progress for a course they are enrolled in.
create table if not exists public.course_lesson_progress (
  founder_id uuid not null references public.profiles(id) on delete cascade,
  course_slug text not null,
  lesson_key text not null check (lesson_key ~ '^l[0-9]{2}$'),
  completed_at timestamptz,
  volt jsonb not null default '{}'::jsonb,
  energy smallint check (energy between 1 and 10),
  updated_at timestamptz not null default now(),
  primary key (founder_id, course_slug, lesson_key)
);
alter table public.course_lesson_progress enable row level security;
grant select, insert, update, delete on public.course_lesson_progress to service_role;
grant select, insert, update on public.course_lesson_progress to authenticated;
drop policy if exists "course_lesson_progress: read own" on public.course_lesson_progress;
create policy "course_lesson_progress: read own" on public.course_lesson_progress
  for select using (founder_id = auth.uid());
drop policy if exists "course_lesson_progress: write own if enrolled" on public.course_lesson_progress;
create policy "course_lesson_progress: write own if enrolled" on public.course_lesson_progress
  for insert with check (
    founder_id = auth.uid()
    and exists (select 1 from public.course_enrollments e where e.founder_id = auth.uid() and e.course_slug = course_lesson_progress.course_slug)
  );
drop policy if exists "course_lesson_progress: update own if enrolled" on public.course_lesson_progress;
create policy "course_lesson_progress: update own if enrolled" on public.course_lesson_progress
  for update using (founder_id = auth.uid())
  with check (
    founder_id = auth.uid()
    and exists (select 1 from public.course_enrollments e where e.founder_id = auth.uid() and e.course_slug = course_lesson_progress.course_slug)
  );

-- Video IDs. Server only: the app signs a short-lived player link for
-- buyers, so the raw ID is never sent to a browser that hasn't paid.
create table if not exists public.course_lesson_media (
  course_slug text not null,
  lesson_key text not null check (lesson_key ~ '^l[0-9]{2}$'),
  video_id text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  primary key (course_slug, lesson_key)
);
alter table public.course_lesson_media enable row level security;
grant select, insert, update, delete on public.course_lesson_media to service_role;

-- Fulfilment: the course branch grants the course (or all three for the
-- bundle). Everything else is unchanged from 2026-10-14_growth.sql.
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
  elsif pay.product::text = 'course' then
    insert into public.course_enrollments (founder_id, course_slug, payment_id, enrolled_at)
    select pay.founder_id, s, pay.id, p_now
      from unnest(case when pay.course_slug = 'readiness-bundle'
                       then array['customer-readiness', 'capital-readiness', 'investor-readiness']
                       else array[pay.course_slug] end) as s
     where s in ('customer-readiness', 'capital-readiness', 'investor-readiness')
    on conflict (founder_id, course_slug) do nothing;
  elsif pay.advisor_session_id is not null then
    update public.advisor_sessions set paid_at = p_now where id = pay.advisor_session_id and paid_at is null;
  end if;
  return 'fulfilled';
end;
$$;

revoke all on function fulfil_payment(uuid, text, numeric, text, text, timestamptz) from public, anon, authenticated;
grant execute on function fulfil_payment(uuid, text, numeric, text, text, timestamptz) to service_role;
