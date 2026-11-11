import assert from "node:assert/strict";
import { EXPORT_BY_FOUNDER, INFORMATION_OFFICER, PRIVACY_VERSION, REQUEST_KINDS, REQUEST_LABELS, RESPONSE_DAYS, isRequestKind } from "../lib/privacy";

let passed = 0;
function t(name: string, fn: () => void) {
  fn();
  passed++;
  console.log("PASS:", name);
}

t("every request kind has a label", () => REQUEST_KINDS.forEach((k) => assert.ok(REQUEST_LABELS[k])));
t("known kinds are accepted, others refused", () => {
  assert.ok(isRequestKind("deletion"));
  assert.ok(isRequestKind("score_review"));
  assert.ok(!isRequestKind("drop_tables"));
  assert.ok(!isRequestKind(undefined));
});
t("requests are answered within a month", () => assert.ok(RESPONSE_DAYS <= 30));
t("policy version is a date", () => assert.match(PRIVACY_VERSION, /^\d{4}-\d{2}-\d{2}$/));
t("the export includes privacy requests and payments", () => {
  assert.ok((EXPORT_BY_FOUNDER as readonly string[]).includes("data_requests"));
  assert.ok((EXPORT_BY_FOUNDER as readonly string[]).includes("payments"));
});
t("an Information Officer is named", () => assert.ok(INFORMATION_OFFICER.name.length > 0));
console.log(`\nPrivacy tests completed: ${passed} passed, 0 failed.`);
