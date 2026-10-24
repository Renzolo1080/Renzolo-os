import { ScrollShadow } from "@/components/BrandClient";
import { APP_URL, appLink, WHATSAPP_URL } from "@/lib/site";

/** Header links, per the brand book's page flow. */
const NAV = [
  ["Founder Trajectory™", "/founder-trajectory/"],
  ["Academy", "/academy/"],
  ["Pricing", "/#pricing"],
];

/** "Track record" menu: the proof, gathered in one place. */
const TRACK = [
  ["Lorenzo's experience", "/about/#proof", "20+ years, 800+ founders, 19 countries"],
  ["Expertise", "/about/#expertise", "What every assessment draws on"],
  ["Why RENZOLO", "/#why", "Five reasons, each with its proof"],
  ["Founder story", "/about/", "Why Lorenzo built RENZOLO"],
];

function TrackRecordMenu() {
  return (
    <div className="group relative">
      <a href="/about/#proof" className="inline-flex items-center gap-1 text-ink-muted hover:text-ink group-focus-within:text-ink" aria-haspopup="true">
        Track record
        <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3 transition-transform group-hover:rotate-180 group-focus-within:rotate-180"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </a>
      <div className="invisible absolute left-1/2 top-full z-40 w-72 -translate-x-1/2 pt-3 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <ul className="rounded-card border border-line bg-surface p-2 shadow-soft">
          {TRACK.map(([label, href, note]) => (
            <li key={href}>
              <a href={href} className="block rounded-[12px] px-3 py-2.5 hover:bg-surface-tint">
                <span className="block text-[15px] font-semibold text-ink">{label}</span>
                <span className="block text-xs text-ink-muted">{note}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Header({ campaign = "header" }: { campaign?: string }) {
  return (
    <header id="site-header" className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur transition-shadow">
      <ScrollShadow />
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-4 md:px-8">
        <a href="/" className="font-display text-xl font-extrabold tracking-[-0.01em] text-ink">
          RENZOLO<sup className="ml-0.5 text-[0.55em] font-extrabold text-black">™</sup>
        </a>
        <nav aria-label="Main" className="hidden items-center gap-7 text-[15px] font-medium lg:flex">
          {NAV.map(([label, href]) => (
            <a key={href} href={href} className="text-ink-muted hover:text-ink">
              {label}
            </a>
          ))}
          <TrackRecordMenu />
          <a href={`${APP_URL}/login`} className="text-ink-muted hover:text-ink">
            Log in
          </a>
        </nav>
        <a href={appLink("/snapshot", campaign)} className="rounded-pill bg-ink px-5 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-ink/85">
          Start your assessment
        </a>
      </div>
      <nav aria-label="Main (mobile)" className="flex gap-5 overflow-x-auto px-4 pb-3 text-sm font-medium lg:hidden">
        {NAV.map(([label, href]) => (
          <a key={href} href={href} className="shrink-0 text-ink-muted">
            {label}
          </a>
        ))}
        <a href="/about/#proof" className="shrink-0 text-ink-muted">
          Track record
        </a>
        <a href={`${APP_URL}/login`} className="shrink-0 text-ink-muted">
          Log in
        </a>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <>
      <footer data-theme="dark" className="bg-night text-ink-muted">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-16 text-sm md:grid-cols-[2fr_1fr_1fr_1fr] md:px-8">
          <div>
            <p className="font-display text-lg font-extrabold text-ink">RENZOLO™</p>
            <p className="mt-2 max-w-sm">
              Customer, capital and investor readiness for founders across Africa, starting in South Africa and Kenya. Home of Founder Trajectory™, powered by RENZOLO OS™.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <a href="/founder-trajectory/" className="hover:text-ink">Founder Trajectory™</a>
            <a href="/#os" className="hover:text-ink">RENZOLO OS™</a>
            <a href="/academy/" className="hover:text-ink">Academy</a>
            <a href="/#pricing" className="hover:text-ink">Pricing</a>
            <a href="/about/" className="hover:text-ink">About</a>
          </div>
          <div className="flex flex-col gap-2">
            <a href="/contact/" className="hover:text-ink">Contact us</a>
            {WHATSAPP_URL && <a href={WHATSAPP_URL} className="hover:text-ink">WhatsApp</a>}
            <a href={`${APP_URL}/login`} className="hover:text-ink">Log in</a>
          </div>
          <div className="flex flex-col gap-2">
            <a href={`${APP_URL}/privacy`} className="hover:text-ink">Privacy policy</a>
            <a href={`${APP_URL}/terms`} className="hover:text-ink">Terms of service</a>
            <a href={`${APP_URL}/refunds`} className="hover:text-ink">Refunds</a>
          </div>
        </div>
        <div className="border-t border-line">
          <p className="mx-auto max-w-[1200px] px-4 py-5 text-xs md:px-8">© {new Date().getFullYear()} Renzolo Enterprises LLC, Wisconsin, United States.</p>
        </div>
      </footer>
      {WHATSAPP_URL && (
        <a
          href={WHATSAPP_URL}
          aria-label="Chat with us on WhatsApp"
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-pill bg-teal text-on-teal shadow-soft md:bottom-6"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          </svg>
        </a>
      )}
    </>
  );
}
