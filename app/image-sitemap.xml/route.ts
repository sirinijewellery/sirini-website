import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseImages } from "@/lib/parseImages";
import { botImageUrl } from "@/lib/cdnImage";
import { SITE_URL } from "@/lib/seo";
import { getAllArticles } from "@/lib/blog";
import { categoryLabel } from "@/lib/taxonomy";

const BASE_URL = SITE_URL;

export const dynamic = "force-dynamic";
export const revalidate = 3600; // revalidate every hour

export async function GET() {
  const [products, articles] = await Promise.all([
    prisma.product.findMany({
      select: {
        name: true,
        slug: true,
        category: true,
        images: true,
      },
    }),
    getAllArticles(),
  ]);

  const urlBlocks = products
    .map((product) => {
      const images = parseImages(product.images);
      if (images.length === 0) return null;

      const imageBlocks = images
        .map((imgUrl) => {
          const escapedUrl = esc(botImageUrl(imgUrl));
          const title = esc(`${product.name} - Sirini Jewellery`);
          const caption = esc(
            `Handcrafted ${categoryLabel(product.category)} by Sirini Jewellery, Mumbai`,
          );

          return `    <image:image>
      <image:loc>${escapedUrl}</image:loc>
      <image:title>${title}</image:title>
      <image:caption>${caption}</image:caption>
    </image:image>`;
        })
        .join("\n");

      const escapedSlug = esc(product.slug);

      return `  <url>
    <loc>${BASE_URL}/shop/${escapedSlug}</loc>
${imageBlocks}
  </url>`;
    })
    .filter(Boolean)
    .join("\n");

  function esc(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  const articleBlocks = articles
    .filter((a) => a.coverImage)
    .map(
      (a) => `  <url>
    <loc>${BASE_URL}/blog/${esc(a.slug)}</loc>
    <image:image>
      <image:loc>${esc(botImageUrl(a.coverImage))}</image:loc>
      <image:title>${esc(a.title)} — Sirini Jewellery Journal</image:title>
      <image:caption>${esc(a.excerpt)}</image:caption>
    </image:image>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlBlocks}
${articleBlocks}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
