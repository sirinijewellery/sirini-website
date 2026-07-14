import { ProductCard } from "@/components/ProductCard";
import { type ProductWithVariants } from "@/lib/queries/products";

interface ProductGridProps {
  products: ProductWithVariants[];
}

// The shop skeleton (app/shop/loading.tsx) must mirror this grid exactly or
// content "jumps" when real products replace the placeholders — share the
// classes so the two can't drift.
export const PRODUCT_GRID_CLASSES =
  "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8";

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="font-display text-2xl text-muted-foreground">S</span>
        </div>
        <h3 className="font-display text-xl text-foreground">No products found</h3>
        <p className="text-sm text-muted-foreground mt-2 font-sans">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className={`${PRODUCT_GRID_CLASSES} reveal stagger-grid`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
