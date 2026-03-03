import { ImageResponse } from "next/og";
import { headers } from "next/headers";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const host = headers().get("host") ?? "plantmaxxing.com";
  const protocol = host.includes("localhost") ? "http" : "https";
  const logoUrl = `${protocol}://${host}/plantmaxxing-logo-mark-transparent.png`;

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
          padding: "20px",
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
    ),
    { ...size }
  );
}
