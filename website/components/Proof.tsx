import { PROOF_STATEMENT, PROOF_STATS } from "@/lib/story";

/** The track record on a navy panel: the approved statement and figures,
 * in the firm's voice, with no customers or logos. */
export function ProofPanel({ title, regions = false }: { title?: string; regions?: boolean }) {
  return (
    <div className="rounded-panel bg-night px-6 py-14 text-white md:px-14 md:py-20">
      <p className="text-[15px] font-bold uppercase tracking-[0.16em] text-gold">Our track record</p>
      {title ? (
        <>
          <h2 className="mt-3 max-w-[820px] font-display text-[34px] font-bold leading-[1.1] md:text-[48px]">{title}</h2>
          <p className="mt-5 max-w-[820px] text-lg leading-relaxed text-[#C5CDD7] md:text-[19px]">{PROOF_STATEMENT}</p>
        </>
      ) : (
        <p className="mt-4 max-w-[860px] font-display text-[22px] font-bold leading-snug md:text-[26px]">{PROOF_STATEMENT}</p>
      )}
      <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
        {PROOF_STATS.map((p) => (
          <div key={p.figure}>
            <p className="font-display text-[40px] font-bold leading-none md:text-[48px]">{p.figure}</p>
            <p className="mt-2 text-base leading-snug text-[#C5CDD7]">{p.label}</p>
          </div>
        ))}
      </div>
      {regions && (
        <div className="mt-12 flex flex-wrap gap-10 border-t border-white/15 pt-10">
          <Chips label="Where we've worked" items={["Africa", "United Kingdom", "Europe", "United States", "India", "Latin America", "Caribbean"]} />
          <Chips label="Who we've worked alongside" items={["Global corporate buyers", "Supplier development councils", "Accelerators", "Government agencies", "Lenders and investors"]} />
        </div>
      )}
    </div>
  );
}

function Chips({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="min-w-0 flex-[1_1_420px]">
      <p className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-[#C5CDD7]">{label}</p>
      <div className="flex flex-wrap gap-2.5">
        {items.map((i) => (
          <span key={i} className="rounded-pill border border-white/25 px-4 py-2 text-[15px]">
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}
