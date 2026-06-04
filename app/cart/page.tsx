"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/store/cart";
import { CartItemRow } from "@/components/CartItem";
import { CouponField } from "@/components/CouponField";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { getMrp, formatPrice } from "@/components/PriceDisplay";

export default function CartPage() {
  // Zustand `persist` hydrates after the first render — guard against flash of empty cart
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const { items, getTotal, appliedCoupon, setCoupon } = useCartStore();

  const subtotal = getTotal();
  const discount = appliedCoupon?.discountAmount ?? 0;
  const total = Math.max(0, subtotal - discount);
  const mrpTotal = items.reduce((s, i) => s + getMrp(i.price) * i.quantity, 0);

  if (!hydrated) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-10 w-48 bg-muted rounded animate-pulse mb-8" />
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="lg:w-80 h-64 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="font-display text-3xl font-light text-foreground">Your cart is empty</h1>
        <p className="text-muted-foreground font-sans mt-2 mb-8">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link href="/shop">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-4xl font-light text-foreground mb-8">Your Cart</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart items */}
        <div className="flex-1 min-w-0">
          {items.map((item) => (
            <CartItemRow key={`${item.productId}-${item.variantId}`} item={item} />
          ))}
          <div className="mt-4">
            <Link href="/shop" className="text-sm font-sans text-muted-foreground hover:text-primary transition-colors">
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:w-80 shrink-0">
          <div className="rounded-lg border border-border p-6 space-y-4 sticky top-24">
            <h2 className="font-display text-xl text-foreground">Order Summary</h2>

            <div className="space-y-2 font-sans text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">You save</span>
                <span className="text-green-600">{formatPrice(mrpTotal - subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>− {formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="text-emerald-600">Free</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between font-sans font-semibold">
              <span>Total</span>
              <span className="text-primary text-lg">{formatPrice(total)}</span>
            </div>

            {/* Coupon */}
            <CouponField
              subtotal={subtotal}
              onApply={setCoupon}
              appliedCoupon={appliedCoupon}
            />

            <Link href="/checkout">
              <Button className="w-full mt-2" size="lg">
                Proceed to Checkout
              </Button>
            </Link>

            <p className="text-xs text-center text-muted-foreground font-sans">
              🔒 Secure payment via Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
