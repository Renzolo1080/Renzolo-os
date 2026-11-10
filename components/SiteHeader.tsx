"use client";
import { usePathname } from "next/navigation";

const MEMBER_AREAS = ["/partner", "/dashboard", "/assessment", "/tools", "/advisor", "/report", "/plan", "/market", "/coaching", "/coach", "/ai-coach"];

/** Top bar on every page. Signed-in areas get Dashboard / Tools / Log out;
 * public pages get Log in and the free Snapshot. */
const MEMBER_NAV: [string, string, string[]][] = [
  ["Dashboard", "/dashboard", ["/dashboard"]],
  ["Plan", "/plan", ["/plan"]],
  ["Market", "/market", ["/market"]],
  ["Coaching", "/coaching", ["/coaching", "/coach", "/ai-coach", "/advisor"]],
  ["Tools", "/tools", ["/tools", "/assessment"]],
  ["Membership", "/dashboard/subscribe", ["/dashboard/subscribe"]],
];

/** Top bar on every page, in the website look (approved Nov 9, 2026): white,
 * the colour RZ with RENZOLO OS™, and an orange underline on the current
 * area. Signed-in areas get the member links; public pages get Log in and
 * the free Snapshot. */
export function SiteHeader() {
  const path = usePathname() ?? "/";
  const member = MEMBER_AREAS.some((p) => path === p || path.startsWith(`${p}/`));
  // The longest matching prefix wins, so /dashboard/subscribe is Membership.
  let currentHref = "";
  let bestLen = 0;
  for (const [, href, prefixes] of MEMBER_NAV)
    for (const p of prefixes)
      if ((path === p || path.startsWith(`${p}/`)) && p.length > bestLen) {
        bestLen = p.length;
        currentHref = href;
      }
  const link = "border-b-[3px] py-1.5 transition-colors";
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <a href={member ? "/dashboard" : "/"} className="inline-flex shrink-0 items-center gap-3 text-ink">
          <img src="/img/rz-logo.png" alt="" aria-hidden="true" width={44} height={36} className="h-9 w-auto" />
          <span className="text-lg font-bold tracking-[0.08em]">RENZOLO OS™</span>
        </a>
        {member ? (
          <nav aria-label="Main" className="flex items-center gap-5 overflow-x-auto text-[15px] font-semibold">
            {MEMBER_NAV.map(([label, href], i) => {
              const on = href === currentHref;
              const hide = i === 0 || i === MEMBER_NAV.length - 1 ? "" : i === 4 ? "hidden md:inline" : "hidden sm:inline";
              return (
                <a key={href} href={href} aria-current={on ? "page" : undefined} className={`${link} ${hide} ${on ? "border-brand text-ink" : "border-transparent text-ink-muted hover:text-ink"}`}>
                  {label}
                </a>
              );
            })}
            <form action="/auth/signout" method="post">
              <button type="submit" className="py-1.5 text-ink-muted hover:text-ink">
                Log out
              </button>
            </form>
          </nav>
        ) : (
          <nav aria-label="Main" className="flex items-center gap-5 text-[15px] font-semibold">
            <a href="/programs" className="hidden text-ink-muted hover:text-ink sm:inline">
              Academy
            </a>
            <a href="/free-tools" className="hidden text-ink-muted hover:text-ink md:inline">
              Free tools
            </a>
            <a href="/pricing" className="text-ink-muted hover:text-ink">
              Pricing
            </a>
            <a href="/login" className="text-ink-muted hover:text-ink">
              Log in
            </a>
            <a href="/snapshot" className="hidden rounded-pill bg-brand px-5 py-2.5 font-bold text-on-brand transition-colors hover:bg-brand/90 sm:inline-block">
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
    ["Your data", "/account/data"],
    ["Terms", "/terms"],
    ["Refunds", "/refunds"],
  ];
  return (
    <footer className="border-t border-line bg-surface-tint print:hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          {links.map(([label, href]) => (
            <a key={href} href={href} className="hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
        <span>RENZOLO™ · Founder Trajectory™ · RENZOLO OS™ · © {new Date().getFullYear()} Renzolo Enterprises LLC</span>
      </div>
    </footer>
  );
}
