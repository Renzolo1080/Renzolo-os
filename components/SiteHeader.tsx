"use client";
import { usePathname } from "next/navigation";

const MEMBER_AREAS = ["/dashboard", "/assessment", "/tools", "/advisor", "/report"];

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
            <a href="/tools" className="hidden text-cream hover:text-white sm:inline">
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
            <a href="/pricing" className="text-cream hover:text-white">
              Pricing
            </a>
            <a href="/login" className="text-cream hover:text-white">
              Log in
            </a>
            <a href="/snapshot" className="hidden rounded-lg bg-gold px-4 py-2 font-semibold text-white sm:inline-block">
              Free Snapshot
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-ink-soft sm:flex-row sm:justify-between sm:px-6">
        <span>Founder Trajectory™ · Powered by RENZOLO OS™</span>
        <span>© {new Date().getFullYear()} Renzolo Enterprises LLC</span>
      </div>
    </footer>
  );
}
