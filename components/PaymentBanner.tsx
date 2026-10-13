/** Turns the result the payment return page (app/api/billing/callback)
 * puts in the dashboard URL into a plain-language message. Rendered on
 * the server; shows nothing for an unrecognised value.
 *
 * The dashboard only passes "success" here after confirming it in the
 * database (an address-bar value alone is downgraded to "pending"). */
export function PaymentBanner({ payment, product }: { payment?: string; product?: string }) {
  const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  const contact = support ? ` Contact ${support} and we'll sort it out.` : " Please contact us and we'll sort it out.";

  let tone: "good" | "wait" | "bad" = "bad";
  let message: string;

  switch (payment) {
    case "success":
      tone = "good";
      message =
        product === "advisor_session"
          ? "Payment received. An advisor will contact you by email to arrange your 1:1 session."
          : product === "assessment"
          ? "Payment received. Your Readiness Assessment is unlocked: answer the detailed questions below to get your full report."
          : product === "coaching"
          ? "Payment received. Your coaching sessions are ready to book from the Membership page."
          : "Payment received. Your membership is active.";
      break;
    case "pending":
      tone = "wait";
      message =
        "We're confirming your payment. This can take a few minutes, especially with mobile money. Refresh this page shortly; it re-checks each time. If you completed the payment, you don't need to pay again.";
      break;
    case "cancelled":
      tone = "wait";
      message = "Checkout was cancelled, so nothing was bought. You can try again whenever you're ready.";
      break;
    case "failed":
      message = `The payment didn't go through. You can try again.${support ? ` If money left your account, contact ${support}.` : " If money left your account, please contact us."}`;
      break;
    case "review":
      message = `We received a payment but couldn't match it to your order, so it hasn't been applied yet.${contact}`;
      break;
    default:
      return null;
  }

  const styles =
    tone === "good" ? "border-teal bg-cream text-navy" : tone === "wait" ? "border-gold bg-cream text-navy" : "border-red-500 bg-red-50 text-red-700";

  return (
    <div role="status" className={`rounded border p-4 text-sm font-semibold mb-6 ${styles}`}>
      {message}
    </div>
  );
}
