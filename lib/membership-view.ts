import {
  TIERS,
  TIER_INTERVALS,
  INTERVAL_NAMES,
  INTERVAL_MONTHS,
  getMembershipPrice,
  membershipCurrenciesFor,
  mainCurrency,
  paymentPlanId,
  formatPrice,
  perMonth,
  type Tier,
} from "./pricing";
import { planChange, type CurrentMembership } from "./membership";
import type { CurrencyBlock, PlanCell } from "@/components/MembershipPlans";

/** What can be used to pay, per currency — from Flutterwave's published
 * payment-methods table, not yet confirmed against the live checkout. */
export function methodsFor(currency: string): string {
  switch (currency) {
    case "USD":
      return "US dollar payments are by card or US bank account. Mobile money such as M-Pesa is only offered when paying in local currency.";
    case "KES":
      return "Kenyan shilling payments can be made by M-Pesa or card.";
    case "ZAR":
      return "South African rand payments can be made by card, bank account or 1Voucher.";
    default:
      return `The payment methods offered are the ones Flutterwave supports for ${currency}.`;
  }
}

/** The tier cards' data for each currency the founder can pay in. With
 * `current` (a signed-in founder), each option carries the exact amount
 * and start date the checkout will use. */
export function buildCurrencyBlocks(country: string | null | undefined, current: CurrentMembership | null, currentTier: Tier | null, now = new Date()): CurrencyBlock[] {
  return membershipCurrenciesFor(country).map((currency) => {
    const tiers = {} as Record<Tier, PlanCell[]>;
    for (const tier of TIERS) {
      tiers[tier] = TIER_INTERVALS[tier].flatMap((interval) => {
        const price = getMembershipPrice(tier, interval, currency);
        if (!price) return [];
        // Only claim a saving that is true for the prices currently set.
        let note: string | null = null;
        if (interval === "annual") {
          const shortest = TIER_INTERVALS[tier][0];
          const base = getMembershipPrice(tier, shortest, currency);
          if (base) {
            const monthly = base.amount / INTERVAL_MONTHS[shortest];
            const free = (monthly * 12 - price.amount) / monthly;
            if (free >= 1) note = `${Number.isInteger(free) ? free : free.toFixed(1)} months free`;
          }
        }
        let quote: PlanCell["quote"] = null;
        let blocked: string | null = null;
        if (current) {
          const currentList = currentTier && current.lastPayment ? getMembershipPrice(currentTier, current.lastPayment.interval, currency) : null;
          const c = planChange(current, { tier, interval, listPrice: price }, now, currentList);
          if (c.ok) {
            quote = {
              kind: c.kind,
              charge: formatPrice(c.charge),
              credit: c.credit > 0 ? formatPrice({ amount: c.credit, currency }) : null,
              extraDays: c.extraDays,
              startsAt: c.startsAt,
            };
          } else blocked = c.reason;
        }
        return [
          {
            interval,
            intervalName: INTERVAL_NAMES[interval],
            price: formatPrice(price),
            per: interval === "monthly" ? "per month" : interval === "quarterly" ? "per quarter" : "per year",
            perMonth: interval === "monthly" ? null : perMonth(price, interval),
            note,
            quote,
            blocked,
            autoRenewAvailable: currency === mainCurrency() && !!paymentPlanId(tier, interval),
          },
        ];
      });
    }
    return { currency, methods: methodsFor(currency), tiers };
  });
}
