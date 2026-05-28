import type { Metadata } from "next";

const siteConfig = {
  name: "Sirini Jewellery",
  tagline: "Handcrafted Fashion Jewellery",
  description:
    "Shop handcrafted fashion jewellery — necklaces, earrings, bangles, finger rings, and anklets. Kundan, Meenakari, and gold-plated jewellery for everyday wear, gifting, and bridal. Pan India free shipping.",
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
    },
  };
}

export function pageMetadata(
  title: string,
  description: string,
  options?: { noindex?: boolean; ogImage?: string; canonical?: string }
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
  const description =
    product.description.slice(0, 155) +
    (product.description.length > 155 ? "…" : "");
  const image = product.images[0] ?? siteConfig.defaultOgImage;
  const canonical = product.slug
    ? `${siteConfig.url}/shop/${product.slug}`
    : undefined;

  return {
    title: product.name,
    description,
    keywords: [
      product.name,
      ...(product.category ? [product.category] : []),
      ...siteConfig.keywords.slice(0, 5),
    ],
    openGraph: {
      title: `${product.name} | ${siteConfig.name}`,
      description,
      type: "website",
      images: [{ url: image, width: 800, height: 800, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ${siteConfig.name}`,
      description,
      images: [image],
    },
    ...(canonical && { alternates: { canonical } }),
  };
}

export { siteConfig };
