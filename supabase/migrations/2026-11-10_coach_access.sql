-- Coach access with the founder's permission (approved Nov 10, 2026).
-- A founder shares their plan, actions and dashboard with ONE assigned
-- coach at a time, and can stop sharing whenever they like. Rows are never
-- deleted: each grant and each revocation is kept as a record. Coaches can
-- read only the grants made to them; the coach pages (service role) load a
-- founder's plan, goals and updates only while a grant is active.
-- Safe to run more than once.

create table if not exists coach_access (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references profiles(id) on delete cascade,
  coach_id uuid not null references profiles(id) on delete cascade,
  consent_version text not null check (length(consent_version) between 1 and 10),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (founder_id <> coach_id),
  check (revoked_at is null or revoked_at >= granted_at)
);
create unique index if not exists coach_access_one_active on coach_access (founder_id) where revoked_at is null;
create index if not exists coach_access_coach_idx on coach_access (coach_id) where revoked_at is null;

-- True when a user is a coach (advisor) or admin. Security definer, so a
-- founder's insert can check the role without reading other profiles.
create or replace function is_coach_user(uid uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = uid and p.role in ('advisor','admin'));
$$;
revoke execute on function is_coach_user(uuid) from public, anon;
grant execute on function is_coach_user(uuid) to authenticated, service_role;

alter table coach_access enable row level security;
grant select, insert, update on coach_access to service_role;
grant select, insert on coach_access to authenticated;
grant update (revoked_at) on coach_access to authenticated;
revoke all on coach_access from anon;
revoke delete on coach_access from authenticated;

do $$ begin
  create policy "coach_access: founder, their coach or staff read" on coach_access for select
    using (founder_id = auth.uid() or coach_id = auth.uid() or is_staff());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "coach_access: founder grants to a coach" on coach_access for insert
    with check (founder_id = auth.uid() and revoked_at is null and is_coach_user(coach_id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "coach_access: founder revokes own" on coach_access for update
    using (founder_id = auth.uid()) with check (founder_id = auth.uid() and revoked_at is not null);
exception when duplicate_object then null; end $$;
