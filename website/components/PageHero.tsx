import { DotGrid, Glow } from "@/components/Visuals";

export function PageHero({ title, intro, children }: { title: string; intro: string; children?: React.ReactNode }) {
  return (
    <section data-theme="dark" className="relative overflow-hidden bg-night text-ink">
      <DotGrid />
      <Glow />
      <div className="relative mx-auto max-w-[1200px] px-4 md:px-8 pb-16 pt-10 md:pt-16">
        <h1 className="max-w-4xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl" style={{ fontWeight: 800 }}>
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">{intro}</p>
        {children}
      </div>
    </section>
  );
}
