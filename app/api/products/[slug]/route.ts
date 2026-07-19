import { NextResponse } from "next/server";
import { getProductBySlug, parseImages } from "@/lib/queries/products";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const limited = enforceRateLimit(req, "product-detail", 60, 10 * 60_000);
  if (limited) return limited;

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
    compareAtPrice: product.compareAtPrice,
    category: product.category,
    material: product.material,
    badge: product.badge,
    images: parseImages(product.images),
    stock: product.stock,
  });
}
