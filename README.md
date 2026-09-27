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
  disambiguates the two products by `tx_ref`), and the webhook marks the
  session paid. An advisor then coordinates the actual time by email or
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
- Flutterwave subscription + advisor-session checkout and webhook
  (`app/api/billing/*`, `app/api/advisor-session/*`, `lib/flutterwave.ts`)
  — covers cards and mobile money (M-Pesa, etc.) in one integration.
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
2. Run `supabase/schema.sql` in your Supabase project's SQL editor.
3. Copy `.env.example` to `.env.local` and fill in the real keys.
4. In your own Terminal (not through Claude): `npm install && npm run dev`
   — this is the fastest way to actually click through it before
   deploying.
5. Push to GitHub, connect the repo to Vercel, add the same env vars in
   Vercel's dashboard, deploy, then point your GoDaddy domain's DNS at
   Vercel.
6. In Flutterwave's dashboard, create the two subscription Payment Plans
   (monthly, annual) and set their IDs as `FLUTTERWAVE_MONTHLY_PLAN_ID` /
   `FLUTTERWAVE_ANNUAL_PLAN_ID`. The advisor session is one-time, so it
   needs no Payment Plan — just the price below.

## Known placeholders that need real decisions before launch

- **Subscription pricing** (`app/api/billing/checkout/route.ts`):
  currently a placeholder $9/mo, $90/yr. Not approved — the Phase 1 spec
  explicitly leaves this pending validation.
- **Advisor session pricing** (`app/api/advisor-session/checkout/route.ts`,
  `ADVISOR_SESSION_PRICE`): currently a placeholder $49 one-time. Same
  status as the subscription pricing above — not yet approved.
- **Scoring weights** (`lib/scoring.ts`): documented starting rubric,
  flagged in-code as "Keep Manual" — needs advisor calibration against
  real pilot data.
- **Advisor session redirect** (`components/ReportPanel.tsx`): the
  "Book a 1:1 Advisor Session" button currently shows a placeholder
  alert instead of redirecting to Flutterwave's hosted checkout page —
  left as a next step to wire up once a live Flutterwave account and
  redirect URL exist.
- **Market valuation, richer dashboard, reminders/progress tracking**:
  not yet built — see the "What's next" note below.


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
  Three additional data points — the reminders banner, the valuation
  card, and the Goals & Progress list — are optional; founders choose
  which to include via `components/DashboardCustomizer.tsx`, saved on
  `profiles.dashboard_widgets` (`PATCH /api/profile/dashboard-widgets`).

**Still open on "tools"**: the user also flagged a third, unspecified
"something else" tool beyond calculators and the milestone planner —
needs a follow-up conversation to know what to build.
