import { ImageResponse } from "next/og";
import { headers } from "next/headers";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default async function Icon() {
  const host = headers().get("host") ?? "plantmaxxing.com";
  const protocol = host.includes("localhost") ? "http" : "https";
  const logoUrl = `${protocol}://${host}/logo-plantmaxxing.svg`;

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
          borderRadius: "96px",
          padding: "48px",
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
