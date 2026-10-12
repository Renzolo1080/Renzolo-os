-- RENZOLO OS™ — Quick Check answers (run once on an EXISTING database)
--
-- Adds one column for the Quick Check answers that have no column of
-- their own. Safe to run more than once; changes no existing rows.
-- Applied to the live project on 2026-10-12.

alter table public.assessments add column if not exists extra jsonb not null default '{}'::jsonb;
