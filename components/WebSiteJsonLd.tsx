// components/WebSiteJsonLd.tsx
// Server component — no "use client"
// WebSite schema with SearchAction for Google Sitelinks Search Box

export function WebSiteJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sirinijewellery.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Sirini Jewellery",
    alternateName: "Sirini",
    url: siteUrl,
    description: "Handcrafted Kundan, Meenakari and gold-plated fashion jewellery from Mumbai. Shop necklace sets, earrings, bangles, rings and anklets.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
