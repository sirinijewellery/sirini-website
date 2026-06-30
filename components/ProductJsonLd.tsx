import { SITE_URL } from "@/lib/seo";

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
  /** Individual reviews to surface as Review items in the schema */
  reviews?: {
    authorName: string;
    rating: number;
    body: string | null;
    createdAt: Date;
  }[];
}

export function ProductJsonLd({ product, reviewSummary, reviews }: ProductJsonLdProps) {
  const siteUrl = SITE_URL;
  const productUrl = `${siteUrl}/shop/${product.slug}`;

  // Resolve availability: explicit inStock flag wins, else derive from stock, else assume in stock
  const isInStock =
    product.inStock ??
    (product.stock !== undefined ? product.stock > 0 : true);

  // Future date required by Google for valid Offer rich results. MUST be
  // deterministic: using Date.now() here made the JSON-LD change on every
  // render, so every ISR revalidation of every product page wrote fresh cache
  // (200k+ ISR writes). Anchoring to "end of next year" only changes once a
  // year, so revalidations with unchanged data now cost zero writes.
  const priceValidUntil = `${new Date().getFullYear() + 1}-12-31`;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": productUrl,
    url: productUrl,
    name: product.name,
    description: product.description,
    sku: product.sku,
    mpn: product.sku,
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
      // Mirrors the real policy (FAQ): exchanges within 7 days of delivery
      // for defects / wrong items, at no cost to the customer.
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IN",
        returnPolicyCategory:
          "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
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

  if (reviews && reviews.length > 0) {
    jsonLd.review = reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.authorName },
      datePublished: r.createdAt.toISOString().split("T")[0],
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: r.body ?? undefined,
    }));
  }

  return (
    <script
      type="application/ld+json"
      // Escape "<" so user/DB content (e.g. review bodies) can't break out of
      // the script tag with "</script>" — prevents stored XSS.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
