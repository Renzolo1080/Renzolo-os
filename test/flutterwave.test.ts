import { buildTxRef, parseTxRef, normalizeTxRef, createHostedCheckout, verifyTransaction, verifyTransactionByReference, verifyWebhookSignature, FlutterwaveError } from "../lib/flutterwave";
import { currencyForCountry, formatPrice } from "../lib/pricing";
import { getAppUrl } from "../lib/app-url";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("PASS:", msg);
  }
}

/** A simulated Flutterwave: records what the app sent and replies with a
 * canned response, so no network or account is needed. */
function fakeFlutterwave(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = async (url: string, init?: RequestInit) => {
    calls.push({ url, init: init ?? {} });
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
  };
  return { calls, fetchImpl };
}

async function rejects(fn: () => Promise<unknown>): Promise<Error | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    return e as Error;
  }
}

const FOUNDER = "11111111-1111-1111-1111-111111111111";

async function main() {
  // --- references ------------------------------------------------------
  const ref = buildTxRef("subscription", FOUNDER, 1760000000000);
  assert(/^renzolo-subscription-11111111-1111-1111-1111-111111111111-1760000000000\d{9}$/.test(ref), "tx_ref has the expected shape");
  const sameInstant = new Set(Array.from({ length: 50 }, () => buildTxRef("subscription", FOUNDER, 1760000000000)));
  assert(sameInstant.size === 50, "50 references created in the same millisecond are all different (random suffix)");
  assert(normalizeTxRef(`${ref}_PMCKDU_1`) === ref && normalizeTxRef(`${ref}_PMCKDU_12`) === ref, "Flutterwave's retry marker is stripped from a reference");
  assert(normalizeTxRef(ref) === ref && normalizeTxRef(null) === "" && normalizeTxRef("  abc ") === "abc", "a reference without the marker is unchanged (and trimmed)");
  assert(parseTxRef(`${ref}_PMCKDU_1`)?.founderId === FOUNDER, "a reference with the retry marker still parses");
  const parsed = parseTxRef(ref);
  assert(parsed?.product === "subscription" && parsed.founderId === FOUNDER, "tx_ref parses back to product and founder (UUID with dashes intact)");
  assert(parseTxRef(buildTxRef("advisor_session", FOUNDER))?.product === "advisor_session", "advisor-session tx_ref parses");
  assert(parseTxRef("FLW-SUBSCRIPTION-abc") === null && parseTxRef(null) === null && parseTxRef("") === null, "foreign or empty references don't parse");

  // --- starting a checkout ---------------------------------------------
  {
    const fw = fakeFlutterwave(200, { status: "success", message: "Hosted Link", data: { link: "https://checkout.flutterwave.com/v3/hosted/pay/flwlnk-abc" } });
    const link = await createHostedCheckout(
      {
        txRef: ref,
        amount: 9,
        currency: "USD",
        redirectUrl: "https://renzolo-os.vercel.app/api/billing/callback",
        customer: { email: "founder@example.com", name: "Ada" },
        title: "RENZOLO OS Subscription",
        description: "Monthly plan",
        meta: { founder_id: FOUNDER },
      },
      { secretKey: "FLWSECK_TEST-x", fetchImpl: fw.fetchImpl }
    );
    assert(link === "https://checkout.flutterwave.com/v3/hosted/pay/flwlnk-abc", "returns the hosted payment link");
    const call = fw.calls[0];
    const sent = JSON.parse(String(call.init.body));
    assert(call.url === "https://api.flutterwave.com/v3/payments" && call.init.method === "POST", "posts to Flutterwave's payments endpoint");
    assert((call.init.headers as any).Authorization === "Bearer FLWSECK_TEST-x", "sends the secret key as a bearer token");
    assert(sent.tx_ref === ref && sent.amount === 9 && sent.currency === "USD", "sends reference, amount and currency");
    assert(sent.redirect_url === "https://renzolo-os.vercel.app/api/billing/callback", "sends the return address");
    assert(sent.customer.email === "founder@example.com" && sent.customer.name === "Ada", "sends the customer");
    assert(sent.customizations.title === "RENZOLO OS Subscription" && sent.meta.founder_id === FOUNDER, "sends title and meta");
    assert(!("payment_plan" in sent), "no payment plan unless auto-renew was chosen (keeps mobile money available)");
  }
  {
    const fw = fakeFlutterwave(200, { status: "success", data: { link: "https://checkout.flutterwave.com/x" } });
    await createHostedCheckout(
      { txRef: ref, amount: 9, currency: "USD", redirectUrl: "https://a.b/c", customer: { email: "f@e.com" }, title: "t", description: "d", paymentPlan: "3807" },
      { secretKey: "k", fetchImpl: fw.fetchImpl, baseUrl: "https://sandbox.example/v3/" }
    );
    const sent = JSON.parse(String(fw.calls[0].init.body));
    assert(sent.payment_plan === "3807", "payment plan is sent when auto-renew was chosen");
    assert(sent.customer.name === "f@e.com", "falls back to the email when the founder has no name on file");
    assert(fw.calls[0].url === "https://sandbox.example/v3/payments", "a custom base URL is honoured (trailing slash trimmed)");
  }
  {
    const fw = fakeFlutterwave(401, { status: "error", message: "Invalid authorization key" });
    const err = await rejects(() => createHostedCheckout({ txRef: ref, amount: 9, currency: "USD", redirectUrl: "https://a.b", customer: { email: "f@e.com" }, title: "t", description: "d" }, { secretKey: "bad", fetchImpl: fw.fetchImpl }));
    assert(err instanceof FlutterwaveError && err.message === "Invalid authorization key", "a rejected key surfaces Flutterwave's own message");
  }
  {
    const fw = fakeFlutterwave(200, { status: "success", data: {} });
    const err = await rejects(() => createHostedCheckout({ txRef: ref, amount: 9, currency: "USD", redirectUrl: "https://a.b", customer: { email: "f@e.com" }, title: "t", description: "d" }, { secretKey: "k", fetchImpl: fw.fetchImpl }));
    assert(err instanceof FlutterwaveError, "a success reply with no link is treated as a failure");
  }
  {
    const fw = fakeFlutterwave(502, "<html>Bad gateway</html>");
    const err = await rejects(() => createHostedCheckout({ txRef: ref, amount: 9, currency: "USD", redirectUrl: "https://a.b", customer: { email: "f@e.com" }, title: "t", description: "d" }, { secretKey: "k", fetchImpl: fw.fetchImpl }));
    assert(err instanceof FlutterwaveError && err.message.includes("502"), "a non-JSON error page is handled, not crashed on");
  }
  {
    const err = await rejects(() =>
      createHostedCheckout(
        { txRef: ref, amount: 9, currency: "USD", redirectUrl: "https://a.b", customer: { email: "f@e.com" }, title: "t", description: "d" },
        { secretKey: "k", fetchImpl: async () => { throw new Error("ECONNRESET"); } }
      )
    );
    assert(err instanceof FlutterwaveError && err.message.includes("Couldn't reach Flutterwave"), "a network failure becomes a clear error");
  }
  {
    const saved = process.env.FLUTTERWAVE_SECRET_KEY;
    delete process.env.FLUTTERWAVE_SECRET_KEY;
    const err = await rejects(() => createHostedCheckout({ txRef: ref, amount: 9, currency: "USD", redirectUrl: "https://a.b", customer: { email: "f@e.com" }, title: "t", description: "d" }));
    assert(err instanceof FlutterwaveError && err.message.includes("not configured"), "with no secret key set, checkout fails with a clear 'not configured' message");
    if (saved !== undefined) process.env.FLUTTERWAVE_SECRET_KEY = saved;
  }

  // --- verifying a transaction -----------------------------------------
  {
    const fw = fakeFlutterwave(200, {
      status: "success",
      message: "Transaction fetched successfully",
      data: { id: 4975363, tx_ref: ref, flw_ref: "FLW-MOCK", amount: 9, currency: "usd", charged_amount: 9.3, status: "successful", payment_type: "mobilemoneyke", customer: { id: 2356420, email: "Founder@Example.com", name: "Ada" } },
    });
    const t = await verifyTransaction(4975363, { secretKey: "k", fetchImpl: fw.fetchImpl });
    assert(fw.calls[0].url === "https://api.flutterwave.com/v3/transactions/4975363/verify" && fw.calls[0].init.method === "GET", "asks Flutterwave's verify endpoint for that transaction");
    assert(t.id === "4975363" && t.txRef === ref && t.status === "successful", "reads id, reference and status");
    assert(t.amount === 9 && t.currency === "USD", "reads the amount and upper-cases the currency");
    assert(t.customerEmail === "founder@example.com" && t.customerId === "2356420" && t.paymentType === "mobilemoneyke", "reads the payer (email lower-cased) and payment type");
  }
  {
    const fw = fakeFlutterwave(400, { status: "error", message: "No transaction was found for this id", data: null });
    const err = await rejects(() => verifyTransaction("123", { secretKey: "k", fetchImpl: fw.fetchImpl }));
    assert(err instanceof FlutterwaveError && err.message.includes("No transaction"), "an unknown transaction id is an error, never a pass");
  }
  {
    const fw = fakeFlutterwave(200, { status: "success", data: {} });
    const err = await rejects(() => verifyTransaction("123/../../payments", { secretKey: "k", fetchImpl: fw.fetchImpl }));
    assert(err instanceof FlutterwaveError && fw.calls.length === 0, "a non-numeric transaction id is rejected before any request is made");
  }

  {
    const fw = fakeFlutterwave(200, { status: "success", data: { id: 77, tx_ref: ref, amount: 9, currency: "USD", status: "Successful", customer: { id: 1, email: " F@E.com " } } });
    const t = await verifyTransactionByReference(ref, { secretKey: "k", fetchImpl: fw.fetchImpl });
    assert(fw.calls[0].url === `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(ref)}`, "verify-by-reference asks Flutterwave with our reference, URL-encoded");
    assert(t.id === "77" && t.status === "successful" && t.customerEmail === "f@e.com", "…and reads the reply the same way (status lower-cased, email trimmed)");
  }
  {
    const fw = fakeFlutterwave(200, { status: "success", data: { tx_ref: ref, amount: 9, currency: "USD", status: "successful" } });
    const err = await rejects(() => verifyTransactionByReference(ref, { secretKey: "k", fetchImpl: fw.fetchImpl }));
    assert(err instanceof FlutterwaveError, "a reply with no transaction id is treated as nothing found, never as a payment");
    const fw2 = fakeFlutterwave(200, { status: "success", data: null });
    const err2 = await rejects(() => verifyTransaction("5", { secretKey: "k", fetchImpl: fw2.fetchImpl }));
    assert(err2 instanceof FlutterwaveError, "a 'success' reply with empty data is an error");
  }

  // --- webhook signature -----------------------------------------------
  assert(verifyWebhookSignature("s3cret-hash", "s3cret-hash") === true, "matching webhook hash is accepted");
  assert(verifyWebhookSignature("wrong", "s3cret-hash") === false, "wrong webhook hash is rejected");
  assert(verifyWebhookSignature("s3cret-hash-longer", "s3cret-hash") === false, "different-length hash is rejected");
  assert(verifyWebhookSignature(null, "s3cret-hash") === false, "missing header is rejected");
  assert(verifyWebhookSignature("anything", "") === false && verifyWebhookSignature("", "") === false, "with no secret configured, every webhook is rejected");

  // --- tx_ref for the new products -------------------------------------
  assert(parseTxRef(buildTxRef("assessment", FOUNDER))?.product === "assessment", "assessment tx_ref parses");
  assert(parseTxRef(buildTxRef("coaching", FOUNDER))?.product === "coaching", "coaching tx_ref parses");
  assert(currencyForCountry("Kenya") === "KES" && currencyForCountry("Nairobi, kenya") === "KES" && currencyForCountry("South Africa") === "ZAR", "a founder's country maps to its currency");
  assert(currencyForCountry("United States") === null && currencyForCountry(null) === null && currencyForCountry("") === null, "countries without a local option, or no country, map to none");
  assert(formatPrice({ amount: 9, currency: "USD" }) === "$9" && formatPrice({ amount: 12.5, currency: "USD" }) === "$12.50" && formatPrice({ amount: 12000, currency: "KES" }) === "KES 12,000", "prices are formatted for display");

  // --- return address --------------------------------------------------
  assert(getAppUrl("https://preview-abc.vercel.app/api/billing/checkout", {}) === "https://preview-abc.vercel.app", "with no setting, the return address is wherever the request came in");
  assert(getAppUrl("https://preview-abc.vercel.app/x", { NEXT_PUBLIC_APP_URL: "https://os.renzolo.example/" }) === "https://os.renzolo.example", "NEXT_PUBLIC_APP_URL wins when set (trailing slash trimmed)");
  assert(getAppUrl("https://preview-abc.vercel.app/x", { NEXT_PUBLIC_APP_URL: "undefined" }) === "https://preview-abc.vercel.app", "a junk setting is ignored");

  console.log("\nAll Flutterwave, pricing and return-address tests completed.");
}

main().catch((e) => {
  console.error("FAIL: test run crashed:", e);
  process.exitCode = 1;
});
