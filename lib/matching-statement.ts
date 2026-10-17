/** The RENZOLO Network™ Matching Statement: the short concept statement
 * every founder acknowledges, the full statement it links to, and the rule
 * for when a founder must acknowledge it again.
 *
 * Founders acknowledge it when they add the Matching add-on. Changing the
 * full statement means raising MATCHING_STATEMENT_VERSION: every founder
 * with the add-on whose acknowledgment is for an older version is then
 * asked again on their next visit to the dashboard. The text is a draft
 * for legal review. */

export const MATCHING_STATEMENT_KEY = "matching" as const;
export const MATCHING_STATEMENT_VERSION = "1.0";
export const MATCHING_STATEMENT_UPDATED = "16 October 2026";
export const MATCHING_STATEMENT_PATH = "/matching-statement";

export const CONCEPT_TITLE = "RENZOLO Network™ Matching";
export const CONCEPT_PARAGRAPHS = [
  "Matching is an optional add-on service. When you subscribe, the RENZOLO team reviews your RENZOLO OS™ profile and readiness scores, suggests customer, capital and investor opportunities that fit your business, and, with your permission, introduces you to the organizations behind them.",
  "Introductions do not guarantee any contract, loan, grant, investment or other result. RENZOLO is not a lender, broker-dealer, investment adviser or placement agent and does not give legal, tax or investment advice. We share your profile only with your consent for each introduction, and you can withdraw consent at any time.",
];

export type StatementSection = { heading: string; body: string };

export const FULL_STATEMENT: StatementSection[] = [
  {
    heading: "What the service is",
    body: "RENZOLO Network™ Matching is an optional, paid add-on to RENZOLO OS™. The RENZOLO team reviews your profile and readiness scores, suggests opportunities with corporate buyers, lenders, grant makers, investors and partners, and may introduce you to them.",
  },
  {
    heading: "Eligibility",
    body: "You need a completed RENZOLO OS™ assessment. Opportunity providers set their own criteria, and RENZOLO may decline to suggest or introduce any match.",
  },
  {
    heading: "Fees",
    body: "The add-on is billed monthly, separately from any membership, in US dollars. A success fee on won, funded or closed outcomes may be introduced later. Its terms are to be determined, and no success fee will apply unless you sign a separate written agreement first.",
  },
  {
    heading: "No guarantee",
    body: "RENZOLO does not promise any introduction, contract, loan, grant, investment or other result. Opportunity providers make their own decisions.",
  },
  {
    heading: "Not financial, legal or investment advice",
    body: "RENZOLO is not a lender, bank, broker-dealer, investment adviser, placement agent or law firm. It does not negotiate terms, hold funds, or advise on whether to accept an offer. Get your own professional advice.",
  },
  {
    heading: "Your information and consent",
    body: "RENZOLO shares your profile with an opportunity provider only after you agree to that specific introduction. You can withdraw consent at any time for future introductions. Your data is handled under applicable law, including South Africa's Protection of Personal Information Act and Kenya's Data Protection Act.",
  },
  {
    heading: "Your responsibilities",
    body: "Keep your profile accurate and current, and do your own checks on any opportunity provider before you sign anything or share money.",
  },
  {
    heading: "Opportunity providers",
    body: "Providers are independent. RENZOLO verifies listings before opening them but is not responsible for a provider's actions, offers or decisions.",
  },
  {
    heading: "Confidentiality",
    body: "RENZOLO keeps your assessment results confidential and asks providers to treat shared profiles confidentially.",
  },
  {
    heading: "Cancelling",
    body: "You can cancel the add-on at any time. It ends at the close of the current billing month. Introductions already made stay between you and the provider.",
  },
  {
    heading: "Changes",
    body: "When this statement changes, its version number rises and you will be asked to acknowledge it again at your next login.",
  },
];

/** Whether a founder must acknowledge the current statement now.
 *
 * Only founders with the Matching add-on are ever asked. They acknowledge
 * at checkout when they add it, and again at login only when the statement
 * has changed since.
 *
 * - "not-needed": no Matching add-on, so the statement doesn't apply.
 * - "acknowledged": they have a row for the current version.
 * - "ask": send them to the acknowledgment step. */
export type AckDecision = { kind: "not-needed" } | { kind: "acknowledged" } | { kind: "ask" };

export function decideAcknowledgment(savedVersions: string[], hasMatchingAddOn: boolean): AckDecision {
  if (!hasMatchingAddOn) return { kind: "not-needed" };
  if (savedVersions.includes(MATCHING_STATEMENT_VERSION)) return { kind: "acknowledged" };
  return { kind: "ask" };
}

/** Where an acknowledgment was given. */
export type AckSource = "checkout" | "login";
export const ACK_SOURCES: readonly AckSource[] = ["checkout", "login"];
