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
  `components/ScheduleButton.tsx` drive the two actions.
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
