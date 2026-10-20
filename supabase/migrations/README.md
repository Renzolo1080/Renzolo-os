# Migrations

Each file is safe to run more than once. Run them in date order in the
Supabase SQL editor.

## New tables need explicit grants (from 30 Oct 2026)

Supabase no longer gives the API roles (`anon`, `authenticated`,
`service_role`) access to new tables in `public` automatically. Without a
grant, supabase-js returns "permission denied" for that table.

So every migration that creates a table must also grant access to it, in
the same file, right after `create table` and before any `revoke`. Grant
only what the table needs; row level security still decides which rows
each person sees.

```sql
create table if not exists public.example ( ... );
alter table public.example enable row level security;

-- Server code (service role) reads and writes.
grant select, insert, update, delete on public.example to service_role;
-- Signed-in users, limited further by the policies on the table.
grant select, insert, update, delete on public.example to authenticated;
-- Visitors who are not signed in: only if the browser really needs it.
-- grant select on public.example to anon;
```

`test/db.test.ts` checks this: it runs the schema and the migrations with
automatic grants switched off and fails if any table is left without them.
