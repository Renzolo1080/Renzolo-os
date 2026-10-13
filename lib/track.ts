"use client";
/** Sends funnel events to Google Analytics and the Meta Pixel — but only
 * when the visitor has accepted analytics cookies and the IDs are set
 * (NEXT_PUBLIC_GA_ID, NEXT_PUBLIC_META_PIXEL_ID). Otherwise does nothing.
 * Never sends names, emails or answers: only the event and, for a
 * purchase, the amount. */

type Params = { value?: number; currency?: string; item?: string; transaction_id?: string };

const GA: Record<string, string> = {
  snapshot_complete: "generate_lead",
  sign_up: "sign_up",
  begin_checkout: "begin_checkout",
  purchase: "purchase",
};
const META: Record<string, string> = {
  snapshot_complete: "Lead",
  sign_up: "CompleteRegistration",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
};

export function track(event: keyof typeof GA, params: Params = {}) {
  if (typeof window === "undefined") return;
  const w = window as any;
  try {
    if (typeof w.gtag === "function") {
      w.gtag("event", GA[event], {
        value: params.value,
        currency: params.currency,
        transaction_id: params.transaction_id,
        items: params.item ? [{ item_name: params.item }] : undefined,
      });
    }
    if (typeof w.fbq === "function") {
      w.fbq("track", META[event], params.value !== undefined ? { value: params.value, currency: params.currency } : {}, params.transaction_id ? { eventID: params.transaction_id } : undefined);
    }
  } catch {
    // Analytics must never break the page.
  }
}
