-- Academy cohorts renamed so they can't be confused with membership
-- levels: Launch (8 weeks), Build (12 weeks) and Scale (6 months).
-- Safe to run more than once.
alter table cohort_applications drop constraint if exists cohort_applications_cohort_check;
update cohort_applications set cohort = case cohort
  when 'foundations' then 'launch'
  when 'essentials_growth' then 'launch'
  when 'growth' then 'build'
  when 'elevate' then 'scale'
  else cohort end
where cohort in ('foundations', 'essentials_growth', 'growth', 'elevate');
alter table cohort_applications add constraint cohort_applications_cohort_check
  check (cohort in ('launch', 'build', 'scale'));
