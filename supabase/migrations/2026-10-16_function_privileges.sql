-- RENZOLO OS™ — tighten who can call the database's helper functions
-- (run once on an EXISTING database). Fixes Supabase security advisor
-- warnings. Safe to run more than once; changes no rows.
--
-- handle_new_user() only runs as the sign-up trigger. Nobody needs to call
-- it directly, and the trigger keeps working without these grants.
revoke execute on function handle_new_user() from public, anon, authenticated;

-- is_staff(), is_admin() and has_active_subscription() are used by the
-- access rules, which run as the signed-in founder, so signed-in founders
-- keep access (each only ever answers about the caller). Signed-out
-- visitors never need them: everything they submit goes through the server.
revoke execute on function is_staff() from public, anon;
revoke execute on function is_admin() from public, anon;
revoke execute on function has_active_subscription() from public, anon;
grant execute on function is_staff() to authenticated, service_role;
grant execute on function is_admin() to authenticated, service_role;
grant execute on function has_active_subscription() to authenticated, service_role;
