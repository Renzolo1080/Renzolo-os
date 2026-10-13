-- Founder Trajectory tiers, part 1 of 2: new values for existing types.
-- Kept in its own file because Postgres won't use a newly added enum value
-- in the same transaction that added it. Safe to run more than once.
alter type billing_interval add value if not exists 'quarterly';
alter type payment_product add value if not exists 'assessment';
alter type payment_product add value if not exists 'coaching';
