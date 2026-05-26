import { ProductCard } from "@/components/ProductCard";
import { getRelatedProducts } from "@/lib/queries/products";

interface RelatedProductsProps {
  category: string;
  excludeId: string;
}

export async function RelatedProducts({ category, excludeId }: RelatedProductsProps) {
  const products = await getRelatedProducts(category, excludeId, 4);
  if (products.length === 0) return null;

  return (
    <section className="mt-20">
      <h2 className="font-display text-3xl font-light text-foreground mb-8">
        You May Also Like
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
