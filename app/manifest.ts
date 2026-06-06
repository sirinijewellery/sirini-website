import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sirini Jewellery",
    short_name: "Sirini",
    description:
      "Handcrafted Kundan, Meenakari & gold-plated jewellery from Mumbai.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF8F5",
    theme_color: "#5C1A24",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    categories: ["shopping", "lifestyle"],
  };
}
