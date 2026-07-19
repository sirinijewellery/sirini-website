// components/WebSiteJsonLd.tsx
// Server component — no "use client"
// WebSite schema with SearchAction for Google Sitelinks Search Box

import { SITE_URL } from "@/lib/seo";

export function WebSiteJsonLd() {
  const siteUrl = SITE_URL;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "Sirini Jewellery",
    alternateName: "Sirini",
    url: siteUrl,
    description: "Handcrafted Kundan, Meenakari and gold-plated fashion jewellery from Mumbai. Shop necklace sets, earrings, bangles, rings and anklets.",
    inLanguage: "en-IN",
    // Ties the site to the shared Organization entity (same id used by the
    // Organization + JewelryStore nodes) so the whole graph resolves to one brand.
    publisher: { "@id": `${siteUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/shop?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      // Escape "<" for consistency with other JSON-LD components — no DB
      // content here today, but prevents future stored XSS if this ever
      // reads admin-editable values.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
    />
  );
}
