import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** The branded preview image shown when a link is shared on WhatsApp,
 * LinkedIn, Facebook or X. */
export function brandImage(opts: { eyebrow: string; title: string; subtitle?: string; big?: string; bigLabel?: string }) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#071727", padding: 72, color: "#ffffff", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 26, letterSpacing: 4, color: "#C18B2C", textTransform: "uppercase", fontWeight: 700 }}>{opts.eyebrow}</div>
          <div style={{ display: "flex", alignItems: "flex-end", marginTop: 28 }}>
            {opts.big ? (
              <div style={{ display: "flex", flexDirection: "column", marginRight: 48 }}>
                <div style={{ fontSize: 170, fontWeight: 800, lineHeight: 1 }}>{opts.big}</div>
                {opts.bigLabel ? <div style={{ fontSize: 30, color: "#C18B2C", fontWeight: 700, marginTop: 8 }}>{opts.bigLabel}</div> : null}
              </div>
            ) : null}
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ fontSize: opts.big ? 52 : 68, fontWeight: 800, lineHeight: 1.1 }}>{opts.title}</div>
              {opts.subtitle ? <div style={{ fontSize: 30, color: "#d9dee3", marginTop: 20, lineHeight: 1.3 }}>{opts.subtitle}</div> : null}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px solid #C18B2C", paddingTop: 24 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, fontWeight: 800 }}>Founder Trajectory™</div>
            <div style={{ fontSize: 22, color: "#d9dee3" }}>Powered by RENZOLO OS™</div>
          </div>
          <div style={{ fontSize: 26, background: "#C18B2C", color: "#ffffff", padding: "14px 28px", borderRadius: 12, fontWeight: 700 }}>Free Readiness Snapshot</div>
        </div>
      </div>
    ),
    OG_SIZE
  );
}
