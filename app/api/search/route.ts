import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseImages } from "@/lib/queries/products";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2 || q.length > 100) {
    return NextResponse.json({ results: [] });
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { category: { contains: q } },
        { material: { contains: q } },
      ],
    },
    take: 6,
    select: { id: true, name: true, slug: true, price: true, images: true, category: true },
  });

  const results = products.map((p) => ({
    ...p,
    images: parseImages(p.images),
  }));

  return NextResponse.json({ results });
}
