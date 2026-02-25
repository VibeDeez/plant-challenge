import { ImageResponse } from "next/og";
import { headers } from "next/headers";

export const alt = "Plantmaxxing — Become unmoggable";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const host = headers().get("host") ?? "plantmaxxing.com";
  const protocol = host.includes("localhost") ? "http" : "https";
  const mascotUrl = `${protocol}://${host}/illustrations/character-carrot.png`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
          background:
            "radial-gradient(circle at 50% 36%, #1c6f4f 0%, #114735 46%, #0a201a 100%)",
          padding: "40px 64px",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 120,
              fontWeight: 900,
              color: "#22c55e",
              lineHeight: 1,
              letterSpacing: "-1px",
              textShadow:
                "0 6px 0 #15914f, 0 12px 0 #118347, 0 18px 0 #0e6f3d, 0 24px 18px rgba(3, 35, 22, 0.75)",
            }}
          >
            Plantmaxxing
          </span>
        </div>

        <img
          src={mascotUrl}
          alt="Buff carrot mascot flexing"
          style={{
            width: 470,
            height: 470,
            objectFit: "contain",
            marginTop: 8,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
