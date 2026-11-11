import { appLink } from "@/lib/site";
import { Price } from "@/components/RegionPrice";

/** The one-time Readiness Assessment, shown beside the memberships so it is
 * a first choice, not an afterthought (approved Nov 10, 2026: sell paid
 * assessments and memberships first, ahead of the 2027 accelerators). */
export function AssessmentOffer({ campaign, className = "" }: { campaign: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-6 rounded-[24px] border-2 border-brand bg-white p-7 md:flex-row md:items-center md:justify-between md:p-9 ${className}`}>
      <div className="min-w-0 max-w-[720px]">
        <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-brand-text">One-time · no membership needed</p>
        <h3 className="mt-2 font-sans text-[26px] font-bold leading-tight md:text-[30px]">Readiness Assessment</h3>
        <p className="mt-2 text-base leading-relaxed text-ink-muted md:text-[17px]">
          Your full assessment and downloadable AI Readiness Report: readiness scores, an AI market insight for your industry
          and country, and the membership that fits you. Join within 30 days and it carries straight into your membership.
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
        <p className="font-display text-[52px] font-bold leading-none">
          <Price k="assessment" /> <span className="font-sans text-base font-normal text-ink-muted">one time</span>
        </p>
        <a href={appLink("/register", campaign)} className="inline-flex min-h-[48px] items-center rounded-pill bg-brand px-7 py-3.5 text-[17px] font-bold text-on-brand hover:bg-brand/90">
          Buy the assessment · <Price k="assessment" />
        </a>
      </div>
    </div>
  );
}
