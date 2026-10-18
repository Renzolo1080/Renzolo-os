"use client";
import { usePathname } from "next/navigation";

const MEMBER_AREAS = ["/dashboard", "/assessment", "/tools", "/advisor", "/report", "/plan", "/market", "/coaching", "/coach", "/ai-coach"];

/** Top bar on every page. Signed-in areas get Dashboard / Tools / Log out;
 * public pages get Log in and the free Snapshot. */
export function SiteHeader() {
  const path = usePathname() ?? "/";
  const member = MEMBER_AREAS.some((p) => path === p || path.startsWith(`${p}/`));
  return (
    <header className="bg-navy">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <a href={member ? "/dashboard" : "/"} className="leading-tight text-white">
          <span className="block text-lg font-bold tracking-wide">
            Founder Trajectory<span className="text-gold">™</span>
          </span>
          <span className="block text-[11px] text-cream/70">Powered by RENZOLO OS™</span>
        </a>
        {member ? (
          <nav className="flex items-center gap-4 text-sm">
            <a href="/dashboard" className="text-cream hover:text-white">
              Dashboard
            </a>
            <a href="/plan" className="hidden text-cream hover:text-white sm:inline">
              Plan
            </a>
            <a href="/market" className="hidden text-cream hover:text-white sm:inline">
              Market
            </a>
            <a href="/coaching" className="hidden text-cream hover:text-white sm:inline">
              Coaching
            </a>
            <a href="/tools" className="hidden text-cream hover:text-white md:inline">
              Tools
            </a>
            <a href="/dashboard/subscribe" className="text-cream hover:text-white">
              Membership
            </a>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-cream hover:text-white">
                Log out
              </button>
            </form>
          </nav>
        ) : (
          <nav className="flex items-center gap-4 text-sm">
            <a href="/programs" className="hidden text-cream hover:text-white sm:inline">
              Academy
            </a>
            <a href="/pricing" className="text-cream hover:text-white">
              Pricing
            </a>
            <a href="/login" className="text-cream hover:text-white">
              Log in
            </a>
            <a href="/snapshot" className="btn-pop hidden rounded-pill border-2 border-ink bg-brand px-4 py-2 font-semibold text-on-brand sm:inline-block">
              Free Snapshot
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  const links = [
    ["Pricing", "/pricing"],
    ["Academy", "/programs"],
    ["Contact", "/contact"],
    ["Privacy", "/privacy"],
    ["Terms", "/terms"],
    ["Refunds", "/refunds"],
  ];
  return (
    <footer className="border-t border-gray-200 bg-cream print:hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          {links.map(([label, href]) => (
            <a key={href} href={href} className="hover:text-navy">
              {label}
            </a>
          ))}
        </nav>
        <span>Founder Trajectory™ · Powered by RENZOLO OS™ · © {new Date().getFullYear()} Renzolo Enterprises LLC</span>
      </div>
    </footer>
  );
}
