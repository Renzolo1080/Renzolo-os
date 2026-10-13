/** Simple top bar for public pages. */
export function SiteHeader() {
  return (
    <header className="bg-navy">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <a href="/" className="text-lg font-bold tracking-wide text-white">
          RENZOLO<span className="text-gold"> OS</span>
          <sup className="text-[10px] text-cream/70">™</sup>
        </a>
        <nav className="flex items-center gap-4 text-sm">
          <a href="/login" className="text-cream hover:text-white">
            Log in
          </a>
          <a href="/snapshot" className="hidden rounded-lg bg-gold px-4 py-2 font-semibold text-white sm:inline-block">
            Free Snapshot
          </a>
        </nav>
      </div>
    </header>
  );
}
