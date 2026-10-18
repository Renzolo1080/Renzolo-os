RENZOLO™ helps early- and growth-stage founders across Africa get **customer, capital and investor ready**. This system gives the website a vibrant, inviting, modern feel — warm colour, bold type, playful motion — while keeping the credibility of a capital-infrastructure platform. Build every page of renzoloenterprises.com and app.renzoloenterprises.com from these tokens.

## Mood board: what we borrow, and from where

These sites set the bar for colour, flow and visual action. Borrow the *pattern*, never their assets, copy or exact colours.

| Reference | Borrow this | Where it shows up here |
| --- | --- | --- |
| stripe.com | Polished motion on scroll; product UI shown floating in the hero | Hero dashboard screenshot on `shadow-soft`, gentle fade-up reveals |
| monday.com | A confident multicolour palette used as *meaning*, not decoration | `brand`, `gold`, `teal` each own one job (action, highlight, growth) |
| pitch.com | Big bold display type and colour-block sections | `display-xl` hero, full-bleed `surface-tint` and `night` bands |
| mailchimp.com | A warm, human voice and one strong signature colour | Sunrise Orange (`brand`) everywhere a founder should act |
| notion.com / headspace.com | Friendly, uncluttered layouts with generous space | `space-24` section rhythm, one idea per section |
| Leading business-method brands | A named method shown as a simple visual model | The four-stage Founder Trajectory™ strip (StageChip) |

## Content fundamentals

- Speak to the founder as "you"; RENZOLO speaks as "we". Warm, direct, confident — a coach who has done this, not a consultant selling hours.
- Lead with outcomes: win more customers, access credit and capital, attract investment and partners. Example headline: "Get ready for customers, capital and investors."
- Sentence case for headlines and buttons ("Start your assessment"), uppercase only in `eyebrow` labels.
- Use only the established names, with ™ on first use per page: RENZOLO™, RENZOLO OS™, Founder Trajectory™, Founder Trajectory™ Academy, RENZOLO Ventures™, RENZOLO Studio™, RENZOLO Network™, RENZOLO Capital™. Never invent new product names in copy.
- The method is always written in order with full stops: "Evaluate. Evolve. Execute. Elevate."
- RENZOLO OS™ is the hero product on every page; every page ends with one call to action into the Founder Trajectory™ app.
- No emoji. Numbers are concrete ("$79 one-time", "90 days to 36 months"), never vague ("affordable").

## Visual foundations

**Colour.** Ground every page in `surface` with `ink` text. Give each identity colour one job: `brand` for the single most important action and the active stage; `gold` for highlights, badges and celebration; `teal` for progress, completion and growth. Put `on-brand`, `on-gold` or `on-teal` text on those fills — never white on `brand` (it fails contrast). When orange must be text, use `brand-text`; links use `teal-text`. Alternate long pages between `surface` and `surface-tint` bands, and use one `night` band per page for the RENZOLO OS™ showcase. Limit any one screen to two identity colours plus ink.

**Type.** Set headlines in the display family (Bricolage Grotesque) with `display-xl`, `display-lg` or `heading`; everything else in DM Sans (`title`, `body-lg`, `body`, `eyebrow`, `caption`). Load both from Google Fonts: Bricolage Grotesque weights 600–800, DM Sans 400, 500, 600, 700. Put an `eyebrow` in `brand-text` above every section headline. Keep line length under 68 characters.

**Space and layout.** Max content width 1200px; gutters `space-4` on mobile, `space-8` on desktop. Section padding `space-16` mobile, `space-24` desktop. Cards pad `space-6` (mobile) to `space-8` (desktop). Every layout must work at 375px wide with no horizontal scroll.

**Shape.** Buttons, chips and badges are pills (`radius-pill`). Cards use `radius-md`; hero panels, pricing cards and big colour blocks use `radius-lg`. Cards get a 1px `line` outline; only the three home-page outcome cards add `shadow-pop`.

**Shadows.** Reserve the offset `shadow-pop` (a hard ink shadow, no blur) for buttons and for the three outcome FeatureCards on the home page; nothing else gets it. On hover it rises to `shadow-pop-hover` with `translateY(-2px)`; pressed drops to `translateY(2px)` with no shadow. Floating screenshots and menus use `shadow-soft`. Nothing else casts a shadow.

**Motion ("visual actions").** Fast and springy, never slow. Hover lift 150ms ease-out. Section content fades up 16px over 400ms as it enters the viewport, staggered 60ms per item. Progress bars and stage indicators fill left-to-right over 600ms. Numbers in stats count up once. Wrap all of it in `@media (prefers-reduced-motion: no-preference)`; with reduced motion, show the end state.

**Focus and states.** Every interactive element shows a solid 3px `focus` ring at 2px offset on `:focus-visible`. Disabled controls drop to 45% opacity and lose their shadow. Errors are written in words, not colour alone.

## Premium mode

Vibrant draws founders in; premium earns the trust of lenders, investors and partners. Every page balances the two with these rules.

- **The 70 / 20 / 10 rule.** About 70% of any page is calm (`surface`, `surface-raised`, `ink` text, generous space), 20% is deep (`night` bands), and only 10% is loud (`brand`, `gold`, `teal` fills). If a screen feels busy, remove colour before adding anything.
- **One loud moment per screen.** A viewport holds at most one `brand` fill area plus one accent. Never put `brand`, `gold` and `teal` blocks side by side outside the hero motif and the three outcome cards.
- **Premium sections.** Render the RENZOLO OS™ showcase, pricing, the Academy and any partner, lender or investor page in premium mode: `night` or `surface` ground, no `shadow-pop`, cards with a 1px `line` outline only, colour limited to a single `brand-text` eyebrow and the primary button, and wider spacing (`space-24` sections, `space-12` between headline and content on every screen size).
- **Quieter motion in premium sections.** Fade only (no lift), 600ms ease-out, no stagger, no count-up numbers. Playful hover lift stays on buttons.
- **Type does the talking.** Premium headlines use `display-lg` at weight 700 with tighter copy (eight words or fewer); body copy stays `body-lg` with line length under 60 characters.
- **No decoration for its own sake.** No floating shapes, badges or icons in premium sections; real product screenshots and real photography carry the visual weight.

**Speed targets (premium is fast).** Many visitors are on mid-range Android phones and costly mobile data. Every marketing page must meet: under 1.5 MB total on first load, Largest Contentful Paint under 2.5s on a mid-range phone over 4G, Lighthouse performance 90+ on mobile. To hit them: load only the font weights listed under Type with `font-display: swap`; serve images as AVIF or WebP with `srcset` (max 1600px wide, hero under 200 KB, others under 120 KB) and lazy-load everything below the first screen; animate only `transform` and `opacity`; no video autoplay on mobile; no animation libraries heavier than 20 KB.

## Imagery

Images do most of the "high-end" work. Use them in this order of preference.

1. **Real product screenshots** of RENZOLO OS™ (dashboard, assessment results, plan, reports), framed with `radius-lg` and `shadow-soft`. These are always real, never mocked up with invented numbers presented as a client's.
2. **Real photography** of real founders, sessions and cohorts, with written permission from everyone shown.
3. **AI-generated images**, allowed for atmosphere and concepts, under the rules below.

**AI-generated image rules.**
- Use AI images for scenes and moods: a founder working at a laptop in a Nairobi or Johannesburg co-working space, a market stall owner reviewing a phone, a small team planning at a whiteboard, city skylines, textures and abstract light.
- Never use an AI-generated person as a named client, testimonial, coach, team member, partner or "success story", and never pair an AI image with a quote, name, result or logo. Proof sections use real people only.
- Keep a consistent art direction across every image: warm natural light, golden-hour tones that echo `brand` and `gold`, shallow depth of field, modern but realistic African settings (not safari, poverty or stock-cliché imagery), people shown as capable professionals in action, not posing.
- Reject any image with tell-tale artefacts: warped hands or text, plastic skin, impossible objects, garbled signage. Crop or regenerate rather than ship them.
- Grade every image to the palette (slightly warm, deep shadows near `night`), compress to the speed targets above, and write real alt text describing the scene.
- Check the image tool's licence allows commercial use, and replace AI images with real photography as it becomes available, starting with the hero.

**Prompt template** (adapt per scene): "Editorial photograph, [subject and action], in a modern [city] [setting], warm golden-hour natural light, shallow depth of field, confident and focused mood, realistic skin and hands, muted background with warm orange and gold accents, 35mm lens, no text, no logos."

## Storytelling

The home page tells one story, with the founder as the hero and RENZOLO™ as the guide. Every section moves the visitor one step along it.

1. **The ambition** (hero): what the founder wants: customers, capital, investors.
2. **The gap**: why it's hard: unclear readiness, scattered plans, lenders and buyers who say "not yet". Name the frustration in the founder's words, then turn it: "You don't need more advice. You need to know exactly where you stand."
3. **The guide**: why trust RENZOLO: Lorenzo's 20+ years developing suppliers across Africa, the UK, EU and US, and the EY Africa Enterprise Impact Program he founded and led (800+ entrepreneurs trained, 19 African countries, $880K invested). Real photo, short first-person story, no stock imagery.
4. **The plan**: Evaluate. Evolve. Execute. Elevate. Simple enough to repeat after one read.
5. **The tool**: RENZOLO OS™ is how the plan gets done, shown in real screenshots.
6. **The proof**: real founders, real results (Testimonials).
7. **The choice**: pricing that starts small ($79 assessment), then one clear call to action.

Write each section's headline so the headlines alone, read top to bottom, tell the whole story.

## Why RENZOLO

**The positioning line:** "Other tools help you run your business. RENZOLO gets you ready for customers, capital and investors, and connects you to them."

Never name, link to or picture a competitor anywhere on the site, in ads or in sales material. Make the contrast with categories ("generic business tools", "one-size-fits-all accelerators", "advice that stops at a report") and let RENZOLO's own proof do the rest.

**The five reasons, each with its proof.** Every claim on the site must carry the proof beside it.

| Reason | What we say | The proof we show |
| --- | --- | --- |
| Experience | "Built by someone who has done this across Africa for 20 years." | Lorenzo's 20+ years developing suppliers across Africa, the UK, EU and US; the EY Africa Enterprise Impact Program he founded and led: 800+ entrepreneurs trained, 19 African countries, $880K invested. |
| Capability | "A platform and a coach, working together." | RENZOLO OS™ in real screenshots (assessment, plan, dashboard, reports), plus human coaching; later, Certified Founder Trajectory™ Coaches. |
| Value | "Know exactly where you stand for $79." | The standalone assessment with AI market insight; membership from $15 a month; what each tier includes, in plain numbers. |
| Solution | "One path from where you are to customer, capital and investor ready." | The method (Evaluate. Evolve. Execute. Elevate.), the plan length the founder chooses (90 days to 36 months), and the dashboard that tracks it. |
| Differentiator | "Readiness that leads somewhere." | The RENZOLO Readiness Score, curated introductions to buyers, lenders and investors, and published results. |

**What makes RENZOLO different.** Lead with these, in this order:
1. **One score that means something.** The RENZOLO Readiness Score shows a founder, in one number per outcome (customers, capital, investors), how ready they are and what moves it. Show the score on the dashboard, in reports and in every progress update.
2. **Readiness that leads somewhere.** Readiness ends in curated introductions to buyers, lenders, grant programs and investors through RENZOLO Network™ and RENZOLO Capital™, not in a report.
3. **Built for Africa, not adapted to it.** Mobile-first, low-data pages, card and M-Pesa payments, WhatsApp support, prices in USD.
4. **Human and AI together.** AI insight on every plan, with a real coach when it matters.
5. **Results in public.** RENZOLO publishes its outcomes, good or bad.

**The progress guarantee.** RENZOLO backs its method with more support, not refunds: if an active member who completes their plan's actions and check-ins does not reach their agreed Readiness Score target within 90 days, RENZOLO gives them more time, with extra coaching at no cost (for example an additional one-on-one session and another 90 days of AI coaching) until they get there.
- **Every missed target starts with a "why" assessment.** Before extra coaching begins, the founder takes a short re-assessment (under 10 minutes, using the same upload, voice and tap inputs) followed by a review with their coach. Together they find the cause, choosing from a fixed set so results can be compared: target set too high, plan actions not completed, missing or out-of-date evidence, a skills or resource gap, a market or external shock, or a method gap on RENZOLO's side. The review ends with a revised plan and target, and the extra coaching is aimed at that cause.
- RENZOLO owns its share: when the cause is a method gap, it is logged, fixed in the product or method, and reported in the quarterly outcomes.
- Say it plainly: "Hit your target or we find out why and keep coaching you, free." Show it on pricing, in the Why RENZOLO section and at checkout.
- Link the full terms beside every mention: who qualifies, how the target is set at assessment, what "completing the plan" means, and exactly what extra support is given.
- Have the terms reviewed by a lawyer in each launch market before they go live; until then, the guarantee does not appear on the site.
- Track guarantee claims as an outcome; a low claim rate is proof in itself.

**Only claim what is live.** Partner fast-tracks for high-scoring founders appear only once a partner has signed; the progress guarantee appears only once its terms are published. Until then, describe introductions as "curated by the RENZOLO team".

## The live Readiness Score

This is RENZOLO's core disruption: **readiness measured in minutes and tracked live, like a stock price.** Most readiness programs take weeks of forms and return a static report; RENZOLO asks for minutes of input and never stops measuring.

**Minutes of input, not weeks.** The founder chooses one way in, or mixes them:
1. **Upload what you already have.** Bank and mobile-money statements, invoices, a business plan, a pitch deck, photos of records. AI reads them and pre-fills the assessment.
2. **Talk for five minutes.** A voice note in the app or on WhatsApp, in the founder's own language where supported; AI turns it into answers.
3. **Tap through what's left.** Only the questions the uploads and voice note couldn't answer, never more than twelve.

Targets the product is held to, and publishes: **first score in under 10 minutes**, **total founder input under 15 minutes**, **full AI report in under an hour**, with the human-reviewed report following within the 24–36-hour advisor turnaround.

**Results that never stop.** The score recalculates whenever new evidence arrives: a new statement, a logged sale, a finished plan task, a coaching check-in, a document uploaded. Founders choose how they hear about it:

| Cadence | What arrives | Where |
| --- | --- | --- |
| Live | The score ticks as evidence arrives | In the app |
| Hourly | A digest, only in hours where something changed | In the app |
| Daily close | Closing score, change, the day's movers | WhatsApp or in the app |
| Weekly report | Trend, movers, next three actions | Email and the app |
| Monthly statement | Full readiness statement with sub-scores and benchmarks, shareable as a PDF | Email and the app |

**Speak the language of markets.** Founders read their readiness the way investors read a stock:
- **Score and change:** "72.4, +1.8 ▲ today (+2.5%)", in `ticker` and `data` styles; up in `tick-up`, down in `tick-down`, always with a sign and an arrow, never colour alone.
- **Sub-scores:** Customers, Capital and Investors each have their own live number.
- **Ranges:** 1H, 1D, 1W, 1M, 1Y views on one sparkline.
- **Movers:** the top three things that moved the score today, each with its point value ("+1.2 September bank statement added").
- **Sector index:** the anonymous average for founders in the same country, sector and stage, so a founder sees whether they are beating their market.
- **Alerts:** when a sub-score crosses into a new band ("You're now capital-ready"), the founder is told immediately.

**Rules that keep it trustworthy.**
- Every movement shows its cause; the score never changes without a logged reason.
- No fake volatility: if nothing changed, the score holds and no hourly digest is sent.
- Data is connected only with the founder's explicit consent and can be disconnected at any time; handle it in line with South Africa's POPIA and Kenya's Data Protection Act.
- It is a readiness score, never described as a credit score or a lending decision.
- Use "Readiness Score" as a descriptive feature name inside RENZOLO OS™; any branded name for it needs trademark clearance first.

**Example daily close (WhatsApp):** "RENZOLO daily close: Readiness 72.4 (+1.8 ▲). Capital +2.4 after your September statement. Next best action: update your cash-flow forecast (+1.5 est.)."

## Futuristic layer

RENZOLO looks like the future of founder finance: warm, calm and alive, never cold neon. Apply this layer to the website's hero and `night` bands, and to RENZOLO OS™ everywhere.

- **Dark where it's deep.** Render every `night` band with `data-theme="dark"` so all tokens flip to the dark theme inside it. RENZOLO OS™ opens in the dark theme by default, with a light-theme toggle; the website stays light by default.
- **Glass panels.** On dark grounds only: `glass` fill, `backdrop-filter: blur(16px)`, 1px `glass-edge`, `radius-lg`. Where blur is unsupported, or under `prefers-reduced-transparency`, fall back to `surface-raised`.
- **One glow per screen.** `glow-brand` on the single most important element: the live score card, or the primary button on a dark band.
- **Ambient light.** Behind the hero and on `night` bands, one or two slow-drifting radial glows in `brand` and `gold` at 8–12% opacity, a 20-second loop animating `transform` only, paused when off screen, static under reduced motion.
- **Dot grid.** A faint dot grid in `glass-edge` at a `space-6` pitch on dark bands, suggesting precision.
- **Data typography.** Every live number uses the mono family (`ticker`, `data`) with tabular numerals; when a number changes, its digits roll to the new value over 300ms.
- **Live signals.** A small pulsing `teal` dot with the word "Live", and a relative timestamp ("Updated 2 min ago") on every live figure.
- **AI presence (OS).** The AI coach appears as a small breathing orb (a radial blend of `brand` into `gold`, 4-second breath); while thinking it pulses faster, and its answers stream in word by word.
- **Visual AI agents: clones of real coaches (OS).** RENZOLO's AI agents appear as visual clones of Lorenzo and of approved staff, coaches and trainers: talking video agents that look, sound and coach like the real person, so founders get a face-to-face guide at any hour.
  - **Consent first.** A clone exists only with the person's signed written consent covering their likeness, voice and approved topics. They review the clone before launch and can pause or withdraw it at any time; withdrawal removes the clone from the product within 24 hours. Treat face and voice recordings as sensitive personal data under POPIA and Kenya's Data Protection Act.
  - **Always labelled as AI.** The clone is named "[Name] · AI" (for example "Lorenzo · AI") with a visible AI badge on the video panel and portrait, in every message and at the start of every voice or video reply. It never claims to be the real person and never implies a live human is present.
  - **Clear limits.** Clones coach, explain, review progress and suggest next actions. They never set prices, grant guarantees, give financial or legal advice, promise introductions or speak for the person on new topics; those hand off to the real human, with a "Talk to the real [Name]" button always one tap away.
  - **Look.** The clone speaks in a video panel (`radius-lg`, `glass` frame on dark grounds) with a live, lip-synced face and the person's own voice; the breathing orb (a radial blend of `brand` into `gold`) rings the panel and glows while the clone speaks or thinks. Captions always run under the video. When idle or minimised, the clone shrinks to a circular portrait with the orb as its ring.
  - **Built for African data.** Video starts only when the founder taps play or joins a session, never automatically. Each founder picks a mode: video, voice with a still portrait, or text. The app suggests voice or text on slow or costly connections, and every video reply also exists as text.
  - **Quality bar.** Launch a clone only once it passes the person's own review for likeness, voice and tone; retire any clone that looks or sounds off rather than ship an uncanny one.
  - **Human-reviewed.** Coaches review a sample of their clone's conversations every week, and any founder can flag a reply for human review.
- **Command bar (OS).** A search-and-command bar (Cmd/Ctrl+K on desktop, a search pill on phones) that answers plain requests: "show my capital score", "what moved today", "book a coaching call".
- **Charts.** Sparklines and area charts draw left to right over 600ms; rising segments in `tick-up`, falling in `tick-down`.
- **Guardrails.** All futuristic effects together add no more than 10 KB of CSS and JS; no WebGL, 3D scenes or video backgrounds; no blue-purple neon; Premium mode and the speed targets still apply, and every effect has a static fallback.

## Measurable outcomes

Results are the strongest differentiator, so the platform collects them from a founder's first day.

| Outcome | How it's measured | When |
| --- | --- | --- |
| Time to first score | Minutes from signup to first Readiness Score (target under 10) | Every assessment |
| Founder input time | Minutes of founder effort to complete the assessment (target under 15) | Every assessment |
| Readiness Score lift | Score at assessment, then continuously; reported every 90 days, per outcome | Live, reported every 90 days |
| Time to ready | Days from first assessment to reaching the "ready" band for the founder's chosen outcome | On reaching it |
| Applications made | Loans, grants, tenders and investor pitches submitted | Logged by the founder, confirmed at check-ins |
| Capital secured | Loans, grants and investment won, by count and USD value | Logged with founder confirmation |
| Customers won | New contracts and corporate buyers, by count and value | Logged with founder confirmation |
| Revenue growth | Revenue at start versus every 90 days | Every 90 days, self-reported |
| Founder satisfaction | One-question rating after each coaching session and each quarter | Ongoing |
| Guarantee claims | Share of eligible members who missed their 90-day target and received extra coaching, and how many then reached it | Every 90 days |
| Missed-target causes | Count of each cause found in "why" assessments, and the method gaps fixed as a result | Every 90 days |

**How results appear on the site.**
- A **Results** strip in the guide section and on an **Outcomes** page: three to five headline numbers set in `display-lg` with `caption` labels, counting up once (vibrant sections) or static (premium sections).
- Every number shows its sample size and an "as of" date ("Average score lift of 18 points across 214 founders, as of March 2027"). Never round up, never show a number without its base.
- Until RENZOLO has its own results, show Lorenzo's EY program results labelled as his track record, not as RENZOLO outcomes.
- Founders choose whether their individual results may be shown; aggregate numbers never identify anyone.

## Functionality

- **Free Readiness Snapshot on the home page.** A three-question taster inline (tap-to-answer pills, a `teal` progress bar), then "See your full snapshot" hands off to app.renzoloenterprises.com with the answers carried over. This is the highest-converting element on the page; place it directly after the plan.
- **Pricing toggle** for monthly, quarterly and annual billing, with prices in USD and the saving shown on longer terms. Every tier card links straight to checkout or signup, never to a contact form.
- **Book a coaching call** opens the booking calendar in a modal or new tab; no back-and-forth emails.
- **WhatsApp button** (floating, bottom-right on mobile, `teal` fill, `on-teal` icon) for questions, since most founders in South Africa and Kenya prefer it to email.
- **FAQ accordion** before the final call to action, covering payment (cards and M-Pesa via Flutterwave), refunds, what's in each tier and how coaching works.
- **Short forms.** Signup asks for name, email, country and business stage only; everything else is collected in the app.
- **Sticky mobile call to action.** On phones, after the hero scrolls away, a slim bar with "Start your assessment" stays pinned to the bottom.
- **Track what matters.** Fire analytics events for: Snapshot started, Snapshot completed, pricing viewed, checkout started, call booked, WhatsApp tapped.

## Transitions and visual actions

All motion follows the rules under Motion and Premium mode, and switches off under `prefers-reduced-motion`.

- **Hero entrance** (once, on load): headline, subcopy and buttons fade up 16px in sequence, 80ms apart; then the three colour blocks rise into place left-to-right; then the dashboard screenshot floats in. Done within 1.2s.
- **Trajectory line**: a thin `brand` line draws itself through the method section as the visitor scrolls, lighting each StageChip as it passes (scroll-linked, `stroke-dashoffset`).
- **Product scroll story** (RENZOLO OS™ showcase, desktop): the screenshot stays pinned on one side while module descriptions scroll past on the other; the screenshot crossfades (300ms) to match each module. On phones it becomes a swipeable carousel with dots.
- **Page transitions**: a 200ms crossfade between pages using the browser's View Transitions API where supported; no transition otherwise.
- **Micro-interactions**: buttons lift and press (see Button); Snapshot answers pop in with a 150ms scale from 0.96; the progress bar fills smoothly; numbers in the guide section count up once.
- **Never**: parallax backgrounds, scroll-jacking, auto-playing sound, or motion that blocks reading.

## Page flow (home page)

Build the home page in this order; each section has one job and one action, and together they follow the Storytelling arc.

1. **Sticky header** — wordmark left, four links (Founder Trajectory™, RENZOLO OS™, Academy, Pricing), primary button "Start your assessment" right. Adds `shadow-soft` once the page scrolls.
2. **Hero** (the ambition) — `eyebrow`, `display-xl` headline, `body-lg` subcopy, primary + secondary buttons, a floating ReadinessTicker card on `glow-brand` (clearly labelled "Sample"), and staggered `brand` / `gold` / `teal` colour blocks rising left-to-right behind it (the trajectory motif).
3. **Three outcomes** — three FeatureCards: Customers (`brand`), Capital (`gold`), Investors (`teal`).
4. **The gap** — a short, calm `surface-tint` section naming the founder's frustration and turning it.
5. **The method** (the plan) — the StageChip strip with the trajectory line: Evaluate. Evolve. Execute. Elevate. Each stage expands on tap to one sentence.
6. **Readiness Snapshot taster** — the three-question inline quiz.
7. **RENZOLO OS™ showcase** (the tool) on a `night` band, premium mode — the product scroll story.
8. **Why RENZOLO** (the guide), premium mode — the positioning line, Lorenzo's photo and story, the five reasons with their proof, and the Results strip.
9. **Testimonials** (the proof) — the Testimonials scroller; while real testimonials are being collected, show the EY program results as stats instead.
10. **Pricing** (the choice), premium mode — billing toggle, $79 standalone assessment, then Essentials, Growth, Elevate cards; Growth carries a `gold` "Most popular" badge.
11. **Founder Trajectory™ Academy**, premium mode — Launch, Build and Scale cohorts.
12. **FAQ** — accordion.
13. **Final call to action** — full-width `brand` panel with `on-brand` text and one button.
14. **Footer** on `night`, with WhatsApp, email and social links.

## Implementing the system (for Claude Code)

- Read `tokens.json` and declare each token as a CSS custom property on `:root` (light) and under `[data-theme="dark"]` plus `@media (prefers-color-scheme: dark)` (dark). Names stay exactly as written (`--brand`, `--surface-tint`, `--space-6`, `--radius-pill`, `--shadow-pop`).
- With Tailwind, map `theme.extend.colors`, `spacing`, `borderRadius`, `boxShadow` and `fontFamily` to those variables (`brand: 'var(--brand)'`) rather than copying hex values.
- Build components to match the previews in this system: Button, StageChip, FeatureCard, Testimonials, ReadinessTicker.
- Load JetBrains Mono (500, 600) from Google Fonts alongside the other two families, for live numbers only.
- Keep the existing app (app.renzoloenterprises.com) on the same tokens so the marketing site and app feel like one product.

## Iconography

No RENZOLO logo file is included in this system yet: set the wordmark as "RENZOLO" in the display family at weight 800, `ink`, letter-spacing -0.01em, until the real mark is supplied. Use Lucide icons (outline, 1.75px stroke, 20 or 24px) in `ink` or the matching `on-…` colour; this is a recommendation, not a brand-owned set. No emoji, no clip-art illustrations: use colour blocks and the imagery described under Imagery instead.
