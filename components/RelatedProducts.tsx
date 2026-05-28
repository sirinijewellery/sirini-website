import { ProductCard } from "@/components/ProductCard";
import { getPairingProducts } from "@/lib/queries/products";

interface RelatedProductsProps {
  category: string;
  excludeId: string;
}

export async function RelatedProducts({ category, excludeId }: RelatedProductsProps) {
  const products = await getPairingProducts(category, excludeId);
  if (products.length === 0) return null;

  return (
    <section className="mt-20">
      <div className="mb-8">
        <p className="font-label-caps text-label-caps tracking-widest text-primary uppercase mb-2">
          Complete the Look
        </p>
        <h2 className="font-display text-3xl font-light text-foreground">
          You Can Pair This With
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
