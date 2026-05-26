import type { Metadata } from "next";

const siteConfig = {
  name: "Sirini Jewellery",
  description:
    "Elegant fashion jewellery — necklaces, earrings, bangles, rings and more. Shop handcrafted jewellery for everyday wear, gifting, and bridal.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  defaultOgImage: "/og-image.jpg",
};

export function baseMetadata(): Metadata {
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: siteConfig.name,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function pageMetadata(
  title: string,
  description: string,
  options?: { noindex?: boolean; ogImage?: string }
): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: options?.ogImage
        ? [{ url: options.ogImage }]
        : [{ url: siteConfig.defaultOgImage }],
    },
    ...(options?.noindex && { robots: { index: false, follow: false } }),
  };
}

export function productMetadata(product: {
  name: string;
  description: string;
  images: string[];
  price: number;
}): Metadata {
  const description = product.description.slice(0, 160);
  return {
    title: product.name,
    description,
    openGraph: {
      title: `${product.name} | ${siteConfig.name}`,
      description,
      type: "website",
      images: product.images.length > 0 ? [{ url: product.images[0] }] : [],
    },
  };
}

export { siteConfig };
