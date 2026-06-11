"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store/cart";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingBag, Minus, Plus } from "lucide-react";
import { trackAddToCart } from "@/lib/analytics";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number | null;
    images: string[];
    category?: string;
    /** Units in stock; when provided, <= 0 disables the button */
    stock?: number;
  };
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const openDrawer = useCartStore((state) => state.openDrawer);

  // Local state only for the typed input value while editing
  const [inputValue, setInputValue] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;
  const isDisabled = isOutOfStock;

  // Derive cart state from store — no local "added" flag needed
  const cartItem = items.find((i) => i.productId === product.id);
  const inCart = !!cartItem;
  const currentQty = cartItem?.quantity ?? 0;

  // ── Add to cart (first time) ─────────────────────────────────────────────
  function handleAddToCart() {
    if (isDisabled) return;

    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      image: product.images[0] ?? "",
      category: product.category,
      quantity: 1,
    });

    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category ?? "",
      quantity: 1,
    });

    openDrawer();

    toast.success(`${product.name} added to cart`);
  }

  // ── Quantity controls ────────────────────────────────────────────────────
  function handleDecrement() {
    const newQty = currentQty - 1;
    if (newQty <= 0) {
      removeItem(product.id);
    } else {
      updateQuantity(product.id, undefined, newQty);
    }
  }

  function handleIncrement() {
    updateQuantity(product.id, undefined, currentQty + 1);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
  }

  function handleInputFocus() {
    setIsEditing(true);
    setInputValue(String(currentQty));
  }

  function handleInputBlur() {
    setIsEditing(false);
    const parsed = parseInt(inputValue, 10);
    if (!inputValue || isNaN(parsed) || parsed <= 0) {
      removeItem(product.id);
    } else {
      updateQuantity(product.id, undefined, parsed);
    }
    setInputValue("");
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  }

  // ── Render: quantity control when item is in cart ────────────────────────
  if (inCart && !isDisabled) {
    return (
      <div className="flex w-full h-12 items-center rounded-md border border-[#2C2C2C] overflow-hidden">
        {/* Decrement */}
        <button
          type="button"
          onClick={handleDecrement}
          aria-label="Decrease quantity"
          className="
            flex items-center justify-center
            h-full px-4
            text-[#2C2C2C]
            transition-colors duration-150
            hover:bg-[#2C2C2C] hover:text-white
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E] focus-visible:ring-inset
            cursor-pointer
            shrink-0
          "
        >
          <Minus className="h-4 w-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-full bg-[#2C2C2C]" />

        {/* Quantity input */}
        <input
          type="number"
          min="0"
          value={isEditing ? inputValue : currentQty}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          aria-label="Item quantity"
          className="
            flex-1 h-full
            text-center text-base font-sans font-medium
            text-[#2C2C2C]
            bg-transparent
            border-none outline-none
            focus:ring-0
            [appearance:textfield]
            [&::-webkit-inner-spin-button]:appearance-none
            [&::-webkit-outer-spin-button]:appearance-none
            cursor-text
          "
        />

        {/* Divider */}
        <div className="w-px h-full bg-[#2C2C2C]" />

        {/* Increment */}
        <button
          type="button"
          onClick={handleIncrement}
          aria-label="Increase quantity"
          className="
            flex items-center justify-center
            h-full px-4
            text-[#2C2C2C]
            transition-colors duration-150
            hover:bg-[#2C2C2C] hover:text-white
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E] focus-visible:ring-inset
            cursor-pointer
            shrink-0
          "
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // ── Render: standard Add to Cart button ──────────────────────────────────
  const buttonText = isOutOfStock ? "Out of Stock" : "Add to Cart";

  return (
    <Button
      onClick={handleAddToCart}
      disabled={!!isDisabled}
      className="w-full h-12 text-base font-sans gap-2 btn-sheen press-scale"
      variant="default"
    >
      <ShoppingBag className="h-4 w-4" />
      {buttonText}
    </Button>
  );
}
