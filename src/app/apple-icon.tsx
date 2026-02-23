import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a3a2a",
          borderRadius: "40px",
        }}
      >
        <span
          style={{
            fontSize: "72px",
            fontWeight: 900,
            color: "#22c55e",
            lineHeight: 1,
            letterSpacing: "-2px",
          }}
        >
          30
        </span>
        <span
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#f5f0e8",
            marginTop: "-2px",
            letterSpacing: "3px",
            textTransform: "uppercase",
          }}
        >
          Plants
        </span>
      </div>
    ),
    { ...size }
  );
}
