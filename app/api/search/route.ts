import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseImages } from "@/lib/queries/products";
import { matchCategorySlugs } from "@/lib/taxonomy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2 || q.length > 100) {
    return NextResponse.json({ results: [] });
  }

  const ci = "insensitive" as const;
  const catSlugs = matchCategorySlugs(q);

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: ci } },
        { description: { contains: q, mode: ci } },
        { material: { contains: q, mode: ci } },
        { sku: { contains: q, mode: ci } },
        ...(catSlugs.length ? [{ categories: { hasSome: catSlugs } }] : []),
      ],
    },
    take: 8,
    select: { id: true, name: true, slug: true, price: true, images: true, category: true },
  });

  const results = products.map((p) => ({
    ...p,
    images: parseImages(p.images),
  }));

  return NextResponse.json({ results });
}
