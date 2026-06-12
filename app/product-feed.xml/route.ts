import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseImages, sortAllImages } from "@/lib/parseImages";

/**
 * Google Merchant Center product feed (RSS 2.0 + g: namespace).
 * Submit this URL in Merchant Center → Products → Feeds to list the whole
 * catalogue on Google Shopping (free listings) and Search product results.
 *
 *   https://sirinijewellery.com/product-feed.xml
 */
const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sirinijewellery.com";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // refresh hourly

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const products = await prisma.product.findMany({
    select: {
      sku: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      category: true,
      material: true,
      stock: true,
      images: true,
    },
    orderBy: { sku: "asc" },
  });

  const items = products
    .map((p) => {
      const images = sortAllImages(parseImages(p.images));
      if (images.length === 0) return null;

      const link = `${BASE_URL}/shop/${p.slug}`;
      // Google caps descriptions at 5000 chars; trim defensively.
      const description = p.description.slice(0, 4900);
      const availability = p.stock > 0 ? "in_stock" : "out_of_stock";
      const additionalImages = images
        .slice(1, 11) // Google allows max 10 additional images
        .map((u) => `      <g:additional_image_link>${esc(u)}</g:additional_image_link>`)
        .join("\n");

      return `    <item>
      <g:id>${esc(p.sku)}</g:id>
      <g:title>${esc(p.name)}</g:title>
      <g:description>${esc(description)}</g:description>
      <g:link>${esc(link)}</g:link>
      <g:image_link>${esc(images[0])}</g:image_link>
${additionalImages ? additionalImages + "\n" : ""}      <g:price>${p.price.toFixed(2)} INR</g:price>
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Sirini Jewellery</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:product_type>${esc(`Jewellery > ${p.category}`)}</g:product_type>
      <g:google_product_category>188</g:google_product_category>
      <g:material>${esc(p.material)}</g:material>
      <g:shipping>
        <g:country>IN</g:country>
        <g:price>0 INR</g:price>
      </g:shipping>
    </item>`;
    })
    .filter(Boolean)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Sirini Jewellery — Product Feed</title>
    <link>${BASE_URL}</link>
    <description>Handcrafted Kundan, Meenakari and gold-plated jewellery from Mumbai.</description>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
