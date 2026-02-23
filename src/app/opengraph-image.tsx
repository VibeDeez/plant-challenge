import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "30 Plant Point Challenge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1a3a2a",
          padding: "60px 80px",
        }}
      >
        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span
            style={{
              fontSize: 120,
              fontWeight: 900,
              color: "#22c55e",
              lineHeight: 0.9,
              letterSpacing: "-2px",
            }}
          >
            30 Plants.
          </span>
          <span
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: "#f5f0e8",
              lineHeight: 1.1,
            }}
          >
            That&apos;s it.
          </span>
        </div>

        {/* Subtitle */}
        <span
          style={{
            fontSize: 28,
            color: "rgba(245, 240, 232, 0.5)",
            marginTop: 40,
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.5,
          }}
        >
          Track your weekly plant diversity. Feed your gut. Transform your
          health.
        </span>
      </div>
    ),
    { ...size }
  );
}
