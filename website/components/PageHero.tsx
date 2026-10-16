import { Glow } from "@/components/Visuals";

export function PageHero({ title, intro, children }: { title: string; intro: string; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <Glow />
      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-10 md:pt-16">
        <h1 className="max-w-4xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl" style={{ fontWeight: 800 }}>
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">{intro}</p>
        {children}
      </div>
    </section>
  );
}
