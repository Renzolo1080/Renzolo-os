import { ScrollShadow } from "@/components/BrandClient";
import { APP_URL, appLink, WHATSAPP_URL } from "@/lib/site";

/** Header links (approved v6 mockup, Nov 2026). */
const NAV = [
  ["What we do", "/#services"],
  ["Memberships", "/#memberships"],
  ["Pricing", `${APP_URL}/pricing`],
  ["Academy", "/academy/"],
  ["About us", "/about/"],
  ["Partners", "/partners/"],
];

export function Header({ campaign = "header" }: { campaign?: string }) {
  return (
    <header id="site-header" className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur transition-shadow">
      <ScrollShadow />
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-4 md:px-8">
        <a href="/" className="inline-flex shrink-0 items-center gap-2 font-sans text-xl font-bold tracking-[0.06em] text-ink md:gap-3 md:text-2xl md:tracking-[0.08em]">
          <img src="/img/rz-logo.png" alt="" aria-hidden="true" width={43} height={36} className="h-8 w-auto md:h-9" />
          <span>
            RENZOLO<sup className="ml-0.5 text-[0.5em] font-bold">™</sup>
          </span>
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
        <a href={appLink("/snapshot", campaign)} className="shrink-0 rounded-pill bg-brand px-4 py-2.5 text-sm font-bold text-on-brand transition-colors hover:bg-brand/90 md:px-5 md:text-[15px]">
          <span className="sm:hidden">Free Snapshot</span>
          <span className="hidden sm:inline">Start the free Snapshot</span>
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

const FOOT: [string, [string, string][]][] = [
  ["What we do", [["Readiness Assessment", "/#services"], ["Growth planning", "/founder-trajectory/"], ["Founder coaching", "/founder-trajectory/"], ["Buyer and investor matching", "/partners/"]]],
  ["Company", [["About us", "/about/"], ["Partners", "/partners/"], ["Memberships", "/#memberships"], ["Pricing", `${APP_URL}/pricing`], ["Academy", "/academy/"]]],
  ["Get started", [["Free Readiness Snapshot", "/readiness-snapshot/"], ["Log in", `${APP_URL}/login`], ["Talk to our team", "/contact/"]]],
];

export function Footer() {
  return (
    <>
      <footer className="border-t border-line bg-[#F3F5F8] text-ink-muted">
        <div className="mx-auto flex max-w-[1240px] flex-wrap gap-10 px-4 pb-8 pt-16 md:px-8">
          <div className="min-w-0 flex-[2_1_320px]">
            <p className="inline-flex items-center gap-3 font-sans text-[22px] font-bold tracking-[0.08em] text-ink">
              <img src="/img/rz-logo.png" alt="" aria-hidden="true" width={48} height={40} className="h-10 w-auto" />
              RENZOLO™
            </p>
            <p className="mt-4 max-w-[360px] text-base leading-relaxed">A global venture development and capital infrastructure firm, helping founders and CEOs get ready to win.</p>
            <p className="mt-4 text-base">
              <a href="/contact/" className="font-bold text-ink underline underline-offset-4">Talk to our team</a>
            </p>
          </div>
          {FOOT.map(([title, links]) => (
            <div key={title} className="flex min-w-0 flex-[1_1_180px] flex-col gap-2.5">
              <p className="mb-1.5 text-sm font-bold uppercase tracking-[0.14em] text-ink">{title}</p>
              {links.map(([label, href]) => (
                <a key={label} href={href} className="text-base hover:text-ink">
                  {label}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-4 border-t border-line px-4 py-6 text-sm md:px-8">
          <span>RENZOLO™ · Founder Trajectory™ · RENZOLO OS™</span>
          <span className="flex flex-wrap gap-4">
            <a href={`${APP_URL}/privacy`} className="hover:text-ink">Privacy</a>
            <a href={`${APP_URL}/terms`} className="hover:text-ink">Terms</a>
            <a href={`${APP_URL}/refunds`} className="hover:text-ink">Refunds</a>
            {WHATSAPP_URL && <a href={WHATSAPP_URL} className="hover:text-ink">WhatsApp</a>}
          </span>
          <span>© {new Date().getFullYear()} Renzolo Enterprises LLC</span>
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
