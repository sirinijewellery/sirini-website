const faqs = [
  {
    question: "Is Sirini jewellery made of real gold?",
    answer:
      "Sirini jewellery is high-quality gold-plated fashion jewellery made with brass or copper base metals, coated with 18–22K gold plating. It is not solid gold, but is crafted to look and feel luxurious.",
  },
  {
    question: "How do I care for my Sirini jewellery?",
    answer:
      "Keep your jewellery away from water, perfume, lotions, and sweat. Store in a cool, dry place — ideally in the pouch or box provided. Wipe gently with a soft dry cloth after use to maintain shine.",
  },
  {
    question: "Do you offer free shipping across India?",
    answer:
      "Yes, Sirini offers free pan-India shipping on all orders, regardless of order value. Delivery typically takes 3–7 business days depending on your location.",
  },
  {
    question: "What is the return and exchange policy?",
    answer:
      "We accept exchanges within 7 days of delivery for manufacturing defects or wrong items received. Please contact us via WhatsApp or email with photos of the issue. We do not accept returns for change of mind.",
  },
  {
    question: "Are the jewellery pieces suitable for daily wear?",
    answer:
      "Our Kundan and Meenakari pieces are best suited for occasional and festive wear. Gold-plated bangles, rings, and simple earrings can be worn daily with proper care.",
  },
];

export function FAQJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
