"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useCartStore, type CartItem } from "@/lib/store/cart";
import { PriceDisplay, getMrp } from "@/components/PriceDisplay";

export function CartItemRow({ item }: { item: CartItem }) {
  const { removeItem, updateQuantity } = useCartStore();

  return (
    <div className="flex gap-4 py-4 border-b border-border">
      {/* Image */}
      <Link href={`/shop/${item.slug}`} className="shrink-0">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
          {item.image ? (
            <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-xl text-muted-foreground">S</span>
            </div>
          )}
        </div>
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-2">
          <div>
            <Link href={`/shop/${item.slug}`}>
              <h3 className="font-display text-base leading-snug text-foreground hover:text-primary transition-colors line-clamp-2">
                {item.name}
              </h3>
            </Link>
            {(item.size || item.colour) && (
              <p className="text-xs text-muted-foreground font-sans mt-0.5">
                {[item.colour, item.size].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <button
            onClick={() => removeItem(item.productId, item.variantId)}
            className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Remove item"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-3">
          {/* Quantity controls */}
          <div className="flex items-center border border-border rounded">
            <button
              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
              className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="px-3 py-1 text-sm font-sans border-x border-border min-w-[2.5rem] text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
              className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Line total */}
          <PriceDisplay
            price={item.price * item.quantity}
            mrp={(item.compareAtPrice ?? getMrp(item.price)) * item.quantity}
            size="md"
            layout="col"
          />
        </div>
      </div>
    </div>
  );
}
