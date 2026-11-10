/** The approved zooming hero (Nov 2026): full-width colour bursts that fade
 * and slowly zoom, with the message centred over them. Styles in globals.css. */
const SLIDES: [string, string][] = [
  ["/img/burst-bright.jpg", "30% 40%"],
  ["/img/burst-dark.jpg", "70% 60%"],
  ["/img/burst-bright.jpg", "60% 30%"],
];

export function HeroZoom({ eyebrow, title, subtitle, intro, minHeight = "min-h-[560px] md:min-h-[680px]", children }: { eyebrow: string; title: React.ReactNode; subtitle?: React.ReactNode; intro: string; minHeight?: string; children?: React.ReactNode }) {
  return (
    <section className={`relative flex overflow-hidden bg-black ${minHeight}`}>
      <div aria-hidden="true" className="absolute inset-0">
        {SLIDES.map(([src, origin], i) => (
          <div key={i} className="zoom-slide">
            <img src={src} alt="" style={{ transformOrigin: origin, scale: i === 2 ? "-1 1" : undefined }} />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(7,23,39,0.6)_0%,rgba(7,23,39,0.25)_55%,rgba(7,23,39,0.05)_100%)]" />
      <div className="relative mx-auto flex max-w-[980px] flex-1 flex-col items-center justify-center px-4 py-20 text-center text-white md:px-6">
        <p className="text-[13px] font-bold uppercase tracking-[0.2em] [text-shadow:0_1px_12px_rgba(0,0,0,0.6)] md:text-[15px]">{eyebrow}</p>
        <h1 className="mt-4 font-display text-[40px] font-bold leading-[1.08] [text-shadow:0_2px_24px_rgba(0,0,0,0.55)] md:text-[56px]">
          <span className="block md:whitespace-nowrap">{title}</span>
          {subtitle && <span className="mt-3 block text-[22px] font-semibold leading-snug md:text-[30px]">{subtitle}</span>}
        </h1>
        <p className="mt-5 max-w-[680px] text-lg leading-relaxed [text-shadow:0_1px_12px_rgba(0,0,0,0.6)] md:text-[21px]">{intro}</p>
        {children}
      </div>
    </section>
  );
}
