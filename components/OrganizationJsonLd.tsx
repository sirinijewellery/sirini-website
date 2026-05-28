/** Site-wide Organization schema — renders in <head> via layout or homepage */
export function OrganizationJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Sirini Jewellery",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description:
      "Handcrafted fashion jewellery brand based in Mumbai, India. Specialising in Kundan, Meenakari, and gold-plated jewellery for everyday wear, gifting, and bridal occasions.",
    foundingDate: "2015",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Mumbai",
      addressRegion: "Maharashtra",
      addressCountry: "IN",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        availableLanguage: ["English", "Hindi"],
        url: `${siteUrl}/contact`,
      },
    ],
    sameAs: [
      // Add actual social profile URLs here once available
      // "https://www.instagram.com/sirinijewellery",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
