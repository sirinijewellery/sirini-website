import { NextResponse } from "next/server";
import { getProductBySlug, parseImages } from "@/lib/queries/products";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    category: product.category,
    material: product.material,
    badge: product.badge,
    images: parseImages(product.images),
    variants: product.variants,
  });
}
