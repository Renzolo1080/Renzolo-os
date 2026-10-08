import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "fs";
import { join } from "path";
import { isSubscriptionActive } from "../lib/payments";

/** Database tests. Loads the real SQL files into an in-process Postgres
 * (PGlite — no server, no network, no Supabase account) and checks:
 *  - the access rules: who can read and write what;
 *  - the payment functions: granted once, all-or-nothing, right dates.
 *
 * Run twice: once on a fresh install (supabase/schema.sql) and once on a
 * database built from the schema as it stood before 2026-10-08 and then
 * upgraded with the migration files (each applied twice, to prove they
 * are safe to re-run). Both must behave identically.
 *
 * What this cannot show: two requests truly running at the same instant
 * (PGlite is a single connection), or anything about Supabase's own
 * hosted configuration. */

const root = join(__dirname, "..");
const sql = (p: string) => readFileSync(join(root, p), "utf8");

let failures = 0;
let passes = 0;
function assert(cond: boolean, msg: string, detail?: unknown) {
  if (!cond) {
    failures++;
    console.error("FAIL:", msg, detail === undefined ? "" : JSON.stringify(detail));
    process.exitCode = 1;
  } else {
    passes++;
    console.log("PASS:", msg);
  }
}

const A = "11111111-1111-1111-1111-111111111111"; // founder
const B = "22222222-2222-2222-2222-222222222222"; // another founder
const S = "33333333-3333-3333-3333-333333333333"; // advisor
const M = "44444444-4444-4444-4444-444444444444"; // admin
const C = "55555555-5555-5555-5555-555555555555"; // founder used for payment-function tests
const D = "66666666-6666-6666-6666-666666666666"; // founder with a manual grant

type Result = { ok: true; rows: any[]; n: number } | { ok: false; err: string; rows: any[]; n: number };

async function suite(label: string, files: string[]) {
  console.log(`\n===== ${label} =====`);
  const db = new PGlite();

  // Stand-ins for what Supabase provides: its three API roles, the auth
  // schema, auth.uid(), and its habit of granting the API roles access to
  // every new table and function (which is why the SQL must lock things
  // down explicitly rather than rely on defaults).
  await db.exec(`
    create role authenticated nologin; create role anon nologin; create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated, anon, service_role;
    grant usage on schema public to authenticated, anon, service_role;
    alter default privileges in schema public grant all on tables to authenticated, anon, service_role;
    alter default privileges in schema public grant execute on functions to authenticated, anon, service_role;
  `);
  for (const f of files) await db.exec(sql(f));

  await db.exec(`
    insert into auth.users values
      ('${A}','a@x','{"full_name":"A"}'), ('${B}','b@x','{"full_name":"B"}'),
      ('${S}','s@x','{"full_name":"Advisor"}'), ('${M}','m@x','{"full_name":"Admin"}'),
      ('${C}','c@x','{"full_name":"C"}'), ('${D}','d@x','{"full_name":"D"}');
    update profiles set role='advisor' where id='${S}';
    update profiles set role='admin' where id='${M}';
  `);

  async function run(role: string, uid: string | null, q: string): Promise<Result> {
    await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub','${uid ?? ""}',false);`);
    try {
      const r = await db.query(q);
      return { ok: true, rows: r.rows as any[], n: r.affectedRows ?? 0 };
    } catch (e: any) {
      return { ok: false, err: String(e?.message ?? e), rows: [], n: 0 };
    } finally {
      await db.exec(`reset role;`);
    }
  }
  const U = (uid: string, q: string) => run("authenticated", uid, q);
  const SRV = (q: string) => run("service_role", null, q);
  const one = async (q: string) => (await SRV(q)).rows[0];
  let r: Result;

  // ------------------------------------------------------------------
  // Access rules
  // ------------------------------------------------------------------
  r = await U(A, `select id from profiles`);
  assert(r.ok && r.rows.length === 1 && r.rows[0].id === A, "founder sees only own profile", r);
  r = await U(A, `insert into assessments (founder_id,status) values ('${A}','scored') returning id`);
  assert(r.ok, "founder creates own assessment", r);
  const aid = r.rows[0]?.id;
  r = await U(A, `insert into assessments (founder_id) values ('${B}')`);
  assert(!r.ok, "founder cannot create an assessment for someone else");
  r = await U(A, `insert into block_responses (assessment_id,block_key) values ('${aid}','customer_segments') returning id`);
  assert(r.ok, "founder saves block responses", r);
  const brid = r.rows[0]?.id;

  const scoreSql = `insert into scores (assessment_id,venture_score,venture_tier,market_subscore,customer_subscore,investor_subscore,health_index,health_confidence,evidence_completeness,block_scores,gaps) values ('${aid}',99,'Investor Ready',99,99,99,99,'High',1,'{}','[]') returning id`;
  r = await U(A, scoreSql);
  assert(!r.ok, "founder cannot write a score from the browser");
  r = await SRV(scoreSql);
  assert(r.ok, "server writes the score", r);
  const sid = r.rows[0]?.id;
  r = await U(A, `select id from scores`);
  assert(r.ok && r.rows.length === 1, "founder reads own score", r);
  r = await U(B, `select id from scores`);
  assert(r.ok && r.rows.length === 0, "other founder cannot read that score", r);
  r = await U(B, `select id from assessments`);
  assert(r.ok && r.rows.length === 0, "other founder cannot read that assessment", r);

  const repSql = `insert into reports (assessment_id,score_id,diagnostic_markdown) values ('${aid}','${sid}','x') returning id`;
  r = await U(A, repSql);
  assert(!r.ok, "founder cannot write a report from the browser");
  r = await SRV(repSql);
  assert(r.ok, "server writes the report", r);
  const rid = r.rows[0]?.id;

  // The report is the paid product: readable only while subscribed.
  r = await U(A, `select id from reports`);
  assert(r.ok && r.rows.length === 0, "founder with no subscription cannot read their report, even by querying the database directly", r);
  await SRV(`insert into subscriptions (founder_id,status,current_period_end) values ('${A}','active', now() + interval '10 days')`);
  r = await U(A, `select id from reports`);
  assert(r.ok && r.rows.length === 1, "subscribed founder reads own report", r);
  r = await U(B, `select id from reports`);
  assert(r.ok && r.rows.length === 0, "other founder cannot read that report", r);
  await SRV(`update subscriptions set current_period_end = now() - interval '1 hour' where founder_id='${A}'`);
  r = await U(A, `select id from reports`);
  assert(r.ok && r.rows.length === 0, "once the subscription lapses the report is locked again", r);
  r = await U(S, `select id from reports`);
  assert(r.ok && r.rows.length === 1, "advisor still sees the report queue", r);
  await SRV(`update subscriptions set current_period_end = now() + interval '10 days' where founder_id='${A}'`);

  r = await U(A, `insert into recommendations (assessment_id,report_id,source,title,priority) values ('${aid}','${rid}','ai','do x',0)`);
  assert(r.ok, "AI recommendations save under the founder's session", r);
  r = await U(A, `insert into milestones (assessment_id,title) values ('${aid}','m1')`);
  assert(r.ok, "founder adds a milestone", r);
  r = await U(B, `insert into milestones (assessment_id,title) values ('${aid}','hack')`);
  assert(!r.ok, "other founder cannot add to that assessment");
  r = await U(A, `update block_responses set progress_status='on_track' where id='${brid}'`);
  assert(r.ok && r.n === 1, "founder updates goal progress", r);
  r = await U(A, `update profiles set dashboard_widgets='["valuation"]' where id='${A}'`);
  assert(r.ok && r.n === 1, "founder updates own dashboard widgets", r);
  r = await U(A, `update profiles set role='admin' where id='${A}'`);
  assert(!r.ok, "founder cannot make themselves admin");
  assert((await one(`select role from profiles where id='${A}'`))?.role === "founder", "…role is still 'founder'");
  r = await U(A, `update profiles set full_name='x' where id='${B}'`);
  assert(r.ok && r.n === 0, "founder cannot edit another profile", r);

  r = await U(A, `insert into advisor_sessions (founder_id,report_id,price,paid_at) values ('${A}','${rid}',30,now())`);
  assert(!r.ok, "founder cannot create an advisor session (or mark one paid) from the browser");
  r = await SRV(`insert into advisor_sessions (founder_id,report_id,price,flutterwave_tx_ref) values ('${A}','${rid}',30,'renzolo-advisor_session-a-1') returning id`);
  assert(r.ok, "server creates the advisor session", r);
  const sess = r.rows[0]?.id;
  r = await U(A, `select id, paid_at from advisor_sessions`);
  assert(r.ok && r.rows.length === 1 && r.rows[0].paid_at === null, "founder sees own advisor session, unpaid", r);
  r = await U(A, `update advisor_sessions set paid_at=now() where id='${sess}'`);
  assert(r.ok && r.n === 0, "founder cannot mark own session paid", r);

  const paySql = (ref: string, txid?: string, founder = A) =>
    `insert into payments (tx_ref,founder_id,product,billing_interval,amount,currency${txid ? ",flutterwave_transaction_id" : ""}) values ('${ref}','${founder}','subscription','monthly',9,'USD'${txid ? `,'${txid}'` : ""}) returning id`;
  r = await U(A, paySql("renzolo-subscription-a-0"));
  assert(!r.ok, "founder cannot write a payment record from the browser");
  r = await SRV(paySql("renzolo-subscription-a-1", "9001"));
  assert(r.ok, "server records a payment", r);
  r = await SRV(paySql("renzolo-subscription-a-1"));
  assert(!r.ok, "duplicate payment reference is rejected");
  r = await SRV(paySql("renzolo-subscription-a-2", "9001"));
  assert(!r.ok, "one Flutterwave transaction can't be recorded twice");
  r = await SRV(`insert into payments (tx_ref,founder_id,product,amount,currency) values ('renzolo-subscription-a-3','${A}','subscription',0,'USD')`);
  assert(!r.ok, "a zero-amount payment is rejected");
  r = await U(A, `select id from payments`);
  assert(r.ok && r.rows.length === 1, "founder reads own payments", r);
  r = await U(B, `select id from payments`);
  assert(r.ok && r.rows.length === 0, "other founder cannot read those payments", r);
  r = await U(A, `update payments set status='successful'`);
  assert(r.ok && r.n === 0, "founder cannot mark a payment successful", r);
  r = await U(B, `insert into subscriptions (founder_id,status) values ('${B}','active')`);
  assert(!r.ok, "founder cannot grant themselves a subscription");
  r = await U(A, `update subscriptions set current_period_end='2099-01-01'`);
  assert(r.ok && r.n === 0, "founder cannot extend their own subscription", r);
  r = await SRV(`insert into subscriptions (founder_id,status) values ('${A}','active')`);
  assert(!r.ok, "a founder can never have two subscription rows");

  for (const fn of [
    `fulfil_payment('${aid}', '1', 9, 'a@x', '1')`,
    `record_renewal('${A}', '1', 9, 'USD', 'a@x', '1')`,
    `extend_subscription('${A}', 'annual', false, 'a@x', '1', 90, 'USD', now())`,
  ]) {
    const name = fn.split("(")[0];
    r = await U(A, `select ${fn}`);
    assert(!r.ok && /permission denied/i.test(r.ok ? "" : r.err), `founder cannot run ${name}() to grant themselves access`, r);
    r = await run("anon", null, `select ${fn}`);
    assert(!r.ok && /permission denied/i.test(r.ok ? "" : r.err), `anonymous visitor cannot run ${name}()`, r);
  }

  r = await U(A, `select * from app_settings`);
  assert(r.ok && r.rows.length === 0, "founder cannot read admin settings", r);
  r = await U(A, `select * from quiz_leads`);
  assert(r.ok && r.rows.length === 0, "founder cannot read lead lists", r);
  r = await U(S, `select id from profiles`);
  assert(r.ok && r.rows.length === 6, "advisor sees all profiles", r);
  r = await U(S, `update reports set advisor_reviewed=true where id='${rid}'`);
  assert(r.ok && r.n === 1, "advisor marks a report reviewed", r);
  r = await U(S, `select * from app_settings`);
  assert(r.ok && r.rows.length === 0, "advisor cannot read admin settings", r);
  r = await U(M, `update app_settings set qa_review_enabled=false where id=true`);
  assert(r.ok && r.n === 1, "admin flips the QA toggle", r);
  r = await run("anon", null, `insert into quiz_leads (email,answers,score,tier) values ('q@x','{}',1,'t')`);
  assert(r.ok, "anonymous visitor submits a quiz lead", r);
  r = await run("anon", null, `select * from profiles`);
  assert(r.ok && r.rows.length === 0, "anonymous visitor reads no profiles", r);

  // ------------------------------------------------------------------
  // Payment functions (the all-or-nothing grant)
  // ------------------------------------------------------------------
  const T0 = "2026-10-08T12:00:00Z";
  const iso = (v: any) => (v ? new Date(v).toISOString() : null);
  const sub = (founder = C) => one(`select * from subscriptions where founder_id='${founder}'`);
  const newPayment = async (ref: string, opts: { founder?: string; interval?: string; autoRenew?: boolean; amount?: number } = {}) =>
    (
      await SRV(
        `insert into payments (tx_ref,founder_id,product,billing_interval,auto_renew,amount,currency) values ('${ref}','${opts.founder ?? C}','subscription','${opts.interval ?? "monthly"}',${opts.autoRenew ? "true" : "false"},${opts.amount ?? 9},'USD') returning id`
      )
    ).rows[0].id as string;
  const fulfil = (id: string, txid: string, at = T0) => SRV(`select fulfil_payment('${id}','${txid}',9,'C@X.com','501','${at}') as r`);

  const p1 = await newPayment("renzolo-subscription-c-1");
  r = await fulfil(p1, "7001");
  assert(r.ok && r.rows[0].r === "fulfilled", "fulfil_payment: first call grants", r);
  let s1 = await sub();
  assert(s1?.status === "active" && iso(s1.current_period_end) === "2026-11-08T12:00:00.000Z", "…subscription is active and paid through one month on", s1);
  assert(s1.billing_email === "c@x.com" && s1.flutterwave_customer_id === "501" && s1.auto_renew === false, "…payer email (lower-cased) and customer number are kept; not auto-renewing");
  const pay1 = await one(`select status, flutterwave_transaction_id, fulfilled_at from payments where id='${p1}'`);
  assert(pay1.status === "successful" && pay1.flutterwave_transaction_id === "7001" && !!pay1.fulfilled_at, "…and the payment is marked successful");

  r = await fulfil(p1, "7001");
  assert(r.ok && r.rows[0].r === "already_fulfilled", "fulfil_payment: the same payment again reports already fulfilled", r);
  assert(iso((await sub()).current_period_end) === "2026-11-08T12:00:00.000Z", "…and does NOT add a second month");

  const p2 = await newPayment("renzolo-subscription-c-2");
  await fulfil(p2, "7002");
  assert(iso((await sub()).current_period_end) === "2026-12-08T12:00:00.000Z", "a second, separate payment adds its own month on top (two payments, two periods)");

  const p3 = await newPayment("renzolo-subscription-c-3", { interval: "annual", amount: 90 });
  await fulfil(p3, "7003");
  s1 = await sub();
  assert(iso(s1.current_period_end) === "2027-12-08T12:00:00.000Z" && s1.billing_interval === "annual", "an annual payment adds a year from the existing end date");

  await SRV(`update subscriptions set current_period_end='2026-09-01T00:00:00Z' where founder_id='${C}'`);
  const p4 = await newPayment("renzolo-subscription-c-4");
  await fulfil(p4, "7004");
  assert(iso((await sub()).current_period_end) === "2026-11-08T12:00:00.000Z", "paying after a lapse starts a fresh period from now, not from the old end date");

  await SRV(`update subscriptions set current_period_end=null where founder_id='${C}'`);
  await SRV(`delete from subscriptions where founder_id='${C}'`);
  const p5 = await newPayment("renzolo-subscription-c-5");
  await fulfil(p5, "7005", "2026-01-31T00:00:00Z");
  assert(iso((await sub()).current_period_end) === "2026-02-28T00:00:00.000Z", "a month from 31 January is 28 February (clamped, not 3 March)");

  // all-or-nothing: make the subscription step fail and check nothing sticks
  await db.exec(`
    create function test_break() returns trigger language plpgsql as $$ begin raise exception 'simulated database failure'; end $$;
    create trigger test_break before insert or update on subscriptions for each row execute function test_break();
  `);
  const p6 = await newPayment("renzolo-subscription-c-6");
  const before = iso((await sub()).current_period_end);
  r = await fulfil(p6, "7006");
  assert(!r.ok, "if saving the subscription fails, fulfil_payment fails as a whole");
  const pay6 = await one(`select status, flutterwave_transaction_id, fulfilled_at from payments where id='${p6}'`);
  assert(pay6.status === "pending" && pay6.flutterwave_transaction_id === null && pay6.fulfilled_at === null, "…and the payment is NOT left marked as paid (no 'paid but nothing granted')", pay6);
  assert(iso((await sub()).current_period_end) === before, "…and the subscription is unchanged");
  await db.exec(`drop trigger test_break on subscriptions;`);
  r = await fulfil(p6, "7006");
  assert(r.ok && r.rows[0].r === "fulfilled", "…so the retry completes it", r);

  // auto-renew
  await SRV(`delete from subscriptions where founder_id='${C}'`);
  const p7 = await newPayment("renzolo-subscription-c-7", { autoRenew: true });
  await fulfil(p7, "7007");
  s1 = await sub();
  assert(s1.auto_renew === true && s1.renewal_interval === "monthly" && Number(s1.renewal_amount) === 9 && s1.renewal_currency === "USD", "choosing card auto-renew records what each renewal is expected to be", s1);

  r = await SRV(`select record_renewal('${C}','8001',9,'USD','c@x.com','501','2026-11-08T12:00:00Z') as r`);
  assert(r.ok && r.rows[0].r === "fulfilled", "record_renewal: an automatic renewal is recorded", r);
  assert(iso((await sub()).current_period_end) === "2026-12-08T12:00:00.000Z", "…and extends the subscription by one period");
  r = await SRV(`select record_renewal('${C}','8001',9,'USD','c@x.com','501','2026-11-08T12:05:00Z') as r`);
  assert(r.ok && r.rows[0].r === "already_fulfilled" && iso((await sub()).current_period_end) === "2026-12-08T12:00:00.000Z", "record_renewal: the same transaction again extends nothing", r);
  assert((await one(`select count(*)::int as c from payments where flutterwave_transaction_id='8001'`)).c === 1, "…and is recorded exactly once");

  await db.exec(`create trigger test_break before insert or update on subscriptions for each row execute function test_break();`);
  r = await SRV(`select record_renewal('${C}','8002',9,'USD','c@x.com','501','2026-12-08T12:00:00Z') as r`);
  assert(!r.ok, "if extending fails, record_renewal fails as a whole");
  assert((await one(`select count(*)::int as c from payments where flutterwave_transaction_id='8002'`)).c === 0, "…leaving no record behind, so Flutterwave's retry is not mistaken for a duplicate");
  await db.exec(`drop trigger test_break on subscriptions;`);
  r = await SRV(`select record_renewal('${C}','8002',9,'USD','c@x.com','501','2026-12-08T12:00:00Z') as r`);
  assert(r.ok && r.rows[0].r === "fulfilled" && iso((await sub()).current_period_end) === "2027-01-08T12:00:00.000Z", "…and the retry then extends it", r);

  // a one-off payment by an auto-renewing founder must not break renewals
  const p8 = await newPayment("renzolo-subscription-c-8", { interval: "annual", amount: 90 });
  await fulfil(p8, "7008", "2026-12-10T00:00:00Z");
  s1 = await sub();
  assert(s1.auto_renew === true, "a one-off payment does not switch card auto-renewal off");
  assert(s1.renewal_interval === "monthly" && Number(s1.renewal_amount) === 9, "…or change what the next automatic renewal is expected to be", s1);
  assert(iso(s1.current_period_end) === "2028-01-08T12:00:00.000Z", "…and its year is added on top");

  r = await SRV(`select record_renewal('${B}','8003',9,'USD','b@x','1') as r`);
  assert(r.ok && r.rows[0].r === "no_auto_renew", "record_renewal refuses a founder who is not on auto-renew", r);

  // manual never-expiring grant
  await SRV(`insert into subscriptions (founder_id,status,current_period_end) values ('${D}','active',null)`);
  const p9 = await newPayment("renzolo-subscription-d-1", { founder: D });
  await fulfil(p9, "7009");
  const sd = await sub(D);
  assert(sd.status === "active" && sd.current_period_end === null, "a payment never turns a manual never-expiring grant into one that expires", sd);

  // advisor session
  const sessPay = (
    await SRV(`insert into payments (tx_ref,founder_id,product,advisor_session_id,amount,currency) values ('renzolo-advisor_session-a-9','${A}','advisor_session','${sess}',30,'USD') returning id`)
  ).rows[0].id;
  const subBefore = iso((await sub(A)).current_period_end);
  r = await SRV(`select fulfil_payment('${sessPay}','7100',30,'a@x','9','${T0}') as r`);
  const sessRow = await one(`select paid_at from advisor_sessions where id='${sess}'`);
  assert(r.ok && r.rows[0].r === "fulfilled" && iso(sessRow.paid_at) === "2026-10-08T12:00:00.000Z", "an advisor-session payment marks that session paid", r);
  assert(iso((await sub(A)).current_period_end) === subBefore, "…and does not touch the subscription");
  r = await U(S, `update advisor_sessions set status='scheduled' where id='${sess}' and paid_at is not null`);
  assert(r.ok && r.n === 1, "advisor schedules the paid session", r);

  // ------------------------------------------------------------------
  // "Is this founder subscribed?" — database and app must agree
  // ------------------------------------------------------------------
  const cases: { name: string; status: string; end: string | null; autoRenew: boolean }[] = [
    { name: "active, no end date (manual grant)", status: "active", end: null, autoRenew: false },
    { name: "active, ends in 5 days", status: "active", end: "now() + interval '5 days'", autoRenew: false },
    { name: "active, ended an hour ago, one-off", status: "active", end: "now() - interval '1 hour'", autoRenew: false },
    { name: "active, ended 2 days ago, auto-renew (inside grace)", status: "active", end: "now() - interval '2 days'", autoRenew: true },
    { name: "active, ended 4 days ago, auto-renew (past grace)", status: "active", end: "now() - interval '4 days'", autoRenew: true },
    { name: "canceled, end date in future", status: "canceled", end: "now() + interval '5 days'", autoRenew: false },
    { name: "none", status: "none", end: null, autoRenew: false },
  ];
  for (const c of cases) {
    await SRV(`delete from subscriptions where founder_id='${B}'`);
    await SRV(`insert into subscriptions (founder_id,status,current_period_end,auto_renew) values ('${B}','${c.status}',${c.end ?? "null"},${c.autoRenew})`);
    const row = await sub(B);
    const dbSays = (await U(B, `select has_active_subscription() as a`)).rows[0]?.a;
    const appSays = isSubscriptionActive({ status: row.status, current_period_end: iso(row.current_period_end), auto_renew: row.auto_renew });
    assert(dbSays === appSays, `database and app agree on "${c.name}" (${appSays ? "access" : "no access"})`, { dbSays, appSays });
  }
  await SRV(`delete from subscriptions where founder_id='${B}'`);
  assert((await U(B, `select has_active_subscription() as a`)).rows[0]?.a === false, "no subscription row: no access");

  await db.close();
}

async function main() {
  await suite("Fresh install: supabase/schema.sql", ["supabase/schema.sql"]);
  await suite("Upgrade: schema before 2026-10-08 + migrations (each applied twice)", [
    "test/fixtures/schema-before-2026-10-08.sql",
    "supabase/migrations/2026-10-08_fix_access_rules.sql",
    "supabase/migrations/2026-10-08_fix_access_rules.sql",
    "supabase/migrations/2026-10-09_payments.sql",
    "supabase/migrations/2026-10-09_payments.sql",
  ]);
  console.log(`\nDatabase tests completed: ${passes} passed, ${failures} failed.`);
}

main().catch((e) => {
  console.error("FAIL: test run crashed:", e);
  process.exitCode = 1;
});
