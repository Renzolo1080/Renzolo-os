import { ScrollShadow } from "@/components/BrandClient";
import { APP_URL, appLink, WHATSAPP_URL } from "@/lib/site";

/** Header links, per the brand book's page flow. */
const NAV = [
  ["Founder Trajectory™", "/founder-trajectory/"],
  ["RENZOLO OS™", "/#os"],
  ["Academy", "/academy/"],
  ["Pricing", "/#pricing"],
];

export function Header({ campaign = "header" }: { campaign?: string }) {
  return (
    <header id="site-header" className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur transition-shadow">
      <ScrollShadow />
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-4 md:px-8">
        <a href="/" className="font-display text-xl font-extrabold tracking-[-0.01em] text-ink">
          RENZOLO<sup className="ml-0.5 text-[0.55em] font-semibold">™</sup>
        </a>
        <nav aria-label="Main" className="hidden items-center gap-7 text-[15px] font-medium lg:flex">
          {NAV.map(([label, href]) => (
            <a key={href} href={href} className="text-ink-muted hover:text-ink">
              {label}
            </a>
          ))}
          <a href={`${APP_URL}/login`} className="text-ink-muted hover:text-ink">
            Log in
          </a>
        </nav>
        <a href={appLink("/snapshot", campaign)} className="btn-pop rounded-pill border-2 border-ink bg-brand px-5 py-2 text-sm font-semibold text-on-brand">
          Start your assessment
        </a>
      </div>
      <nav aria-label="Main (mobile)" className="flex gap-5 overflow-x-auto px-4 pb-3 text-sm font-medium lg:hidden">
        {NAV.map(([label, href]) => (
          <a key={href} href={href} className="shrink-0 text-ink-muted">
            {label}
          </a>
        ))}
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
