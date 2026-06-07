import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PawLink Rescue",
    short_name: "PawLink",
    description: "AI-powered animal rescue intake — capture, identify, reunite.",
    theme_color: "#1B9C8F",
    background_color: "#1F2A37",
    display: "standalone",
    start_url: "/intake",
    scope: "/",
    icons: [
      // Placeholder SVG mark (scales to any size). Add rasterized PNGs later for iOS.
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "192x192", type: "image/svg+xml", purpose: "maskable" },
      { src: "/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
