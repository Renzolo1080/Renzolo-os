import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyTransaction } from "@/lib/flutterwave";
import { fulfilTransaction } from "@/lib/payments";
import { createPaymentStore } from "@/lib/payments-store";
import { getAppUrl } from "@/lib/app-url";

// Always run fresh — never serve a cached answer for a payment result.
export const dynamic = "force-dynamic";

/** GET /api/billing/callback?status=…&tx_ref=…&transaction_id=…
 * Where Flutterwave sends the founder's browser after the hosted payment
 * page. The query string is NOT trusted — anyone can type a URL. It must
 * name a checkout this app actually started (tx_ref), and the transaction
 * ID is then verified with Flutterwave and checked against our own record
 * before anything is granted (lib/payments.ts). This route can never
 * treat a charge as an automatic renewal; only the webhook can.
 *
 * The webhook does the same job server-to-server, and the dashboard
 * re-checks anything still pending, so access still arrives if the
 * founder closes the tab before getting here.
 *
 * Ends by sending the founder to their dashboard with a result the
 * dashboard turns into a plain-language banner. */
export async function GET(req: NextRequest) {
  const base = getAppUrl(req.url);
  const params = req.nextUrl.searchParams;
  const transactionId = params.get("transaction_id");
  const txRef = params.get("tx_ref");
  const status = (params.get("status") ?? "").toLowerCase();

  const done = (payment: string, product?: string | null) => {
    const url = new URL("/dashboard", base);
    url.searchParams.set("payment", payment);
    if (product) url.searchParams.set("product", product);
    return NextResponse.redirect(url, 303);
  };

  if (!transactionId || !/^\d+$/.test(transactionId) || !txRef) {
    // Flutterwave omits transaction_id when the founder cancelled or the
    // charge failed before a transaction existed.
    return done(status === "cancelled" || status === "canceled" ? "cancelled" : "failed");
  }

  try {
    const result = await fulfilTransaction(
      transactionId,
      { store: createPaymentStore(createAdminClient()), verify: (id) => verifyTransaction(id) },
      { source: "callback", expectedTxRef: txRef }
    );
    switch (result.outcome) {
      case "fulfilled":
      case "already_fulfilled":
        return done("success", result.product);
      case "not_successful":
        return done(result.status === "failed" ? "failed" : "pending", result.product);
      case "mismatch":
        console.error("Payment mismatch on callback:", transactionId, result.reason);
        return done("review", result.product);
      case "unknown_reference":
        if (result.paid) console.error("Paid transaction with no matching order on callback:", transactionId);
        return done(result.paid ? "review" : "failed");
    }
  } catch (e) {
    // Couldn't check right now (e.g. Flutterwave unreachable). The webhook
    // and the dashboard's re-check will still complete it.
    console.error("Payment callback could not verify transaction:", transactionId, e);
    return done("pending");
  }
}
