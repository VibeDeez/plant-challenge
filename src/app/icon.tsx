import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a3a2a",
          borderRadius: "6px",
        }}
      >
        <span
          style={{
            fontSize: "18px",
            fontWeight: 900,
            color: "#22c55e",
            lineHeight: 1,
          }}
        >
          30
        </span>
      </div>
    ),
    { ...size }
  );
}
