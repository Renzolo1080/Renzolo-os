import { timingSafeEqual } from "crypto";

/** Single payment integration for launch: Flutterwave covers cards +
 * mobile money (M-Pesa in Kenya, bank/1Voucher in South Africa, etc.)
 * across our target African markets in one API, instead of stitching
 * together Stripe plus separate local rails.
 *
 * This talks to Flutterwave's v3 REST API directly with fetch — no SDK.
 * It uses "Flutterwave Standard": we ask Flutterwave for a hosted payment
 * page, send the founder there, and Flutterwave sends them back to our
 * redirect URL. Card and mobile-money details never touch this app.
 *
 * Everything Flutterwave-specific is kept inside this one file on
 * purpose, so a move to a different API version only changes this file. */

const DEFAULT_BASE_URL = "https://api.flutterwave.com/v3";

export type FlutterwaveProduct = "subscription" | "advisor_session" | "assessment" | "coaching";

export class FlutterwaveError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "FlutterwaveError";
  }
}

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

interface ClientOptions {
  secretKey?: string;
  baseUrl?: string;
  fetchImpl?: FetchLike;
}

function resolve(options: ClientOptions) {
  const secretKey = options.secretKey ?? process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) {
    throw new FlutterwaveError("Payments are not configured yet (FLUTTERWAVE_SECRET_KEY is missing).");
  }
  const baseUrl = (options.baseUrl ?? process.env.FLUTTERWAVE_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  return { secretKey, baseUrl, fetchImpl: options.fetchImpl ?? (fetch as FetchLike) };
}

async function call(path: string, init: RequestInit, options: ClientOptions): Promise<any> {
  const { secretKey, baseUrl, fetchImpl } = resolve(options);
  let res: Response;
  try {
    res = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
  } catch (e) {
    throw new FlutterwaveError(`Couldn't reach Flutterwave: ${e instanceof Error ? e.message : String(e)}`);
  }
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON body (e.g. a gateway error page) — handled as a failure below.
  }
  if (!res.ok || !body || body.status !== "success") {
    throw new FlutterwaveError(body?.message ?? `Flutterwave returned HTTP ${res.status}`, res.status);
  }
  return body;
}

/** tx_ref format: renzolo-<product>-<founderId>-<timestamp><random>.
 * Must be unique per transaction (Flutterwave requirement); the random
 * suffix covers two checkouts started in the same millisecond. */
export function buildTxRef(product: FlutterwaveProduct, founderId: string, now: number = Date.now()): string {
  const suffix = Math.floor(Math.random() * 1e9)
    .toString()
    .padStart(9, "0");
  return `renzolo-${product}-${founderId}-${now}${suffix}`;
}

/** Defensive: Flutterwave has been reported to append a retry marker
 * ("_PMCKDU_1", "_PMCKDU_2", …) to the reference when a customer's first
 * attempt fails and they try again inside the same checkout. That is not
 * in the current documentation and has not been observed against this
 * app, but if it happens the payment must still be matched to the order
 * it was for — so the marker is stripped before any lookup. */
export function normalizeTxRef(txRef: string | null | undefined): string {
  return (txRef ?? "").trim().replace(/_PMCKDU_\d+$/, "");
}

/** Parses a tx_ref of the form renzolo-<product>-<founderId>-<digits>. */
export function parseTxRef(txRef: string | null | undefined): { product: FlutterwaveProduct; founderId: string } | null {
  const match = /^renzolo-(subscription|advisor_session|assessment|coaching)-(.+)-\d+$/.exec(normalizeTxRef(txRef));
  if (!match) return null;
  return { product: match[1] as FlutterwaveProduct, founderId: match[2] };
}

export interface HostedCheckoutParams {
  txRef: string;
  amount: number;
  currency: string;
  redirectUrl: string;
  customer: { email: string; name?: string };
  title: string;
  description: string;
  /** Flutterwave Payment Plan ID. Setting this makes the charge recurring
   * AND restricts the checkout to card only (Flutterwave rule), so only
   * pass it when the founder explicitly chose card auto-renewal. */
  paymentPlan?: string;
  meta?: Record<string, string>;
}

/** Asks Flutterwave for a hosted payment page and returns its URL. */
export async function createHostedCheckout(params: HostedCheckoutParams, options: ClientOptions = {}): Promise<string> {
  const payload: Record<string, unknown> = {
    tx_ref: params.txRef,
    amount: params.amount,
    currency: params.currency,
    redirect_url: params.redirectUrl,
    customer: { email: params.customer.email, name: params.customer.name ?? params.customer.email },
    customizations: { title: params.title, description: params.description },
  };
  if (params.meta) payload.meta = params.meta;
  if (params.paymentPlan) payload.payment_plan = params.paymentPlan;

  const body = await call("/payments", { method: "POST", body: JSON.stringify(payload) }, options);
  const link = body?.data?.link;
  if (typeof link !== "string" || !/^https:\/\//.test(link)) {
    throw new FlutterwaveError("Flutterwave did not return a payment link.");
  }
  return link;
}

/** The subset of a verified transaction this app relies on. */
export interface VerifiedTransaction {
  id: string;
  txRef: string;
  status: string;
  amount: number;
  currency: string;
  customerEmail: string | null;
  customerId: string | null;
  paymentType: string | null;
}

/** Looks a transaction up with Flutterwave by its transaction ID. This is
 * the ONLY source of truth for "did this person really pay, and how
 * much" — the redirect back to our site and the webhook body are both
 * treated as hints that a transaction exists, never as proof. */
export async function verifyTransaction(transactionId: string | number, options: ClientOptions = {}): Promise<VerifiedTransaction> {
  const id = String(transactionId);
  if (!/^\d+$/.test(id)) throw new FlutterwaveError("Invalid transaction id.");
  const body = await call(`/transactions/${id}/verify`, { method: "GET" }, options);
  return toVerified(body.data);
}

/** Looks a transaction up by OUR reference instead of Flutterwave's ID.
 * Used only to re-check a payment that is still pending and for which we
 * never learned a transaction ID (the founder closed the tab and no
 * webhook arrived). Flutterwave documents the endpoint but not its
 * response body; it is read the same way as verify-by-ID and anything
 * unexpected is treated as "nothing found". */
export async function verifyTransactionByReference(txRef: string, options: ClientOptions = {}): Promise<VerifiedTransaction> {
  if (!txRef) throw new FlutterwaveError("Missing transaction reference.");
  const body = await call(`/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`, { method: "GET" }, options);
  return toVerified(body.data);
}

function toVerified(d: any): VerifiedTransaction {
  if (!d || d.id == null || !/^\d+$/.test(String(d.id))) throw new FlutterwaveError("Flutterwave returned no transaction data.");
  return {
    id: String(d.id),
    txRef: String(d.tx_ref ?? ""),
    status: String(d.status ?? "").toLowerCase(),
    amount: Number(d.amount),
    currency: String(d.currency ?? "").toUpperCase(),
    customerEmail: d.customer?.email ? String(d.customer.email).trim().toLowerCase() : null,
    customerId: d.customer?.id != null ? String(d.customer.id) : null,
    paymentType: d.payment_type ? String(d.payment_type) : null,
  };
}

/** Flutterwave sends the secret hash we set in their dashboard back in
 * the `verif-hash` header of every webhook. Compared in constant time. */
export function verifyWebhookSignature(headerHash: string | null, expected: string | undefined = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH): boolean {
  if (!expected || !headerHash) return false;
  const a = Buffer.from(headerHash);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
