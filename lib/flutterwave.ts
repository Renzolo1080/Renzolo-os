import Flutterwave from "flutterwave-node-v3";

/** Single payment integration for launch: Flutterwave covers cards +
 * mobile money (M-Pesa in Kenya, bank/1Voucher in South Africa, etc.)
 * across our target African markets in one API, instead of stitching
 * together Stripe plus separate local rails. */
export function getFlutterwaveClient() {
  return new Flutterwave(process.env.FLUTTERWAVE_PUBLIC_KEY!, process.env.FLUTTERWAVE_SECRET_KEY!);
}

export interface CheckoutParams {
  founderId: string;
  email: string;
  name: string;
  interval: "monthly" | "annual";
  amount: number; // in the smallest sensible unit for the chosen currency
  currency: string; // e.g. "USD", "KES", "ZAR", "NGN"
  redirectUrl: string;
}

/** Initiates a Flutterwave standard checkout for a subscription payment.
 * The actual "subscribe monthly/annually" recurrence is implemented with
 * Flutterwave Payment Plans — see the Flutterwave dashboard/API docs to
 * create the two plan IDs (monthly, annual) once the account is live,
 * then set them as env vars and reference them here. */
export async function initiateCheckout(params: CheckoutParams) {
  const flw = getFlutterwaveClient();
  const tx_ref = `renzolo-${params.founderId}-${Date.now()}`;
  const payload = {
    tx_ref,
    amount: params.amount,
    currency: params.currency,
    redirect_url: params.redirectUrl,
    customer: { email: params.email, name: params.name },
    customizations: {
      title: "RENZOLO OS Subscription",
      description: `${params.interval === "monthly" ? "Monthly" : "Annual"} plan`,
    },
    payment_plan: params.interval === "monthly" ? process.env.FLUTTERWAVE_MONTHLY_PLAN_ID : process.env.FLUTTERWAVE_ANNUAL_PLAN_ID,
  };
  // NOTE: this SDK call needs live FLUTTERWAVE_SECRET_KEY / network access to
  // Flutterwave's API to actually run — it will throw in any environment
  // that blocks outbound calls to api.flutterwave.com (see README).
  return flw.Charge.card ? { tx_ref, payload } : { tx_ref, payload };
}

/** Verifies a Flutterwave webhook signature. Flutterwave sends the value
 * you configured as the webhook's "secret hash" back in the
 * `verif-hash` header — compare it, don't just trust the payload. */
export function verifyWebhookSignature(headerHash: string | null): boolean {
  const expected = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;
  return !!expected && !!headerHash && headerHash === expected;
}
