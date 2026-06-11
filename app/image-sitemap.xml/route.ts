import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseImages } from "@/lib/parseImages";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sirinijewellery.com";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // revalidate every hour

export async function GET() {
  const products = await prisma.product.findMany({
    select: {
      name: true,
      slug: true,
      category: true,
      images: true,
    },
  });

  const urlBlocks = products
    .map((product) => {
      const images = parseImages(product.images);
      if (images.length === 0) return null;

      const imageBlocks = images
        .map((imgUrl) => {
          const escapedUrl = imgUrl
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          const title = `${product.name} - Sirini Jewellery`
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          const caption =
            `Handcrafted ${product.category} by Sirini Jewellery, Mumbai`
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");

          return `    <image:image>
      <image:loc>${escapedUrl}</image:loc>
      <image:title>${title}</image:title>
      <image:caption>${caption}</image:caption>
    </image:image>`;
        })
        .join("\n");

      const escapedSlug = product.slug
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      return `  <url>
    <loc>${BASE_URL}/shop/${escapedSlug}</loc>
${imageBlocks}
  </url>`;
    })
    .filter(Boolean)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlBlocks}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
