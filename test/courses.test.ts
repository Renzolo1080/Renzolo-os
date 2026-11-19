import { createHash } from "crypto";
import {
  BUNDLE_SLUG,
  COURSES,
  allLessons,
  alreadyOwnsAll,
  courseListPrice,
  courseQuote,
  coursesInPurchase,
  isPurchasableCourse,
  lessonCount,
  memberDiscountPercent,
  sanitizeEnergy,
  sanitizeVolt,
} from "../lib/courses";
import { signedEmbedUrl, isVideoId, VIDEO_LINK_SECONDS } from "../lib/course-video";
import { buildTxRef, parseTxRef } from "../lib/flutterwave";
import type { Region } from "../lib/region";

let failures = 0;
function assert(cond: boolean, msg: string, detail?: unknown) {
  if (!cond) {
    failures++;
    console.error("FAIL:", msg, detail === undefined ? "" : JSON.stringify(detail));
    process.exitCode = 1;
  } else console.log("PASS:", msg);
}

const africa: Region = { zone: "africa", intlCurrency: "USD" };
const intl: Region = { zone: "intl", intlCurrency: "GBP" };
const noEnv = {};

// Catalog
for (const c of COURSES) {
  const lessons = allLessons(c);
  assert(lessonCount(c) === 18 && lessons.length === 18, `${c.title} has 18 lessons`);
  assert(c.modules.length === 5, `${c.title} has 5 modules (start + the four steps)`);
  assert(new Set(lessons.map((l) => l.key)).size === 18 && lessons.every((l) => /^l\d{2}$/.test(l.key)), `${c.title} lesson keys are unique and well formed`);
  assert(lessons.filter((l) => l.preview).length === 1 && lessons[0].preview === true, `${c.title} has exactly one free preview, the first lesson`);
  assert(lessons[17].title.includes("VOLT"), `${c.title} ends with the VOLT plan`);
  assert(!JSON.stringify(c).includes("WOOP"), `${c.title} no longer mentions WOOP`);
}
assert(isPurchasableCourse(BUNDLE_SLUG) && isPurchasableCourse("customer-readiness") && !isPurchasableCourse("membership"), "only real courses and the bundle can be bought");
assert(coursesInPurchase(BUNDLE_SLUG).length === 3, "the bundle contains all three courses");

// Prices (approved Nov 19 2026)
assert(courseListPrice("customer-readiness", africa, noEnv).amount === 49, "Africa course price is $49");
assert(courseListPrice(BUNDLE_SLUG, africa, noEnv).amount === 119, "Africa bundle price is $119");
assert(courseListPrice("investor-readiness", intl, noEnv).amount === 149, "US/UK/EU course price is $149");
assert(courseListPrice(BUNDLE_SLUG, intl, noEnv).amount === 349, "US/UK/EU bundle price is $349");
assert(courseListPrice("customer-readiness", intl, noEnv).currency === "USD", "course prices are always in US dollars");
assert(courseListPrice("customer-readiness", null, noEnv).amount === 149, "an unknown region pays the higher price");

let q = courseQuote("customer-readiness", null, africa, noEnv);
assert(q.charge.amount === 49 && q.discount === 0, "a non-member pays the list price", q);
q = courseQuote("customer-readiness", "essentials", africa, noEnv);
assert(q.charge.amount === 39.2 && q.discount === 9.8 && q.percent === 20, "members of any tier pay 20% less: $39.20", q);
q = courseQuote(BUNDLE_SLUG, "elevate", africa, noEnv);
assert(q.charge.amount === 95.2, "member bundle price is $95.20", q);
q = courseQuote("capital-readiness", "growth", intl, noEnv);
assert(q.charge.amount === 119.2, "member international price is $119.20", q);

assert(courseListPrice("customer-readiness", africa, { PRICE_COURSE: "59" }).amount === 59, "the Africa price can be changed in Vercel");
assert(courseListPrice("customer-readiness", africa, { PRICE_COURSE: "abc" }).amount === 49, "a bad price setting falls back, never to free");
assert(memberDiscountPercent({ COURSE_MEMBER_DISCOUNT_PERCENT: "25" }) === 25, "the member discount can be changed");
assert(memberDiscountPercent({ COURSE_MEMBER_DISCOUNT_PERCENT: "100" }) === 20, "a discount setting that would make courses free is ignored");
assert(courseQuote("customer-readiness", "growth", africa, { COURSE_MEMBER_DISCOUNT_PERCENT: "-5" }).charge.amount === 39.2, "a negative discount setting is ignored");

assert(alreadyOwnsAll("customer-readiness", ["customer-readiness"]), "owning a course blocks buying it again");
assert(!alreadyOwnsAll(BUNDLE_SLUG, ["customer-readiness"]), "owning one course still allows the bundle (it adds the other two)");
assert(alreadyOwnsAll(BUNDLE_SLUG, ["customer-readiness", "capital-readiness", "investor-readiness"]), "owning all three blocks the bundle");

// Payment references
const ref = buildTxRef("course", "11111111-1111-1111-1111-111111111111", 1700000000000);
const parsed = parseTxRef(ref);
assert(parsed?.product === "course" && parsed.founderId === "11111111-1111-1111-1111-111111111111", "course payment references are recognised", parsed);

// VOLT card
const v = sanitizeVolt({ vision: "  Signed contract  ", lever: "x".repeat(900), hack: "<script>", thrust: 5 });
assert(v.vision === "Signed contract" && v.lever?.length === 600 && !("hack" in v) && !("thrust" in v), "VOLT cards keep only the four fields, trimmed and capped", v);
assert(sanitizeEnergy(7) === 7 && sanitizeEnergy("10") === 10 && sanitizeEnergy(0) === null && sanitizeEnergy(11) === null && sanitizeEnergy(5.5) === null, "energy is a whole number from 1 to 10");

// Video links
const id = "1b2c3d4e-0000-4000-8000-1234567890ab";
assert(isVideoId(id) && !isVideoId("../../etc") && !isVideoId(""), "only Bunny video IDs are accepted");
assert(signedEmbedUrl(id, {}) === null, "no video link without hosting settings");
const env = { BUNNY_STREAM_LIBRARY_ID: "12345", BUNNY_STREAM_TOKEN_KEY: "secret-key" };
const now = 1_800_000_000_000;
const url = signedEmbedUrl(id, env, now)!;
const expires = Math.floor(now / 1000) + VIDEO_LINK_SECONDS;
const token = createHash("sha256").update("secret-key" + id + expires).digest("hex");
assert(url.startsWith(`https://iframe.mediadelivery.net/embed/12345/${id}?`) && url.includes(`token=${token}`) && url.includes(`expires=${expires}`), "video links are signed and expire", url);
assert(!url.includes("secret-key"), "the token key never appears in the link");
assert(signedEmbedUrl("not-an-id", env, now) === null, "a bad video ID never produces a link");

console.log(failures ? `\n${failures} course test(s) failed.` : "\nAll course tests passed.");
