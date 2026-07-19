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
    // Stable graph id — the LocalBusiness (JewelryStore) node and the WebSite's
    // `publisher` reference share this exact id, so graph-aware consumers
    // (Google, AI answer engines) merge them into ONE "Sirini Jewellery" entity
    // instead of treating the three same-named nodes as separate businesses.
    "@id": `${siteUrl}/#organization`,
    name: "Sirini Jewellery",
    url: siteUrl,
    logo: "https://res.cloudinary.com/dp8a2lvxg/image/upload/e_trim,q_auto,f_png,w_600/sirini-jewellery/logo-real.png",
    description:
      "Handcrafted fashion jewellery brand based in Mumbai, India. Specialising in Kundan, Meenakari, and gold-plated jewellery for everyday wear, gifting, and bridal occasions.",
    foundingDate: "2017",
    // Explicit GEO/AEO signals: where the brand operates and what it is an
    // authority on, so generative engines categorise and cite it correctly.
    areaServed: { "@type": "Country", name: "India" },
    knowsAbout: [
      "Kundan jewellery",
      "Meenakari jewellery",
      "Polki jewellery",
      "Gold-plated fashion jewellery",
      "Bridal jewellery",
    ],
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
      // Escape "<" so admin-edited business details (email, phone, etc.) can't
      // break out of the script tag via "</script>" — prevents stored XSS.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
    />
  );
}
