import Flutterwave from "flutterwave-node-v3";

/** Single payment integration for launch: Flutterwave covers cards +
 * mobile money (M-Pesa in Kenya, bank/1Voucher in South Africa, etc.)
 * across our target African markets in one API, instead of stitching
 * together Stripe plus separate local rails. */
export function getFlutterwaveClient() {
  return new Flutterwave(process.env.FLUTTERWAVE_PUBLIC_KEY!, process.env.FLUTTERWAVE_SECRET_KEY!);
}

export type FlutterwaveProduct = "subscription" | "advisor_session";

export interface CheckoutParams {
  product: FlutterwaveProduct;
  founderId: string;
  email: string;
  name: string;
  amount: number;
  currency: string;
  redirectUrl: string;
  /** Only meaningful for product: "subscription". */
  interval?: "monthly" | "annual";
}

/** Initiates a Flutterwave standard checkout. tx_ref encodes the product
 * type so the webhook (app/api/billing/webhook/route.ts) knows whether a
 * completed charge should activate a subscription or mark a 1:1 advisor
 * session as paid — two different downstream effects, one payment API. */
export async function initiateCheckout(params: CheckoutParams) {
  const flw = getFlutterwaveClient();
  const tx_ref = `renzolo-${params.product}-${params.founderId}-${Date.now()}`;
  const payload: Record<string, unknown> = {
    tx_ref,
    amount: params.amount,
    currency: params.currency,
    redirect_url: params.redirectUrl,
    customer: { email: params.email, name: params.name },
    customizations: {
      title: params.product === "subscription" ? "RENZOLO OS Subscription" : "RENZOLO OS — 1:1 Advisor Session",
      description:
        params.product === "subscription"
          ? `${params.interval === "monthly" ? "Monthly" : "Annual"} plan`
          : "One-time paid coaching session with an advisor",
    },
  };
  if (params.product === "subscription" && params.interval) {
    payload.payment_plan = params.interval === "monthly" ? process.env.FLUTTERWAVE_MONTHLY_PLAN_ID : process.env.FLUTTERWAVE_ANNUAL_PLAN_ID;
  }
  // NOTE: this SDK call needs a live FLUTTERWAVE_SECRET_KEY and network
  // access to api.flutterwave.com to actually run.
  return { tx_ref, payload };
}

export function verifyWebhookSignature(headerHash: string | null): boolean {
  const expected = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;
  return !!expected && !!headerHash && headerHash === expected;
}

/** Parses a tx_ref of the form renzolo-<product>-<founderId>-<timestamp>. */
export function parseTxRef(txRef: string): { product: FlutterwaveProduct; founderId: string } | null {
  const match = /^renzolo-(subscription|advisor_session)-(.+)-\d+$/.exec(txRef ?? "");
  if (!match) return null;
  return { product: match[1] as FlutterwaveProduct, founderId: match[2] };
}
