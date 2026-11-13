import { ImageResponse } from "next/og";
export const alt = "Buildo — Imagine it. Build it. Explore it.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#f8f7f3",
        padding: "70px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        color: "#27342b",
      }}
    >
      <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>
        buildo<span style={{ color: "#df643d" }}>.</span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 80,
          fontWeight: 600,
          letterSpacing: "-4px",
          lineHeight: 1.1,
        }}
      >
        <span>Your ideas. Your space.</span>
        <span style={{ color: "#cd502a" }}>Built by you.</span>
      </div>
      <div style={{ display: "flex", fontSize: 25, color: "#64745a" }}>
        Imagine it. Build it. Explore it.
      </div>
    </div>,
    size,
  );
}
