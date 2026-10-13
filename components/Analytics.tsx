"use client";
import { useEffect, useState } from "react";
import Script from "next/script";
import { ATTRIBUTION_COOKIE, ATTRIBUTION_DAYS, attributionFromUrl, decodeAttribution, encodeAttribution } from "@/lib/attribution";

const CONSENT_COOKIE = "rz_consent";

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? m[1] : null;
}

function writeCookie(name: string, value: string, days: number) {
  const host = window.location.hostname;
  // Shared between renzoloenterprises.com and app.renzoloenterprises.com.
  const domain = host.endsWith("renzoloenterprises.com") ? "; domain=.renzoloenterprises.com" : "";
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${name}=${value}; path=/; max-age=${days * 86400}; samesite=lax${domain}${secure}`;
}

/** Records where a visitor came from (first visit wins; a referral code
 * is added if one arrives later), asks for analytics consent, and loads
 * Google Analytics / the Meta Pixel only after the visitor accepts. */
export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const [consent, setConsent] = useState<"granted" | "denied" | null | "unknown">("unknown");

  useEffect(() => {
    try {
      const fresh = attributionFromUrl(window.location.search, window.location.pathname, document.referrer || null);
      const existing = decodeAttribution(readCookie(ATTRIBUTION_COOKIE));
      if (fresh && !existing) writeCookie(ATTRIBUTION_COOKIE, encodeAttribution(fresh), ATTRIBUTION_DAYS);
      else if (fresh?.ref && existing && !existing.ref) writeCookie(ATTRIBUTION_COOKIE, encodeAttribution({ ...existing, ref: fresh.ref }), ATTRIBUTION_DAYS);
      const c = readCookie(CONSENT_COOKIE);
      setConsent(c === "granted" || c === "denied" ? c : null);
    } catch {
      setConsent(null);
    }
  }, []);

  const choose = (value: "granted" | "denied") => {
    writeCookie(CONSENT_COOKIE, value, 365);
    setConsent(value);
  };

  const anyTool = !!gaId || !!pixelId;
  return (
    <>
      {consent === "granted" && gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {consent === "granted" && pixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
        </Script>
      )}
      {anyTool && consent === null && (
        <div role="dialog" aria-label="Cookie choices" className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white p-4 shadow-lg print:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-ink">
              We use analytics cookies to see which pages and posts help founders, so we can improve them. No names or answers are shared.{" "}
              <a href="/privacy#cookies" className="text-teal underline">
                Learn more
              </a>
            </p>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => choose("denied")} className="rounded-lg border border-navy px-4 py-2 font-semibold text-navy">
                No thanks
              </button>
              <button type="button" onClick={() => choose("granted")} className="rounded-lg bg-navy px-4 py-2 font-semibold text-white">
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
