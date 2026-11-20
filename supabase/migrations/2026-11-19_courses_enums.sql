-- Founder Trajectory(TM) Academy courses, part 1 of 2: the new payment
-- product. Kept in its own file because Postgres won't use a newly added
-- enum value in the same transaction that added it. Safe to run more than once.
alter type payment_product add value if not exists 'course';
