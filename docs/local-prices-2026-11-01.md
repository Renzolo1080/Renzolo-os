# Local-currency prices: Kenya, Nigeria, South Africa, Ghana

**Status: proposed, for Lorenzo's approval. Not live.**
Prepared 1 November 2026. These are the same prices as USD, converted at the rates below and rounded. They are not regional discounts.

## Rates used
| Currency | 1 USD = | Source |
|---|---|---|
| KES (Kenya) | 129.9 | Wise mid-market, 1 Nov 2026 |
| NGN (Nigeria) | 1,346 | Official NFEM rate, 1 Nov 2026 |
| ZAR (South Africa) | 16.70 | USD/ZAR close, 30 Oct 2026 |
| GHS (Ghana) | 11.65 | USD/GHS, 30 Oct 2026 |

Rounding: KES to the nearest 100, NGN to the nearest 1,000, ZAR and GHS to the nearest 10.
Review every quarter, or sooner if a currency moves more than 10%.

## Prices
| Item | USD | KES | NGN | ZAR | GHS |
|---|---|---|---|---|---|
| Readiness Assessment | $60 | 7,800 | 81,000 | 1,000 | 700 |
| Essentials · quarterly | $60 | 7,800 | 81,000 | 1,000 | 700 |
| Essentials · annual | $200 | 26,000 | 269,000 | 3,340 | 2,330 |
| Growth · quarterly | $147 | 19,100 | 198,000 | 2,450 | 1,710 |
| Growth · annual | $490 | 63,700 | 660,000 | 8,180 | 5,710 |
| Elevate · quarterly | $699 | 90,800 | 941,000 | 11,670 | 8,140 |
| Elevate · annual | $2,490 | 323,500 | 3,352,000 | 41,580 | 29,010 |
| Coaching, non-member · 1 | $150 | 19,500 | 202,000 | 2,510 | 1,750 |
| Coaching, non-member · 3 | $399 | 51,800 | 537,000 | 6,660 | 4,650 |
| Coaching, Essentials · 1 | $75 | 9,700 | 101,000 | 1,250 | 870 |
| Coaching, Essentials · 3 | $199 | 25,900 | 268,000 | 3,320 | 2,320 |
| Coaching, Growth · 1 | $105 | 13,600 | 141,000 | 1,750 | 1,220 |
| Coaching, Growth · 3 | $279 | 36,200 | 376,000 | 4,660 | 3,250 |
| Coaching, Elevate · 1 | $120 | 15,600 | 162,000 | 2,000 | 1,400 |
| Coaching, Elevate · 3 | $319 | 41,400 | 429,000 | 5,330 | 3,720 |

## Before these can go live
1. **Approve the new USD prices.** This table uses the Nov 1 price set: Essentials $60/qtr or $200/yr (no monthly), Growth $147/qtr or $490/yr, Elevate $699/qtr or $2,490/yr, plus coaching priced by membership level. That set is not in the code yet.
2. **Ship the code change for that set.** Today the code still sells Essentials monthly, and coaching is priced by purchase history (member, past client, first-time). The coaching-by-membership settings below only work after that change.
3. **Add the settings in Vercel** (Production), then redeploy. Local prices for memberships only appear once **every** membership price is set in that currency, so add whole blocks at a time.
4. Ask Flutterwave what it charges to settle KES, NGN, ZAR and GHS into USD.

## Vercel settings
```
PRICE_ASSESSMENT_KES=7800
PRICE_ASSESSMENT_NGN=81000
PRICE_ASSESSMENT_ZAR=1000
PRICE_ASSESSMENT_GHS=700
PRICE_ESSENTIALS_QUARTERLY_KES=7800
PRICE_ESSENTIALS_QUARTERLY_NGN=81000
PRICE_ESSENTIALS_QUARTERLY_ZAR=1000
PRICE_ESSENTIALS_QUARTERLY_GHS=700
PRICE_ESSENTIALS_ANNUAL_KES=26000
PRICE_ESSENTIALS_ANNUAL_NGN=269000
PRICE_ESSENTIALS_ANNUAL_ZAR=3340
PRICE_ESSENTIALS_ANNUAL_GHS=2330
PRICE_GROWTH_QUARTERLY_KES=19100
PRICE_GROWTH_QUARTERLY_NGN=198000
PRICE_GROWTH_QUARTERLY_ZAR=2450
PRICE_GROWTH_QUARTERLY_GHS=1710
PRICE_GROWTH_ANNUAL_KES=63700
PRICE_GROWTH_ANNUAL_NGN=660000
PRICE_GROWTH_ANNUAL_ZAR=8180
PRICE_GROWTH_ANNUAL_GHS=5710
PRICE_ELEVATE_QUARTERLY_KES=90800
PRICE_ELEVATE_QUARTERLY_NGN=941000
PRICE_ELEVATE_QUARTERLY_ZAR=11670
PRICE_ELEVATE_QUARTERLY_GHS=8140
PRICE_ELEVATE_ANNUAL_KES=323500
PRICE_ELEVATE_ANNUAL_NGN=3352000
PRICE_ELEVATE_ANNUAL_ZAR=41580
PRICE_ELEVATE_ANNUAL_GHS=29010
PRICE_COACHING_SINGLE_KES=19500
PRICE_COACHING_SINGLE_NGN=202000
PRICE_COACHING_SINGLE_ZAR=2510
PRICE_COACHING_SINGLE_GHS=1750
PRICE_COACHING_PACK3_KES=51800
PRICE_COACHING_PACK3_NGN=537000
PRICE_COACHING_PACK3_ZAR=6660
PRICE_COACHING_PACK3_GHS=4650
PRICE_COACHING_SINGLE_ESSENTIALS_KES=9700
PRICE_COACHING_SINGLE_ESSENTIALS_NGN=101000
PRICE_COACHING_SINGLE_ESSENTIALS_ZAR=1250
PRICE_COACHING_SINGLE_ESSENTIALS_GHS=870
PRICE_COACHING_PACK3_ESSENTIALS_KES=25900
PRICE_COACHING_PACK3_ESSENTIALS_NGN=268000
PRICE_COACHING_PACK3_ESSENTIALS_ZAR=3320
PRICE_COACHING_PACK3_ESSENTIALS_GHS=2320
PRICE_COACHING_SINGLE_GROWTH_KES=13600
PRICE_COACHING_SINGLE_GROWTH_NGN=141000
PRICE_COACHING_SINGLE_GROWTH_ZAR=1750
PRICE_COACHING_SINGLE_GROWTH_GHS=1220
PRICE_COACHING_PACK3_GROWTH_KES=36200
PRICE_COACHING_PACK3_GROWTH_NGN=376000
PRICE_COACHING_PACK3_GROWTH_ZAR=4660
PRICE_COACHING_PACK3_GROWTH_GHS=3250
PRICE_COACHING_SINGLE_ELEVATE_KES=15600
PRICE_COACHING_SINGLE_ELEVATE_NGN=162000
PRICE_COACHING_SINGLE_ELEVATE_ZAR=2000
PRICE_COACHING_SINGLE_ELEVATE_GHS=1400
PRICE_COACHING_PACK3_ELEVATE_KES=41400
PRICE_COACHING_PACK3_ELEVATE_NGN=429000
PRICE_COACHING_PACK3_ELEVATE_ZAR=5330
PRICE_COACHING_PACK3_ELEVATE_GHS=3720
```
