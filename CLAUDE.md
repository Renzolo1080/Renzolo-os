# RENZOLO Build Brief for Claude

Read this at the start of every session. When anything here conflicts with chat history or older code comments, this file and Lorenzo's latest master documents win.

**Checkpoint (Nov 11, 2026):** Approved Nov 11: $40 assessment (no valuation; members get the full report with valuation), assessment shown beside memberships, regional pricing for the assessment and memberships (two zones: Africa local currency; US/UK/EU higher) with an Elevate monthly option in Africa ($249 × 12) — regional build goes to a preview for approval first. documents_and_partners migration applied live (server-only writes). PRs 19, 24, 25 merged.

**Earlier checkpoint (Nov 9, 2026):** launch on **November 16, 2026**. In review (PR "Hubflo enhancements"): member reminders, next-steps progress, free loan readiness check, plan templates, AI document intake, partner portal and impact report (migration `2026-11-10_documents_and_partners.sql` not applied yet). The Founder Trajectory™ book starts in January 2027, after launch. Live on master: $60 assessment, Nov 1 membership and coaching prices, local prices for Kenya, Nigeria, South Africa and Ghana in Vercel, local-currency estimate at checkout, privacy launch (consent, Your data page, PAIA manual), refund policy, Google Workspace email and email settings in Vercel. Open blockers: Flutterwave account and keys, Resend (`RESEND_API_KEY`), `EMAIL_POSTAL_ADDRESS`, `COACHING_BOOKING_URL`, `CRON_SECRET`, `EMAIL_LINK_SECRET`, end-to-end test purchases. In review: Readiness Snapshot landing page, Snapshot qualifier questions.

## How to use this file

1. Start each session with one of the session prompts at the end.
2. Work on a branch and open a pull request. Lorenzo approves before anything is merged.
3. At the end of each session, update the Checkpoint line with what shipped and what's next.

## Company and naming rules

RENZOLO™ is a venture development and capital infrastructure platform, not a consulting or training business. It helps early- and growth-stage businesses become customer, capital and investor ready, then connects them to the buyers and funders who can say yes.

- **Owner:** Renzolo Enterprises LLC (Wisconsin). Founder and CEO: Lorenzo Bell Jr.
- **Positioning:** a global venture development and capital infrastructure firm. **Launch markets (Nov 16, 2026):** Africa (South Africa and Kenya first), the United States and the United Kingdom. The Caribbean and EU follow later.
- **Africa strategy:** value and volume. Drive free Snapshots, assessments and memberships that funnel into cohorts and coaching.
- **Revenue:** from founders and program funders, not U.S. corporate supplier-diversity budgets.
- **Positioning:** the step after the accelerator. Accelerators teach; RENZOLO gets businesses ready and in front of customers and investors.

**Approved names only:** RENZOLO™, RENZOLO Ventures™, RENZOLO Studio™, RENZOLO Network™, RENZOLO Capital™, RENZOLO OS™, Founder Trajectory™, Founder Trajectory™ Academy.

- Do not use: Renzcelerator, Founder Velocity, Founder Pathways, Capital Alignment Engine, Venture Score, Founder OS.
- Do not invent new public product names; describe new features plainly until Lorenzo clears a name.
- Use only logos and brand assets Lorenzo has approved. No competitor names in public copy. Only claim what is live. No AI-generated people as testimonials. Do not name past employers or partner organisations in public copy without Lorenzo's approval.

## Sources of truth (newest wins)

- RENZOLO Venture Strategic Plan, latest "Enhanced" revision
- Master slide deck and website mockups (Option B v3 is the current website direction)
- Founder Trajectory™ Academy — Community & Cohort Feature Spec: https://claude.ai/code/artifact/1407112a-b4a9-4e6e-b0c7-92efabdaec7c
- Founder Trajectory™ Strategy Frameworks Update: https://claude.ai/artifact/84T5fpsEP1FBvCWXxAMMbF
- RENZOLO Strategy & Strategy Brief Spec: https://claude.ai/artifact/ARQerEjzuBmy7oMdJ1kuGN
- RENZOLO Go-Live Checklist (spreadsheet)

## Tech stack

| Area | Tool or setting |
| --- | --- |
| Code | GitHub `Renzolo1080/Renzolo-os` (Next.js; app at the root, website in `website/`) |
| Hosting | Vercel: `renzolo-os` (app, live at renzolo-os.vercel.app) and `renzolo-os-6wyn` (website) |
| App address | app.renzoloenterprises.com (GoDaddy CNAME "app" to Vercel) — not connected yet |
| Domains | renzoloenterprises.com (primary), renzoloenterprises.net |
| Database and auth | Supabase, RENZOLO OS project (Pro plan, leaked-password protection on) |
| Payments | Flutterwave (cards and mobile money). Test keys in Preview only; live keys in Production only. Every payment verified by ID; webhook checked with the secret hash |
| Prices | All in `lib/pricing.ts`, overridable by Vercel settings. Local prices (KES, NGN, ZAR, GHS) are Vercel settings |
| AI coaching | Anthropic API (Lorenzo · AI text) and Tavus (video) |
| Email | Google Workspace: lorenzo@ with aliases hello@, support@, privacy@, coach@ (renzoloenterprises.com). App email via Resend from no-reply@ |
| Held | Next.js 16 upgrade branch until after launch |

## Product rules

Founder Trajectory™ is powered by RENZOLO OS™: a founder takes the free Snapshot, buys the assessment or a membership, builds a plan, works with AI and human coaching, then reassesses and grows. Never change prices or these rules without Lorenzo's written approval.

**Method and scores**

- Coaching cycle: Evaluate, Evolve, Execute, Elevate (Expand sits inside Elevate).
- Journey stages: Discover, Validate, Build, Acquire, Prepare, Fund, Scale, Exit.
- One Total Readiness Score from five components: Strategic, Growth, Customer, Capital (credit, loans, grants) and Investment (equity, partners).
- Plan length: 90 days to 36 months, chosen by the founder.

**Pricing (USD, one price in every region; live since Nov 1, 2026)**

| Product | Price | Notes |
| --- | --- | --- |
| Readiness Snapshot | Free | 5 minutes or less; carries into the account on signup |
| Readiness Assessment | $40 one-time (Nov 11, 2026) | Readiness report, scores, AI market insight, tier recommendation, Plan Builder. No valuation. Included in every membership. Regional prices approved (Africa ~$40 in local currency; US $79, UK £59, EU €69) but not built yet |
| Essentials (early stage) | $60/quarter · $200/year | Full report with valuation range and AI market insight (Nov 11, 2026). 1 × 30-min basic coaching session a quarter. No monthly option |
| Growth | $147/quarter · $490/year | 2 × 30-min sessions a quarter, AI coach, plan review, Market Intelligence, advisor review |
| Elevate | $699/quarter · $2,490/year | 1 × 60-min session a month, pitch review, priority support, matching (readiness requirements apply). Capped at 50 + waitlist |
| Extra coaching (60 min) | Non-member $150 / $399 for 3 · Essentials $75 / $199 · Growth $105 / $279 · Elevate $120 / $319 | First non-member session includes intake |
| Build cohort | $449 | 12 weeks, matching membership included, instalments |
| Scale cohort | $1,950 | Hidden at launch; revisit in December |
| Launch cohort | To confirm | 8 weeks, self-paced, AI coaching + one 30-min 1:1 |

Members who joined before Nov 1 keep their price (there were none at the change).

**Coaching and matching**

- No refunds on unused sessions; reschedule within 60 days instead. Sessions expire 60 days after purchase.
- Progress guarantee: if a founder misses their goal, reassess and add coaching time. Word it plainly and match the fine print.
- Matching is provided only to founders who meet the readiness requirements (score thresholds, documents, coach sign-off) and who acknowledge the matching statement at purchase.
- Clients belong to RENZOLO, not to individual coaches.
- No discounts at launch.

## Workstreams

Launch-critical work comes first; everything marked "after launch" waits until November 16, 2026 has passed.

**1. RENZOLO OS™ (launch-critical)**

- [x] Assessment $60; local-currency estimate at checkout; local prices for KE, NG, ZA, GH
- [x] New membership and coaching prices (Nov 1)
- [x] Privacy launch; refund policy; leaked-password protection
- [x] Email addresses in Vercel (`EMAIL_FROM`, `EMAIL_REPLY_TO`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `COACH_EMAIL`, `PRIVACY_EMAIL`)
- [ ] `RESEND_API_KEY` (Lorenzo adds), `EMAIL_POSTAL_ADDRESS`, `COACHING_BOOKING_URL`, `CRON_SECRET`, `EMAIL_LINK_SECRET`
- [ ] Flutterwave live keys (Production only), webhook, three test purchases
- [ ] Connect app.renzoloenterprises.com (Vercel domain, GoDaddy CNAME, `NEXT_PUBLIC_APP_URL`, Supabase Site URL and redirects)
- [ ] Tavus keys (`TAVUS_API_KEY`, `TAVUS_PAL_ID`, `TAVUS_FACE_ID`) if Lorenzo · AI video is live at launch
- [ ] In review: Snapshot qualifier questions (revenue band, urgency) and routing
- [ ] Launch builds on approval: matching waitlist with readiness requirements, Readiness Room registration, launch-week report-review cap (20), renewal reminders
- [ ] After launch: Strategy Brief screen between the assessment and the Plan Builder (see Strategy & Strategy Brief Spec): optional for Essentials (pre-filled), required for Growth and Elevate before matching
- [ ] After launch: founder profile and challenge brief export — a short business overview with key metrics plus one key challenge, generated from assessment data, for founders applying to clinics, accelerators, buyers and funders (own format; do not copy any outside template or name its source)
- [ ] After launch: financial indicators and report builder on the dashboard; Funder Impact Report; one-page Founder Trajectory™ visual
- [ ] Paused until procurement rules settle: South Africa procurement and B-BBEE evidence checklist
- [ ] In review (Hubflo benchmark, Nov 9): reminder emails on day 0, 3 and 5 for unfinished steps; "Step X of Y" next-steps card; public `/free-tools` loan readiness check; plan templates by goal; AI document intake at `/assessment/documents` (keeps figures only, never files); partner portal (`/partner`, `/partner/join`, `/partner/report/[id]`)
- [ ] After launch: outcome tracking (contracts won, capital raised, jobs) for founders and the partner impact report; staff screen to set up partners and cohorts (SQL for now)

**2. Founder Trajectory™ book (January 2027, after launch)**

- [ ] Writing starts after the November 16 launch; plan and timeline in the Founder Trajectory™ Book Plan and the Ad, Landing Page and Spin-off Plan
- [ ] Book page at `/book` (not `/founder-trajectory`); book and social posts in Lorenzo's own voice, website and app in the firm's voice
- [ ] Book checkout on the RENZOLO site and email-gated chapter worksheets, before the book launch

**3. Founder Trajectory™ Academy (after launch, before the Q1 2027 pilot)**

- [ ] Community and cohorts inside RENZOLO OS™ per the Feature Spec (no outside platform)
- [ ] Strategy Toolkit worksheets in the Plan Builder, linked to readiness scores
- [ ] Strategy vs Plan module in weeks 1–2 of Launch and Build cohorts
- [ ] Train Lorenzo · AI on the lesson cards
- [ ] Cohorts: Launch (8 weeks), Build (12 weeks), Scale (6 months); recruit in December for Q1 2027

**4. Website (launch-critical)**

- [ ] Option B v3 visual refresh: one call to action ("Start the free Snapshot"), clean layouts, approved palette, motion used sparingly. Functionality unchanged
- [ ] In review: Readiness Snapshot landing page
- [ ] Host the site on renzoloenterprises.com

## Working rules for Claude

1. Work on a new branch and open a pull request; never push straight to `master` without Lorenzo's approval.
2. Never commit keys or secrets; they live only in Vercel and Supabase settings. Never ask Lorenzo to paste them into chat.
3. Ask before changing prices, product names, live payments, live database migrations, or deleting anything.
4. Keep RENZOLO OS™ the hero product in all copy and comparisons.
5. Write plain, business-owner-friendly copy for founders and CEOs of early- and growth-stage businesses, in the firm's voice.
6. Test each change (tests, build, and a look at the page) before saying it's done.
7. End every session by updating the Checkpoint line and listing next steps.

**Session prompts**

- *RENZOLO OS:* "Read CLAUDE.md. Work on the next unchecked RENZOLO OS™ task. Show me the plan first, then build it on a branch and open a PR."
- *Founder Trajectory:* "Read CLAUDE.md and the Strategy Frameworks Update. Draft the Strategy Toolkit worksheets for the Launch cohort as Plan Builder forms. Don't change pricing."
- *Website:* "Read CLAUDE.md. Continue the Option B v3 website refresh. Keep functionality unchanged, use only approved brand assets, and show me screenshots before merging."
- *Update:* "Here's a change Lorenzo approved: [describe]. Update CLAUDE.md and every place in the code and site it affects."
