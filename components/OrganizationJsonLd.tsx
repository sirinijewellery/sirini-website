import { SITE_URL } from "@/lib/seo";
import { getBusinessDetails } from "@/lib/queries/site";

/** Site-wide Organization schema — renders in <head> via layout or homepage */
export async function OrganizationJsonLd() {
  const siteUrl = SITE_URL;
  const b = await getBusinessDetails();

  const sameAs = [b.instagramUrl, b.justdialUrl].filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Sirini Jewellery",
    url: siteUrl,
    logo: "https://res.cloudinary.com/dp8a2lvxg/image/upload/e_trim,q_auto,f_png,w_600/sirini-jewellery/logo-real.png",
    description:
      "Handcrafted fashion jewellery brand based in Mumbai, India. Specialising in Kundan, Meenakari, and gold-plated jewellery for everyday wear, gifting, and bridal occasions.",
    foundingDate: "2015",
    email: b.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: b.city,
      addressRegion: b.region,
      addressCountry: b.country,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        availableLanguage: ["English", "Hindi"],
        url: `${siteUrl}/contact`,
        ...(b.phone ? { telephone: b.phone } : {}),
        ...(b.email ? { email: b.email } : {}),
      },
    ],
    sameAs,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
