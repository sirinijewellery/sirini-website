interface ProductJsonLdProps {
  product: {
    name: string;
    description: string;
    images: string[];
    price: number;
    sku: string;
    slug: string;
    material?: string;
    category?: string;
    /** Units in stock; when provided, drives availability (>0 = InStock) */
    stock?: number;
    /** Explicit availability flag; takes precedence when set */
    inStock?: boolean;
  };
  /** Pass aggregate review data when available */
  reviewSummary?: {
    ratingValue: number;
    reviewCount: number;
  };
}

export function ProductJsonLd({ product, reviewSummary }: ProductJsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const productUrl = `${siteUrl}/shop/${product.slug}`;

  // Resolve availability: explicit inStock flag wins, else derive from stock, else assume in stock
  const isInStock =
    product.inStock ??
    (product.stock !== undefined ? product.stock > 0 : true);

  // ~1 year out — required by Google for valid Offer rich results
  const priceValidUntil = new Date(Date.now() + 365 * 864e5)
    .toISOString()
    .split("T")[0];

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.images,
    brand: {
      "@type": "Brand",
      name: "Sirini Jewellery",
    },
    ...(product.category && {
      category: product.category,
    }),
    ...(product.material && {
      material: product.material,
    }),
    offers: {
      "@type": "Offer",
      url: productUrl,
      price: product.price.toFixed(2),
      priceCurrency: "INR",
      priceValidUntil,
      itemCondition: "https://schema.org/NewCondition",
      availability: isInStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Sirini Jewellery",
        url: siteUrl,
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "INR",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 3,
            maxValue: 7,
            unitCode: "DAY",
          },
        },
      },
    },
  };

  if (reviewSummary && reviewSummary.reviewCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: reviewSummary.ratingValue.toFixed(1),
      reviewCount: reviewSummary.reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
