/** Inner-page hero in the v5 look: a navy rounded panel with the bright
 * colour burst fading in from the right. */
export function PageHero({ title, intro, children }: { title: string; intro: string; children?: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-[1240px] px-4 pt-8 md:px-8 md:pt-10">
      <div data-theme="dark" className="relative overflow-hidden rounded-panel bg-night px-6 py-14 text-ink md:px-14 md:py-20">
        <img
          src="/img/burst-bright.jpg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-48 top-1/2 hidden h-[600px] w-[600px] -translate-y-1/2 object-cover opacity-90 [mask-image:radial-gradient(circle,#000_35%,transparent_70%)] md:block"
        />
        <div className="relative max-w-3xl">
          <h1 className="font-display text-[38px] font-bold leading-[1.08] md:text-[56px]">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">{intro}</p>
          {children}
        </div>
      </div>
    </section>
  );
}
