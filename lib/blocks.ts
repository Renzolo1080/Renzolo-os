import { BLOCK_KEYS, type BlockKey } from "./scoring";

export interface BlockPrompt {
  key: BlockKey;
  label: string;
  currentStatePrompt: string;
  futureStatePrompt: string;
  goalPrompt: string;
}

/** The nine BMC blocks, each paired with a current-state prompt, a
 * future/desired-state prompt, and a bound goal/target prompt — per the
 * Phase 1 Build Specification's Assessment Process section. */
export const BLOCK_PROMPTS: BlockPrompt[] = [
  {
    key: "customerSegments",
    label: "Customer Segments",
    currentStatePrompt: "Who are your customers today? How do you describe the group(s) you currently serve?",
    futureStatePrompt: "Who do you need to be serving in 12 months to hit your growth goals?",
    goalPrompt: "Set a measurable target (e.g. number of paying customers, or a new segment entered) and a date.",
  },
  {
    key: "valueProposition",
    label: "Value Proposition",
    currentStatePrompt: "What problem do you solve, and why do customers choose you today?",
    futureStatePrompt: "What would make your value proposition undeniable to a much larger market?",
    goalPrompt: "Set a measurable target (e.g. a proof point, certification, or differentiator to land) and a date.",
  },
  {
    key: "channels",
    label: "Channels",
    currentStatePrompt: "How do customers currently find you and buy from you?",
    futureStatePrompt: "What channels do you need working reliably to scale distribution?",
    goalPrompt: "Set a measurable target (e.g. a channel live and producing X leads/month) and a date.",
  },
  {
    key: "customerRelationships",
    label: "Customer Relationships",
    currentStatePrompt: "How do you currently acquire, retain, and grow relationships with customers?",
    futureStatePrompt: "What retention or loyalty outcome do you need in 12 months?",
    goalPrompt: "Set a measurable target (e.g. retention rate, NPS, repeat-purchase rate) and a date.",
  },
  {
    key: "revenueStreams",
    label: "Revenue Streams",
    currentStatePrompt: "What are your current revenue streams and their relative size?",
    futureStatePrompt: "What revenue mix and volume do you need to hit your growth targets?",
    goalPrompt: "Set a measurable target (e.g. monthly recurring revenue) and a date.",
  },
  {
    key: "keyResources",
    label: "Key Resources",
    currentStatePrompt: "What people, assets, IP, or capital do you have today?",
    futureStatePrompt: "What resources are missing to execute your plan?",
    goalPrompt: "Set a measurable target (e.g. a hire made, a system in place) and a date.",
  },
  {
    key: "keyActivities",
    label: "Key Activities",
    currentStatePrompt: "What are the most critical activities you run today to deliver your value proposition?",
    futureStatePrompt: "What activities need to change or scale to support growth?",
    goalPrompt: "Set a measurable target (e.g. a process automated or capacity doubled) and a date.",
  },
  {
    key: "keyPartnerships",
    label: "Key Partnerships",
    currentStatePrompt: "Who are your current key partners, suppliers, or allies?",
    futureStatePrompt: "What partnerships do you need to secure to reach the next stage?",
    goalPrompt: "Set a measurable target (e.g. a signed partnership or MOU) and a date.",
  },
  {
    key: "costStructure",
    label: "Cost Structure",
    currentStatePrompt: "What does it currently cost you to acquire and serve a customer?",
    futureStatePrompt: "What cost structure do you need to be sustainable at scale?",
    goalPrompt: "Set a measurable target (e.g. reduce CAC by X% or reach breakeven unit economics) and a date.",
  },
];

export function getBlockPrompt(key: BlockKey): BlockPrompt {
  const found = BLOCK_PROMPTS.find((b) => b.key === key);
  if (!found) throw new Error(`Unknown block key: ${key}`);
  return found;
}

export { BLOCK_KEYS };
