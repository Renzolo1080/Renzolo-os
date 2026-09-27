# RENZOLO OS™ — Phase 1 Launch MVP

Founder BMC Readiness Assessment: registration, the 9-block assessment,
the scoring engine, AI-drafted Diagnostic Report, and subscription billing
via Flutterwave (cards + mobile money across African markets).

## Status (as of this build session)

**Verified working right now, without any external accounts:**
- `lib/scoring.ts` — the full scoring engine (Venture Score, tiers, Market/
  Customer/Investor sub-scores, Health Index, gap detection). Run
  `npm run test:scoring` — 10/10 tests pass.
- The whole project type-checks cleanly (`npx tsc --noEmit`) and the
  Next.js webpack build compiles successfully.

**Written and ready, but needs your API keys to actually run:**
- Auth pages (`app/register`, `app/login`) — Supabase Auth.
- 9-block assessment wizard (`app/assessment`) — saves to Supabase,
  scores automatically on submit.
- Dashboard (`app/dashboard`) — shows Venture Score, sub-scores, Health
  Index; gates the full AI report behind an active subscription.
- AI Diagnostic Report generation (`app/api/report`, `lib/anthropic.ts`) —
  calls Claude; queues for advisor review with a 24–36 hour SLA
  (`ADVISOR_REVIEW_SLA_*` env vars) rather than releasing instantly.
- Flutterwave subscription checkout + webhook (`app/api/billing/*`,
  `lib/flutterwave.ts`) — covers cards and mobile money (M-Pesa, etc.)
  in one integration.
- Supabase schema with row-level security (`supabase/schema.sql`).

**Deliberately deferred past this Launch MVP** (per the agreed scope cut):
free Readiness Snapshot lead-gen funnel, Growth Navigator 3-scenario
plan, Verified Readiness Passport™ PDF export, the advisor-facing review
screen itself (the SLA is wired in, but there's no UI for an advisor to
act on it yet).

## Why this couldn't be fully click-tested inside this session

This build ran inside two network-restricted environments (Anthropic's
cloud workspace, and this Mac's linked sandbox): both block outbound
calls to Supabase, Flutterwave, and Vercel, and this Mac's sandbox is
also too slow to finish a full `next build` or start `next dev` within a
single command's time limit. None of that reflects a problem with the
code — the type-check and webpack compile both passed cleanly. The first
real end-to-end test happens once you run this on hardware with normal
network access (your actual Terminal, not through Claude — or once it's
deployed to Vercel).

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
   Vercel's dashboard, deploy, then point renzoloenterprises.com at it.
6. In Flutterwave's dashboard, create the two Payment Plans (monthly,
   annual) and set their IDs as `FLUTTERWAVE_MONTHLY_PLAN_ID` /
   `FLUTTERWAVE_ANNUAL_PLAN_ID`.

## Known placeholders that need real decisions before launch

- **Pricing** (`app/api/billing/checkout/route.ts`): currently a
  placeholder $9/mo, $90/yr. Not approved — the Phase 1 spec explicitly
  leaves this pending validation.
- **Scoring weights** (`lib/scoring.ts`): documented starting rubric,
  flagged in-code as "Keep Manual" — needs advisor calibration against
  real pilot data.
