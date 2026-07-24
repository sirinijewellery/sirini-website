import { siteConfig } from "@/lib/seo";
import { getBusinessDetails } from "@/lib/queries/site";

export async function LocalBusinessJsonLd() {
  const b = await getBusinessDetails();

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    // Same graph id as OrganizationJsonLd — a JewelryStore IS an Organization,
    // so sharing the id lets consumers merge this store (geo, priceRange,
    // opening hours) with the Organization node (foundingDate, contactPoint)
    // into a single, richer Sirini Jewellery entity rather than two rival ones.
    "@id": `${siteConfig.url}/#organization`,
    name: "Sirini Jewellery",
    url: siteConfig.url,
    logo: siteConfig.logo,
    image:
      "https://res.cloudinary.com/dp8a2lvxg/image/upload/q_auto,f_auto,w_1200/v1780555156/sirini-jewellery/brand/hero-model.jpg",
    description:
      "Mumbai-based handcrafted fashion jewellery manufacturer specialising in Kundan, Meenakari, Polki and gold-plated necklace sets, earrings, bangles and rings.",
    address: {
      "@type": "PostalAddress",
      // No street-address field exists in BusinessDetails — omit rather than
      // duplicate addressLocality into it (schema.org doesn't require it).
      addressLocality: b.city,
      addressRegion: b.region,
      postalCode: b.postalCode,
      addressCountry: b.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 19.076,
      longitude: 72.8777,
    },
    telephone: b.phone,
    email: b.email,
    priceRange: "₹₹",
    openingHours: b.openingHours,
    sameAs: [b.instagramUrl, b.justdialUrl].filter(Boolean),
  };

  return (
    <script
      type="application/ld+json"
      // Escape "<" so admin-edited business details can't break out of the
      // script tag via "</script>" — prevents stored XSS.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(localBusinessSchema, null, 2).replace(/</g, "\\u003c"),
      }}
    />
  );
}
