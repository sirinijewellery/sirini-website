interface ProductJsonLdProps {
  product: {
    name: string;
    description: string;
    images: string[];
    price: number;
    sku: string;
    slug: string;
  };
}

export function ProductJsonLd({ product }: ProductJsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.images,
    offers: {
      "@type": "Offer",
      price: product.price.toFixed(2),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/shop/${product.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
