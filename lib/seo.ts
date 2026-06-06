import type { Metadata } from "next";

const siteConfig = {
  name: "Sirini Jewellery",
  tagline: "Handcrafted Kundan & Gold-Plated Jewellery",
  description:
    "Mumbai's premier handcrafted jewellery brand — Kundan necklace sets, Meenakari earrings, gold-plated bangles, rings & anklets. Free pan-India shipping since 2015.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  // Cloudinary brand hero used as the site-wide social sharing card
  defaultOgImage:
    "https://res.cloudinary.com/dp8a2lvxg/image/upload/w_1200,h_630,c_fill,g_auto/v1779795103/sirini-jewellery/10ns787/10NS787-11225-Model.jpg",
  twitterHandle: "@sirinijewellery",
  keywords: [
    "fashion jewellery",
    "handcrafted jewellery",
    "Kundan jewellery",
    "Meenakari jewellery",
    "gold plated jewellery",
    "jewellery for women",
    "Indian jewellery online",
    "bridal jewellery",
    "necklace set",
    "earrings online",
    "bangles online",
    "Mumbai jewellery",
  ],
};

export function baseMetadata(): Metadata {
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: `${siteConfig.name} — ${siteConfig.tagline}`,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: siteConfig.keywords,
    authors: [{ name: siteConfig.name, url: siteConfig.url }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: "en_IN",
      images: [
        {
          url: siteConfig.defaultOgImage,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} — ${siteConfig.tagline}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitterHandle,
      images: [siteConfig.defaultOgImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    alternates: {
      canonical: siteConfig.url,
      languages: {
        "en-IN": siteConfig.url,
        "x-default": siteConfig.url,
      },
    },
  };
}

export function pageMetadata(
  title: string,
  description: string,
  options?: {
    noindex?: boolean;
    ogImage?: string;
    canonical?: string;
    openGraph?: Partial<NonNullable<Metadata["openGraph"]>>;
  }
): Metadata {
  const image = options?.ogImage ?? siteConfig.defaultOgImage;
  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      type: "website",
      images: [{ url: image, width: 1200, height: 630 }],
      ...options?.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    ...(options?.canonical && {
      alternates: { canonical: options.canonical },
    }),
    ...(options?.noindex && {
      robots: { index: false, follow: false },
    }),
  };
}

export function productMetadata(product: {
  name: string;
  description: string;
  images: string[];
  price: number;
  category?: string;
  slug?: string;
}): Metadata {
  const rawDescription = product.description;
  const metaDescription =
    rawDescription.slice(0, 155) + (rawDescription.length > 155 ? "…" : "");
  const ogDescription =
    rawDescription.slice(0, 145) +
    (rawDescription.length > 145 ? "… " : " ") +
    "Free shipping across India.";

  const image = product.images[0] ?? siteConfig.defaultOgImage;
  const canonical = product.slug
    ? `${siteConfig.url}/shop/${product.slug}`
    : undefined;

  // Build title: prefer rich form if it fits under 65 chars
  let title: string;
  if (product.category) {
    const rich = `${product.name} | Buy ${product.category} Online India — ${siteConfig.name}`;
    title = rich.length <= 65 ? rich : `${product.name} | ${siteConfig.name}`;
  } else {
    title = `${product.name} | ${siteConfig.name}`;
  }

  return {
    title,
    description: metaDescription,
    keywords: [
      product.name,
      ...(product.category ? [product.category] : []),
      ...siteConfig.keywords.slice(0, 5),
    ],
    openGraph: {
      title: `${product.name} | ${siteConfig.name}`,
      description: ogDescription,
      type: "website",
      images: [{ url: image, width: 800, height: 800, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ${siteConfig.name}`,
      description: ogDescription,
      images: [image],
    },
    ...(canonical && { alternates: { canonical } }),
  };
}

export { siteConfig };
