import { ImageResponse } from "next/og";
import { headers } from "next/headers";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
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
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a3a2a",
          borderRadius: "40px",
        }}
      >
        <img
          src={mascotUrl}
          alt=""
          style={{
            width: 130,
            height: 130,
            objectFit: "contain",
            marginTop: -4,
          }}
        />
        <span
          style={{
            fontSize: "18px",
            fontWeight: 900,
            color: "#22c55e",
            lineHeight: 1,
            marginTop: -8,
            textShadow: "0 2px 0 #15914f",
          }}
        >
          Plantmaxxing
        </span>
      </div>
    ),
    { ...size }
  );
}
