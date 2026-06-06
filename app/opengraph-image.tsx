import { ImageResponse } from "next/og";

// Image metadata
export const alt =
  "Sirini Jewellery — Handcrafted Kundan, Meenakari & Gold-Plated Jewellery, Mumbai, Since 2015";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand palette
const CREAM = "#FFF8F5";
const MAROON = "#5C1A24";
const GOLD = "#C9A96E";

// Image generation
export default async function Image() {
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
          background: MAROON,
          fontFamily: "Georgia, 'Times New Roman', serif",
          position: "relative",
        }}
      >
        {/* Thin gold inner frame */}
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 36,
            right: 36,
            bottom: 36,
            border: `2px solid ${GOLD}`,
            borderRadius: 12,
            display: "flex",
          }}
        />

        {/* Eyebrow rule */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            color: GOLD,
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase",
            marginBottom: 28,
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          Est. 2015 · Mumbai
        </div>

        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            color: GOLD,
            fontSize: 128,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: 2,
            textAlign: "center",
          }}
        >
          Sirini Jewellery
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            color: CREAM,
            fontSize: 34,
            marginTop: 36,
            maxWidth: 940,
            textAlign: "center",
            lineHeight: 1.35,
          }}
        >
          Handcrafted Kundan, Meenakari &amp; Gold-Plated Jewellery
        </div>

        {/* Sub-tagline */}
        <div
          style={{
            display: "flex",
            color: GOLD,
            fontSize: 24,
            marginTop: 14,
            letterSpacing: 3,
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          Mumbai · Since 2015
        </div>

        {/* Domain */}
        <div
          style={{
            display: "flex",
            color: CREAM,
            fontSize: 26,
            marginTop: 54,
            letterSpacing: 4,
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          sirinijewellery.com
        </div>
      </div>
    ),
    { ...size }
  );
}
