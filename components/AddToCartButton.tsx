"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cart";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingBag, Check } from "lucide-react";
import { trackAddToCart } from "@/lib/analytics";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    category?: string;
  };
  selectedVariant: {
    id: string;
    size: string | null;
    colour: string | null;
    stockQuantity: number;
  } | null;
  hasVariants: boolean;
}

export function AddToCartButton({
  product,
  selectedVariant,
  hasVariants,
}: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const isDisabled =
    (hasVariants && !selectedVariant) ||
    (selectedVariant !== null && selectedVariant?.stockQuantity === 0);

  function handleAddToCart() {
    if (isDisabled) return;

    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images[0] ?? "",
      size: selectedVariant?.size ?? undefined,
      colour: selectedVariant?.colour ?? undefined,
      quantity: 1,
    });

    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category ?? "",
      quantity: 1,
    });

    setAdded(true);
    toast.success(`${product.name} added to cart`, {
      description: selectedVariant?.colour
        ? `Finish: ${selectedVariant.colour}`
        : undefined,
      action: {
        label: "View Cart",
        onClick: () => router.push("/cart"),
      },
    });

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAdded(false), 2000);
  }

  const buttonText =
    hasVariants && !selectedVariant
      ? "Select Options"
      : selectedVariant?.stockQuantity === 0
      ? "Out of Stock"
      : added
      ? "Added!"
      : "Add to Cart";

  return (
    <Button
      onClick={handleAddToCart}
      disabled={!!isDisabled}
      className="w-full h-12 text-base font-sans gap-2"
      variant={added ? "outline" : "default"}
    >
      {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
      {buttonText}
    </Button>
  );
}
