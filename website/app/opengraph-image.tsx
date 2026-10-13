import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "RENZOLO: know where your venture stands, then move it forward";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#071727", padding: 72, color: "#ffffff" }}>
        <div style={{ fontSize: 34, fontWeight: 800 }}>RENZOLO</div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>Know where your venture stands. Then move it forward.</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 28, color: "#C9D3DC" }}>Home of Founder Trajectory™</div>
          <div style={{ fontSize: 26, background: "#C18B2C", padding: "14px 28px", borderRadius: 999, fontWeight: 700 }}>Free Readiness Snapshot</div>
        </div>
      </div>
    ),
    size
  );
}
