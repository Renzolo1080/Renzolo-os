# Total Readiness Score: spec v1 (October 2026)

One headline number, 0–100, made of five component scores. Code:
`lib/readiness.ts`; tests: `test/readiness.test.ts`.

| Component | Question it answers | v1 inputs |
| --- | --- | --- |
| Strategic | Is the plan written, measurable, funded and reviewed? | Plan Builder completeness (50%) and AI plan review (50%); otherwise the assessment's Strategic Plan Readiness (marked estimated) |
| Growth | Can the business deliver and scale? | Key activities, key resources, key partnerships and channels (60%); market readiness (40%) |
| Customer | Is it ready to win and keep buyers? | Customer readiness sub-score |
| Capital | Is it ready for loans, credit and grants? | Revenue streams and cost structure (50%); evidence completeness (30%); Strategic (20%) |
| Investment | Is it ready for investors and partners? | Investor readiness sub-score (already discounted for weak evidence) |

**Total** = weighted average. Even weights (20% each) by default; when the
founder's target outcome is set, that outcome's component counts 32% and the
others 17% each (customers → Customer, capital → Capital, investors →
Investment).

**Bands:** Ready 75+, Nearly ready 60–74, Getting ready 40–59, Not yet under 40.

**Estimated flag:** a component resting on little data (no plan yet, or
evidence completeness under 40%) is flagged so founders know where to add
evidence.

Capital and Investment stay separate: most early-stage founders seek credit
or grants, not equity.

## Next (60-day plan, data engine)

- Store a score snapshot and a change event with its cause on every change
  (`score_snapshots`, `score_events`), so the live score card can show history
  and today's movers.
- Add statement evidence (bank and M-Pesa) to Capital once uploads are live.
- Store the founder's target outcome so the weights follow it.
- Calibrate the weights against the 60-founder pilot's outcomes.
