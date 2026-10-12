# RENZOLO OS™ — Phase 1 Launch MVP

Founder BMC Readiness Assessment: a free public Readiness Snapshot funnel,
registration, the full 9-block assessment, the scoring engine, an
instantly-delivered AI-drafted Diagnostic Report, subscription billing via
Flutterwave (cards + mobile money across African markets), a paid 1:1
Advisor Session upsell, and an advisor-facing queue for both report QA
and session scheduling.

## Status (as of this build session)

**Verified working right now, without any external accounts:**
- `lib/scoring.ts` — the full scoring engine (Venture Score, tiers, Market/
  Customer/Investor sub-scores, Health Index, gap detection). Run
  `npm run test:scoring` — 10/10 tests pass.
- The whole project type-checks cleanly (`npx tsc --noEmit`) and the
  Next.js webpack build compiles successfully.

**Written and ready, but needs your API keys to actually run:**
- Free Readiness Snapshot (`app/snapshot`, `app/api/snapshot`) — no login
  required; captures a lead (`snapshot_leads` table) and shows a teaser
  score/tier, with a CTA into full registration. This is the top-of-funnel
  entry point linked from the homepage.
- Auth pages (`app/register`, `app/login`) — Supabase Auth.
- 9-block assessment wizard (`app/assessment`) — saves to Supabase,
  scores automatically on submit.
- Dashboard (`app/dashboard`) — shows Venture Score, sub-scores, Health
  Index, and an instant-delivery report panel (`components/ReportPanel.tsx`).
- AI Diagnostic Report generation (`app/api/report`, `lib/anthropic.ts`) —
  calls Claude and **returns the full report in the same response — the
  founder sees it immediately**, no waiting on advisor sign-off. The
  24–36 hour SLA (`ADVISOR_REVIEW_SLA_*` env vars) is background QA only:
  it flags a report for an advisor to read and mark reviewed, but never
  gates what the founder already has.
- Paid 1:1 Advisor Session upsell (`app/api/advisor-session/checkout`,
  `app/api/advisor-session/[id]/schedule`) — from the report panel, a
  founder can book a paid session; checkout runs through the same
  Flutterwave integration as the subscription (`lib/flutterwave.ts`
  disambiguates the two products by `tx_ref`), and the session is marked
  paid once Flutterwave confirms the payment — only paid sessions appear
  in the advisor queue. An advisor then coordinates the actual time by email or
  call (Keep Manual for launch) and marks it scheduled.
- Advisor Review Queue (`app/advisor`) — two sections: pending report
  reviews (with overdue flagging against the SLA) and paid sessions
  awaiting scheduling. `components/ReviewButton.tsx` and
  `components/ScheduleButton.tsx` drive the two actions. Admins
  additionally see a live QA toggle (`components/QAToggle.tsx`,
  `app/api/admin/qa-setting`) that turns mandatory human review on or
  off for all new reports without a redeploy — on for a pilot/testing
  phase, off once volume makes 100% review infeasible. A Low-confidence
  report is queued for review either way, regardless of the toggle
  (the logic lives in `app/api/report/route.ts`), since that's exactly
  the case where thin self-reported evidence most needs a human check.
- Assessment context now also captures business type, years in
  business, team size, and annual revenue (`app/assessment/page.tsx`
  step 0, stored on `assessments`) — these, plus the founder's own
  current-state/future-state/goal answers for each of the 9 blocks, feed
  the AI report so its market-comparison language is grounded in this
  founder's actual business, not a generic one. `lib/anthropic.ts` also
  now uses Anthropic's server-side web search tool to pull 2-4 current,
  cited data points (e.g. CAC/LTV or margin benchmarks, comparable
  market size) relevant to the founder's specific industry, location,
  and stage, rather than relying only on the model's training data. Web
  search is billed separately by Anthropic (~$10 per 1,000 searches, on
  top of normal token cost) — worth watching as report volume grows;
  each report is capped at 4 searches.
- Flutterwave subscription + advisor-session checkout, return page and
  webhook (`app/api/billing/*`, `app/api/advisor-session/*`,
  `lib/flutterwave.ts`, `lib/payments.ts`) — covers cards and mobile
  money (M-Pesa, etc.) in one integration. See "How payments work".
- Supabase schema with row-level security (`supabase/schema.sql`),
  including `snapshot_leads` and `advisor_sessions`.

**Deliberately deferred past this Launch MVP** (per the agreed scope cut):
Growth Navigator 3-scenario plan (base/target/stretch), and the Verified
Readiness Passport™ PDF export.

## Why this couldn't be fully click-tested inside this session

This build ran inside two network-restricted environments (Anthropic's
cloud workspace, and this Mac's linked sandbox): both block outbound
calls to Supabase, Flutterwave, and Vercel, and this Mac's sandbox is
also too slow to finish a full `next build` or start `next dev` within a
single command's time limit. None of that reflects a problem with the
code — the type-check passes cleanly on every round of changes, and an
earlier run showed the webpack build itself compiling successfully. The
first real end-to-end test happens once you run this on hardware with
normal network access (your actual Terminal, not through Claude — or
once it's deployed to Vercel).

## About your GoDaddy hosting

Your GoDaddy plan's shared cPanel hosting cannot run a Next.js app (it
needs a Node.js server process, not static file hosting) — but your
domain itself doesn't need to move. The plan is: deploy this codebase to
Vercel (free to start), then point your GoDaddy domain's DNS at Vercel
(a CNAME/A-record change in GoDaddy's DNS manager — no re-purchase or
transfer needed). Your GoDaddy subscription keeps the domain; Vercel just
runs the app behind it.

## To actually go live, in order

1. **Create accounts** (all free to start): [Supabase](https://supabase.com),
   [Flutterwave](https://flutterwave.com) (needs your LLC's incorporation
   docs, EIN, and a bank letter — start this NOW, approval isn't
   instant), an [Anthropic API key](https://console.anthropic.com), and a
   [GitHub](https://github.com) repo for this code.
2. Run `supabase/schema.sql` in your Supabase project's SQL editor. If the
   project was already set up from a copy of that file dated before
   2026-10-08, run `supabase/migrations/2026-10-08_fix_access_rules.sql`
   then `supabase/migrations/2026-10-09_payments.sql`, in that order,
   instead — they repair the access rules and add the payments tables
   without touching any existing data.
3. Copy `.env.example` to `.env.local` and fill in the real keys.
4. In your own Terminal (not through Claude): `npm install && npm run dev`
   — this is the fastest way to actually click through it before
   deploying.
5. Push to GitHub, connect the repo to Vercel, add the same env vars in
   Vercel's dashboard, deploy, then point your GoDaddy domain's DNS at
   Vercel.
6. In Flutterwave's dashboard, under Settings → Webhooks, set the
   webhook URL to `<your site>/api/billing/webhook` and a secret hash
   matching `FLUTTERWAVE_WEBHOOK_SECRET_HASH`, and turn on webhook
   retries. Payment Plans are optional — see "How payments work" below.

## Approved for launch vs. still-open decisions

**Approved by the founder:**
- **Market/Customer/Investor Readiness rubric** (`lib/scoring.ts`,
  `SUBSCORE_RUBRICS`) — the measure-level weighting and Investor
  Readiness confidence discount are final for launch.
- **Valuation methodology and constants** (`lib/valuation.ts`) — the
  qualitative/revenue-multiple approach and its base caps/multiple
  ranges are final for launch. Still always shown with the "not a
  formal valuation" disclaimer regardless of approval — that's a
  permanent product decision, not a pending one.
- **Paid 1:1 advisor session pricing, African market** — $30 USD,
  reduced from the original $49 specifically for accessibility in the
  African MSME/early-stage market this product targets. Applied via
  geography-based pricing (`lib/geo.ts`, `isAfricanCountry`,
  13/13 unit tests via `npm run test:geo`): a founder whose profile
  country is in Africa (or hasn't set one yet — see the file for why
  that defaults to Africa, not away from it) gets $30; a founder outside
  Africa falls back to $49, which remains an unapproved placeholder —
  a real decision only if/when this product expands beyond Africa.

**Still open, needs a real decision before launch:**
- **Subscription pricing**: still the placeholder $9/mo, $90/yr. Not
  approved. Now a setting, not code — set `SUBSCRIPTION_MONTHLY_PRICE` /
  `SUBSCRIPTION_ANNUAL_PRICE` in Vercel (see `.env.example`).
- **Non-African advisor session pricing** ($49 placeholder, see above;
  `ADVISOR_SESSION_PRICE_OTHER`).

## How payments work

Built against Flutterwave's v3 "Standard" hosted checkout. Tested against
a simulated Flutterwave (`npm run test:payments`,
`npm run test:flutterwave`) and a real in-process Postgres loaded with
this repo's SQL (`npm run test:db`). **Not yet run against a real
Flutterwave account, test or live** — that is the next step once test
keys exist, and several things below can only be confirmed there.

1. A founder picks a plan on `/dashboard/subscribe` (or "Book a 1:1
   Advisor Session" on their report). The server records what it
   expects to be paid in the `payments` table, asks Flutterwave for a
   hosted payment page, and sends the founder there. Card and
   mobile-money details never touch this app.
2. Flutterwave tells us about the payment by sending the founder's
   browser back to `/api/billing/callback` and by calling
   `/api/billing/webhook` server-to-server. Neither is trusted by
   itself. Each only supplies a transaction ID; the server then asks
   Flutterwave directly whether that transaction succeeded, and checks
   the amount, currency and reference against the `payments` row before
   granting anything (`lib/payments.ts`).
3. Marking the payment paid and granting what it paid for happen as one
   all-or-nothing step inside the database (`fulfil_payment` in
   `supabase/schema.sql`), so a payment can't end up recorded as paid
   with nothing granted, and can't be granted twice.
4. If a payment is still pending when the founder next opens their
   dashboard (mobile money waiting on a PIN, tab closed, webhook never
   arrived), it is looked up with Flutterwave again and completed.
5. A subscription payment sets a paid-through date one calendar month
   or year out. Paying again early adds time on top; nothing already
   paid for is lost. The dashboard shows a "renew" notice in the last 7
   days. When the date passes, the report is locked again until they
   renew — enforced in the database, not just on the page.

### Mobile money needs local-currency prices — a decision to make

Flutterwave decides which payment methods to show from the **currency**
of the charge. Its documentation lists M-Pesa for Kenyan shillings only,
and for a US-dollar charge lists card and US bank account. So with the
default USD prices, **a founder in Kenya will be offered card, not
M-Pesa.** (An earlier note in this codebase assumed a USD price would
"settle in local currency at checkout"; Flutterwave's documentation does
not support that.)

To take mobile money, set a price in that currency in Vercel:

```
SUBSCRIPTION_MONTHLY_PRICE_KES=...
SUBSCRIPTION_ANNUAL_PRICE_KES=...
ADVISOR_SESSION_PRICE_KES=...
```

A founder whose profile country is Kenya is then offered KES first and
USD second on the subscribe page. The same works for ZAR (South Africa),
NGN, GHS, UGX, RWF and TZS. Nothing is converted automatically — the
amounts are yours to choose. Which methods Flutterwave actually shows
for each currency should be confirmed on its test checkout page.

### One-off vs auto-renew

Flutterwave's recurring billing (Payment Plans) is card-only. So by
default every subscription is a one-off payment for one period, renewed
by paying again. If `FLUTTERWAVE_MONTHLY_PLAN_ID` /
`FLUTTERWAVE_ANNUAL_PLAN_ID` are set, the subscribe page also offers a
"renew automatically by card" tick-box (main currency only — create the
plans in that currency and at the same price as the settings).

Automatic renewals are charged by Flutterwave itself and reported only
by webhook. They are matched back to the founder by the payer's email
and Flutterwave customer number, and checked against the price agreed
when auto-renew was switched on. Flutterwave's documentation does not
describe what a renewal webhook looks like, so **treat auto-renew as
untested until a real renewal has been observed in the sandbox.**
A founder stops auto-renew from the cancellation link in Flutterwave's
reminder email; there is no cancel button in this app yet.

### Known gaps

- **Refunds and chargebacks are not handled.** If a payment is refunded
  in Flutterwave, access stays until someone removes it by hand in
  Supabase.
- **A payment that was taken but couldn't be matched** (wrong amount,
  unknown reference) is not applied automatically. It is written to the
  server log with the words `NEEDS ATTENTION` and the founder is told
  to get in touch. Set `NEXT_PUBLIC_SUPPORT_EMAIL` so they know where.
- **Advisor-session price depends on the country in the founder's
  profile**, which they can edit, so someone outside Africa could claim
  the lower price.
- **True simultaneous requests are not tested** — the database tests
  run on a single connection. The design relies on Postgres row locks.

### Giving someone access by hand

For a pilot founder, or yourself for testing: in Supabase, add a
`subscriptions` row for them with status `active` and
`current_period_end` left empty. That never expires, and a later payment
by them won't change that.

### If Flutterwave only issues v4 credentials

If a new account gives you a client ID and client secret rather than a
secret key starting `FLWSECK`, this integration will not work as
written. Everything Flutterwave-specific is in `lib/flutterwave.ts`, so
that is the only file that would change.

### Staying logged in, and the report's time limit

- `middleware.ts` renews a founder's login on every signed-in page and
  sends anyone not logged in to `/login`. Without it a founder who left
  a tab open would be logged out, or hit an error, about an hour in.
- The AI report is limited to 150 seconds (`lib/anthropic.ts`) inside a
  180-second route limit (`app/api/report/route.ts`). If it runs out of
  time or fails, the founder sees a "try again" message and nothing is
  saved. There is one report per score: asking again returns the same
  one rather than generating (and paying for) another.

### Tests

`npm test` runs everything. The payment-related suites:
- `test:payments` — the decision rules (grant or refuse) against a
  simulated store and simulated Flutterwave.
- `test:flutterwave` — what is sent to and read from Flutterwave,
  prices, and the return address.
- `test:db` — loads `supabase/schema.sql` into an in-process Postgres
  and checks the access rules and the payment functions; then does the
  same for the pre-2026-10-08 schema upgraded with the migration files.

## The sophisticated version: valuation, goals, reminders, and tools

Built as agreed (instant data-driven valuation; in-app reminder banner,
not email/push; financial calculators + milestone planner for "tools";
launch date moved to accommodate this rather than cutting scope):

- **Instant Venture Valuation** (`lib/valuation.ts`, unit-tested via
  `npm run test:valuation`) — a directional low-high range computed
  automatically from data already collected: a Berkus-style method for
  pre-revenue ventures, or a revenue-multiple method once a founder
  reports revenue. Shown on the dashboard as an "Estimated Venture
  Value" card, always labeled as directional planning input — never a
  formal appraisal or investment advice. **The dollar constants driving
  this (Berkus factor caps, revenue multiples per tier) are placeholder,
  MSME-scaled assumptions, exactly like the scoring weights — Keep
  Manual, needs advisor/finance sign-off before this number is shown to
  a real founder.**
- **Goal-Progress Tracking** — each BMC block's existing goal now also
  captures a structured target date (`app/assessment` → `BlockStep.tsx`),
  and founders can update a status (Not started / On track / At risk /
  Behind / Done) for each from the dashboard's new Goals & Progress
  section (`components/GoalProgressRow.tsx`,
  `PATCH /api/block-responses/[id]/progress`).
- **Reminders** — a zero-infrastructure banner at the top of the
  dashboard: computed on page load from each goal's target date
  (overdue / due in the next 14 days), no email service or scheduled job
  required. A "fast-follow" upgrade to real email/push notifications was
  explicitly deferred in favor of shipping this now.
- **Founder Tools** (`/tools`) — a Breakeven calculator and a CAC/LTV
  calculator (both pure client-side, no data saved,
  `components/FinancialCalculators.tsx`), plus a Milestone Planner
  (`components/MilestonePlanner.tsx`, new `milestones` table) that lets a
  founder break a goal into concrete steps, tied optionally to a BMC
  block — blocks that are gap-to-target priorities are marked ⚠ so
  founders naturally plan against their weakest areas first.

- **Refined Market/Customer/Investor Readiness rubric**
  (`lib/scoring.ts`) — these three scores (shown as the dashboard's
  Market/Customer/Investor stat cards) previously weighted all six
  measures (clarity, evidence, economics, scalability, defensibility,
  risk) equally within each block. They now weight the measures that
  actually matter for each dimension: Market Readiness leans on
  scalability + clarity, Customer Readiness on evidence + economics,
  and Investor Readiness on economics + risk + defensibility — plus a
  confidence discount (based on the Health Index's evidence-completeness
  rating) so a high self-reported score backed by little real evidence
  reads as less investor-ready, not taken at face value. 15/15 scoring
  tests pass (`npm run test:scoring`), including new tests that verify
  the weighting actually produces the intended effect.
- **Customizable dashboard** — a standard view (Venture Score,
  Market/Customer/Investor Readiness, Health Index, the report/subscribe
  panel, and the Founder Tools link) is always shown to every founder.
  Four additional data points are optional; founders choose which to
  include via `components/DashboardCustomizer.tsx`, saved on
  `profiles.dashboard_widgets` (`PATCH /api/profile/dashboard-widgets`):
  the reminders banner, the valuation card, the full Goals & Progress
  list, and:
  - **Progress Overview** (`components/ProgressOverview.tsx`) — the
    condensed, at-a-glance view: the top 3 recommendations (not the full
    list on /tools — AI ones in the report's own priority order via a
    new `recommendations.priority` column, advisor ones by recency, with
    advisor input always shown first), the 3 nearest incomplete
    milestones, a status bar chart of all goals (not started / on track
    / at risk / behind / done), and a Venture Score trend line across
    the founder's full assessment history (once they've completed more
    than one). Pure server-rendered SVG/CSS, no chart library or client
    JS needed.

- **Recommendations** (`/tools`, third Founder Tool) — a combined,
  read-only list of targets/goals/next-steps from two sources: the AI
  Diagnostic Report's own "Recommended Next Steps" section, auto-parsed
  the moment a report is generated (`lib/recommendations.ts`,
  8/8 unit tests pass via `npm run test:recommendations`), and anything
  a human advisor/coach adds from the `/advisor` queue
  (`components/AdvisorRecommendationForm.tsx`,
  `POST /api/recommendations`, advisor/admin only). Both land in one
  `recommendations` table so a founder sees a single list, each tagged
  AI or Coach, with a one-click "Add to Milestones" that hands it to the
  existing Milestone Planner rather than duplicating tracking. The AI
  report prompt now uses fixed section headings (`## Overall
  Assessment`, `## Gap-to-Target Analysis`, `## Growth Scenarios`,
  `## Recommended Next Steps`) specifically so this extraction is
  reliable — if the model ever omits that heading, extraction just
  yields zero recommendations rather than blocking report delivery.

## Marketing funnel: the 60-Second Readiness Quiz

A new, much shorter public quiz (`/quiz`, `lib/quiz.ts`, 17/17 unit
tests via `npm run test:quiz`) sits one step ahead of the free
Readiness Snapshot, specifically for social media/website traffic:
3 quick scored questions (paying customers, a documented growth plan,
known unit economics), plus a "biggest challenge" and funding-urgency
question used only to personalize the result message — not scored.
Deliberately much coarser than the real scoring engine on purpose (see
the file header for why they're kept separate). Every result ends with
the same primary CTA — the free Snapshot — so the quiz always feeds the
existing funnel rather than creating a separate one; a founder who
scores well also gets a secondary "skip ahead to registration" option.
Leads land in a new `quiz_leads` table (same anyone-can-insert /
staff-can-read RLS pattern as `snapshot_leads`), kept as a separate
table on purpose since it's an earlier, coarser funnel stage. Linked
from the homepage alongside the existing Snapshot CTA.

## Regional pricing: a real risk worth deciding on

The subscription checkout (`app/api/billing/checkout/route.ts`) still
has one flat placeholder price for every founder, regardless of
country. If US/UK/Caribbean pricing ends up different from the
Africa-accessible price (likely, given very different willingness-to-
pay in those markets), that flat price is both an anchoring risk (a
low public price is hard to raise later) and an arbitrage risk (anyone,
anywhere, could sign up at the lower price). `lib/geo.ts`
(`isAfricanCountry`) already solves exactly this for the $30 advisor
session — the moment real US/UK/Caribbean numbers are decided, the same
approach extends cleanly into a proper regional tier lookup for the
subscription checkout too. Not yet built because the actual non-Africa
numbers aren't decided yet — that's a pricing decision, not a code gap.

## Future: cohort/partner accelerator programs (scoped, not yet built)

The founder wants to use this OS to support group/cohort training
accelerators and supplier-development/readiness programs run with
partners (e.g. NCMSDC, SASDC, TIN Ventures UK) — a genuinely separate,
multi-tenant feature area from everything built so far, which is
entirely single-founder-facing. Decided: this is scoped now, in this
document, but deliberately built as the first major post-launch
feature rather than folded into the current push — so it doesn't
further delay Oct or the core consumer product, but nothing built
between now and then should conflict with the design below.

**How a founder joins a cohort**: a partner gets a unique invite
link/code; any founder who registers through it is automatically
tagged to that partner's cohort at signup — no manual per-founder work
by the partner needed for open enrollment.

**What a partner admin sees** (all three requested):
- A cohort-level aggregate dashboard — average Venture Score across the
  cohort, the most common weak blocks/gaps, and completion rates (how
  many invited founders have actually finished an assessment).
- Individual founder detail — drill into any one founder's score,
  report, and progress, similar to what `/advisor` shows today.
- Exportable reports — cohort progress as a spreadsheet/PDF a partner
  can hand to their own funders or board.

**Planned data model** (not yet added to `supabase/schema.sql` — this
is the design, applied when the feature is actually built):
- A `partners` table (id, name, invite_code, contact info) — one row
  per partner organization (NCMSDC, SASDC, etc.).
- A `cohorts` table (id, partner_id, name, invite_code, created_at) —
  a partner can run more than one cohort/program over time (e.g. a 2026
  Spring cohort and a 2026 Fall cohort), each with its own invite link.
- `profiles.cohort_id` (nullable) — set automatically when a founder
  registers through a cohort's invite link; a founder with no
  `cohort_id` is just a regular self-serve subscriber, unaffected by any
  of this.
- A `partner_admin` role (extending the existing `user_role` enum
  alongside `founder`/`advisor`/`admin`) with `profiles.partner_id`
  identifying which partner organization they administer — scoped by
  RLS to only see cohorts and founders under their own `partner_id`,
  the same ownership-scoping pattern used everywhere else in this
  schema (assessments, milestones, recommendations, etc.).
- A new `/partner` section (mirroring `/advisor`'s structure) for the
  aggregate dashboard, founder drill-down, and CSV/PDF export.

This preserves everything already built: a `cohort_id` is purely
additive on `profiles`, and every founder-facing feature (dashboard,
assessment, tools, reports) works identically whether or not a founder
came through a cohort.
