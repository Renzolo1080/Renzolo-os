import { APP_URL, appLink } from "@/lib/site";

const NAV = [
  ["Founder Trajectory", "/founder-trajectory/"],
  ["Academy", "/academy/"],
  ["About", "/about/"],
  ["Contact", "/contact/"],
];

export function Header({ campaign = "header" }: { campaign?: string }) {
  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
        <a href="/" className="font-display text-xl font-800 tracking-tight" style={{ fontWeight: 800 }}>
          RENZOLO<sup className="ml-0.5 text-[0.55em] font-semibold">™</sup>
        </a>
        <nav aria-label="Main" className="hidden items-center gap-7 text-sm md:flex">
          {NAV.map(([label, href]) => (
            <a key={href} href={href} className="text-mist hover:text-white">
              {label}
            </a>
          ))}
          <a href={`${APP_URL}/login`} className="text-mist hover:text-white">
            Log in
          </a>
        </nav>
        <a href={appLink("/snapshot", campaign)} className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#ad7b24]">
          Free Readiness Snapshot
        </a>
      </div>
      <nav aria-label="Main (mobile)" className="flex gap-5 overflow-x-auto px-5 pb-4 text-sm md:hidden">
        {NAV.map(([label, href]) => (
          <a key={href} href={href} className="shrink-0 text-mist">
            {label}
          </a>
        ))}
        <a href={`${APP_URL}/login`} className="shrink-0 text-mist">
          Log in
        </a>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-navy text-mist">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 text-sm md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <p className="font-display text-lg font-bold text-white">RENZOLO™</p>
          <p className="mt-2 max-w-sm">
            Venture readiness and development for founders and suppliers, launching first in Kenya, South Africa and the United States. Home of Founder Trajectory™, powered by
            RENZOLO OS™.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <a href="/founder-trajectory/" className="hover:text-white">
            Founder Trajectory™
          </a>
          <a href="/academy/" className="hover:text-white">
            Academy
          </a>
          <a href={`${APP_URL}/pricing`} className="hover:text-white">
            Pricing
          </a>
          <a href="/about/" className="hover:text-white">
            About
          </a>
          <a href="/contact/" className="hover:text-white">
            Contact
          </a>
        </div>
        <div className="flex flex-col gap-2">
          <a href={`${APP_URL}/privacy`} className="hover:text-white">
            Privacy policy
          </a>
          <a href={`${APP_URL}/terms`} className="hover:text-white">
            Terms of service
          </a>
          <a href={`${APP_URL}/refunds`} className="hover:text-white">
            Refunds
          </a>
        </div>
      </div>
      <div className="border-t border-panel">
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs">© {new Date().getFullYear()} Renzolo Enterprises LLC, Wisconsin, United States.</p>
      </div>
    </footer>
  );
}
