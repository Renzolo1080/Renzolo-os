import { LegalPage, H, contactEmail } from "@/components/LegalPage";
import { FULL_STATEMENT, MATCHING_STATEMENT_UPDATED, MATCHING_STATEMENT_VERSION } from "@/lib/matching-statement";

export const metadata = { title: "RENZOLO Network™ Matching Statement · Founder Trajectory™" };

export default function MatchingStatementPage() {
  return (
    <LegalPage title="RENZOLO Network™ Matching Statement" updated={MATCHING_STATEMENT_UPDATED}>
      <p className="text-ink-soft">Version {MATCHING_STATEMENT_VERSION} · Renzolo Enterprises LLC, Wisconsin</p>
      {FULL_STATEMENT.map((s, i) => (
        <div key={s.heading}>
          <H>
            {i + 1}. {s.heading}
          </H>
          <p>{s.body}</p>
        </div>
      ))}
      <H>{FULL_STATEMENT.length + 1}. Contact</H>
      <p>Questions about matching: {contactEmail()}.</p>
    </LegalPage>
  );
}
