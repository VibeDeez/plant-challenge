import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "30 Plants",
    short_name: "30 Plants",
    description:
      "Track your weekly plant diversity and compete with family and friends",
    start_url: "/",
    display: "standalone",
    background_color: "#1a3a2a",
    theme_color: "#1a3a2a",
    icons: [
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
