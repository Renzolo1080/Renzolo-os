import { STAGES, COUNTRIES } from "./quickcheck";

/** Validation for the public forms (cohort applications, contact). */

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export const CONTACT_TOPICS = ["General question", "Partnership", "Media", "Support with my account", "Cohorts and the Academy"] as const;

export type CohortChoice = "foundations" | "growth" | "elevate";

export function parseCohortApplication(b: any):
  | { ok: true; value: { fullName: string; email: string; company: string; country: string; ventureStage: string; cohort: CohortChoice; message: string } }
  | { ok: false; error: string } {
  if (str(b?.website, 200)) return { ok: false, error: "spam" }; // honeypot
  const fullName = str(b?.fullName, 120);
  const email = str(b?.email, 254).toLowerCase();
  const cohort: CohortChoice | null = b?.cohort === "foundations" || b?.cohort === "growth" || b?.cohort === "elevate" ? b.cohort : null;
  if (!fullName) return { ok: false, error: "Please enter your name." };
  if (!emailOk(email)) return { ok: false, error: "Please enter a valid email address." };
  if (!cohort) return { ok: false, error: "Please choose a cohort." };
  const country = (COUNTRIES as readonly string[]).includes(b?.country) ? b.country : "";
  const ventureStage = (STAGES as readonly string[]).includes(b?.ventureStage) ? b.ventureStage : "";
  return { ok: true, value: { fullName, email, company: str(b?.company, 160), country, ventureStage, cohort, message: str(b?.message, 2000) } };
}

export function parseContact(b: any):
  | { ok: true; value: { fullName: string; email: string; company: string; topic: string; message: string } }
  | { ok: false; error: string } {
  if (str(b?.website, 200)) return { ok: false, error: "spam" };
  const fullName = str(b?.fullName, 120);
  const email = str(b?.email, 254).toLowerCase();
  const topic = (CONTACT_TOPICS as readonly string[]).includes(b?.topic) ? b.topic : null;
  const message = str(b?.message, 4000);
  if (!fullName) return { ok: false, error: "Please enter your name." };
  if (!emailOk(email)) return { ok: false, error: "Please enter a valid email address." };
  if (!topic) return { ok: false, error: "Please choose a topic." };
  if (message.length < 5) return { ok: false, error: "Please write a short message." };
  return { ok: true, value: { fullName, email, company: str(b?.company, 160), topic, message } };
}
