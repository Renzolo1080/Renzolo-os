# ReadinessTicker

The live Readiness Score shown like a stock quote: headline score, change, time ranges, a sparkline, three sub-scores, the day's movers and the sector index.

- **Consumer provides:** the current score and its change for the selected range, the series for each range (1H, 1D, 1W, 1M, 1Y), the three sub-scores (Customers, Capital, Investors) with their changes, up to three movers with point values and causes, the sector index, and the last-updated time.
- Card: `surface-raised`, 1px `line`, `radius-lg`, `space-6` padding, `glow-brand` (the one glow on the screen). On dark grounds it may use `glass` with a `glass-edge` border instead of `surface-raised`.
- Numbers in the mono family: score in `ticker`, changes and sub-scores in `data`, always with tabular numerals.
- Rising figures in `tick-up`, falling in `tick-down`, each with a plus or minus sign and an up or down arrow; colour is never the only signal.
- A pulsing `teal` "Live" dot and a relative timestamp; the dot stops pulsing under reduced motion.
- Range buttons are toggle buttons (`aria-pressed`); the sparkline redraws over 600ms when the range changes.
- Movers name their real cause; never show a change without one. With no new evidence, the score and chart hold steady.
- On the marketing site, the ticker shows sample data labelled "Sample"; in RENZOLO OS™ it shows the founder's own live data.
