import { ImageResponse } from "next/og";
import { headers } from "next/headers";

export const alt = "Plantmaxxing logo on dark green background";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const host = headers().get("host") ?? "plantmaxxing.com";
  const protocol = host.includes("localhost") ? "http" : "https";
  const logoUrl = `${protocol}://${host}/plantmaxxing-logo-lockup-transparent.png`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background:
            "radial-gradient(circle at 50% 36%, #1c6f4f 0%, #114735 46%, #0a201a 100%)",
          padding: "48px 64px",
          position: "relative",
        }}
      >
        <div
          style={{
            width: 760,
            height: 520,
            borderRadius: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(10, 32, 26, 0.35)",
            border: "1px solid rgba(245, 240, 232, 0.14)",
            boxShadow: "0 30px 80px rgba(3, 20, 14, 0.45)",
            padding: 72,
          }}
        >
          <img
            src={logoUrl}
            alt="Plantmaxxing logo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
