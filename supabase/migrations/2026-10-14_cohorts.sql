-- Academy cohorts are now Foundations (8 weeks), Growth (12 weeks) and
-- Elevate (6 months). 'essentials_growth' is kept for any early
-- applications. Safe to run more than once.
alter table cohort_applications drop constraint if exists cohort_applications_cohort_check;
alter table cohort_applications add constraint cohort_applications_cohort_check
  check (cohort in ('foundations', 'growth', 'elevate', 'essentials_growth'));
