import { siteConfig } from "@/lib/seo";
import { getBusinessDetails } from "@/lib/queries/site";

export async function LocalBusinessJsonLd() {
  const b = await getBusinessDetails();

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    name: "Sirini Jewellery",
    url: siteConfig.url,
    logo: "https://res.cloudinary.com/dp8a2lvxg/image/upload/e_trim,q_auto,f_png,w_600/sirini-jewellery/logo-real.png",
    image:
      "https://res.cloudinary.com/dp8a2lvxg/image/upload/q_auto,f_auto,w_1200/v1780555156/sirini-jewellery/brand/hero-model.jpg",
    description:
      "Mumbai-based handcrafted fashion jewellery manufacturer specialising in Kundan, Meenakari, Polki and gold-plated necklace sets, earrings, bangles and rings.",
    address: {
      "@type": "PostalAddress",
      streetAddress: b.city,
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
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(localBusinessSchema, null, 2),
      }}
    />
  );
}
