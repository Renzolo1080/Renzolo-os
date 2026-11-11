-- Nov 1 2026 pricing: included coaching per membership period.
--   Essentials: 1 basic 30-minute session per quarter (new)
--   Growth:     2 x 30-minute sessions per quarter (unchanged)
--   Elevate:    1 x 60-minute session per month (was 2 per month)
-- Credits expire at the end of each quarter (Essentials, Growth) or month
-- (Elevate). Session length is set by the coach at booking.
create or replace function grant_included_coaching(
  p_founder uuid, p_tier membership_tier, p_start timestamptz, p_months integer, p_payment uuid
) returns void
  language plpgsql security definer set search_path = public as $$
declare
  chunk integer;
  qty integer;
  n integer;
  i integer;
begin
  if p_tier::text = 'essentials' then chunk := 3; qty := 1;
  elsif p_tier::text = 'growth' then chunk := 3; qty := 2;
  elsif p_tier::text = 'elevate' then chunk := 1; qty := 1;
  else return;
  end if;
  n := greatest(1, p_months / chunk);
  for i in 0 .. n - 1 loop
    insert into public.coaching_credits (founder_id, source, tier, quantity, available_from, expires_at, payment_id)
    values (p_founder, 'membership', p_tier, qty,
            ((p_start at time zone 'UTC') + make_interval(months => i * chunk)) at time zone 'UTC',
            ((p_start at time zone 'UTC') + make_interval(months => (i + 1) * chunk)) at time zone 'UTC',
            p_payment);
  end loop;
end;
$$;
