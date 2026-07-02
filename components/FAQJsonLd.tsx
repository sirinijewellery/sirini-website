import { getFaq } from "@/lib/queries/content";

// Structured data for Google FAQ rich results.
// Reads the SAME source as app/faq/page.tsx (getFaq) so the on-page list and
// the structured-data list can never drift apart.
export async function FAQJsonLd() {
  const faqs = await getFaq();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      // Escape "<" so admin-edited FAQ content can't break out of the script
      // tag via "</script>" — prevents stored XSS.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
    />
  );
}
