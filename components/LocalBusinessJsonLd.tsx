import { siteConfig } from "@/lib/seo";

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "JewelryStore",
  name: "Sirini Jewellery",
  url: siteConfig.url,
  logo: "https://res.cloudinary.com/dp8a2lvxg/image/upload/q_auto,f_auto/sirini-jewellery/logo.png",
  image:
    "https://res.cloudinary.com/dp8a2lvxg/image/upload/q_auto,f_auto,w_1200/v1780555156/sirini-jewellery/brand/hero-model.jpg",
  description:
    "Mumbai-based handcrafted fashion jewellery manufacturer specialising in Kundan, Meenakari, Polki and gold-plated necklace sets, earrings, bangles and rings.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Mumbai",
    addressLocality: "Mumbai",
    addressRegion: "Maharashtra",
    postalCode: "400001",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 19.076,
    longitude: 72.8777,
  },
  telephone: "+91-9322222216",
  priceRange: "₹₹",
  openingHours: "Mo-Sa 10:00-19:00",
  sameAs: ["https://www.instagram.com/sirinijewellerymanufacturerss"],
};

export function LocalBusinessJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(localBusinessSchema, null, 2),
      }}
    />
  );
}
