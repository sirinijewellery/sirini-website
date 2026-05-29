"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCartStore } from "@/lib/store/cart";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Minus, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(price);

export function CartDrawer() {
  const isDrawerOpen = useCartStore((s) => s.isDrawerOpen);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const getTotal = useCartStore((s) => s.getTotal);

  const subtotal = getTotal();

  return (
    <Sheet
      open={isDrawerOpen}
      onOpenChange={(open) => {
        if (!open) closeDrawer();
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:w-[420px] flex flex-col p-0 bg-[#FAF7F2] border-l border-[#E8D5B0]"
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <SheetHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-[#E8D5B0] gap-0">
          <SheetTitle className="font-display text-xl font-semibold tracking-wide text-[#2C2C2C]">
            Your Cart
          </SheetTitle>
          <button
            onClick={closeDrawer}
            aria-label="Close cart"
            className="text-[#8A8078] hover:text-[#2C2C2C] transition-colors duration-150 cursor-pointer p-1 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </SheetHeader>

        {/* ── Empty state ─────────────────────────────────────────────────── */}
        {items.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F2E8E0] flex items-center justify-center">
              <ShoppingBag className="h-7 w-7 text-[#B76E79]" />
            </div>
            <div className="space-y-1">
              <p className="font-display text-lg text-[#2C2C2C]">
                Your cart is empty
              </p>
              <p className="text-sm text-[#8A8078] font-sans">
                Add some pieces you love to get started
              </p>
            </div>
            <Link href="/shop" onClick={closeDrawer}>
              <Button
                variant="default"
                className="mt-2 font-sans text-sm px-6"
              >
                Continue Shopping
              </Button>
            </Link>
          </div>
        )}

        {/* ── Items list ──────────────────────────────────────────────────── */}
        {items.length > 0 && (
          <>
            <ul className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.map((item) => {
                const key = `${item.productId}-${item.variantId ?? "default"}`;
                return (
                  <li
                    key={key}
                    className="flex gap-4 py-3 border-b border-[#E8D5B0] last:border-b-0"
                  >
                    {/* Thumbnail */}
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeDrawer}
                      className="shrink-0"
                    >
                      <div className="w-[60px] h-[60px] rounded overflow-hidden bg-[#F2E8E0]">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={60}
                          height={60}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={closeDrawer}
                      >
                        <p className="text-sm font-sans font-medium text-[#2C2C2C] truncate hover:text-[#B76E79] transition-colors duration-150">
                          {item.name}
                        </p>
                      </Link>

                      {/* Variant info */}
                      {(item.size || item.colour) && (
                        <p className="text-xs text-[#8A8078] mt-0.5 font-sans">
                          {[item.size, item.colour].filter(Boolean).join(" · ")}
                        </p>
                      )}

                      {/* Price */}
                      <p className="text-sm font-sans font-semibold text-[#B76E79] mt-1">
                        {formatPrice(item.price)}
                      </p>

                      {/* Quantity controls + remove */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-[#2C2C2C] rounded overflow-hidden h-7">
                          <button
                            type="button"
                            onClick={() => {
                              const newQty = item.quantity - 1;
                              if (newQty <= 0) {
                                removeItem(item.productId, item.variantId);
                              } else {
                                updateQuantity(
                                  item.productId,
                                  item.variantId,
                                  newQty
                                );
                              }
                            }}
                            aria-label="Decrease quantity"
                            className="flex items-center justify-center px-2 h-full text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white transition-colors duration-150 cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-3 text-xs font-medium text-[#2C2C2C] font-sans select-none">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.variantId,
                                item.quantity + 1
                              )
                            }
                            aria-label="Increase quantity"
                            className="flex items-center justify-center px-2 h-full text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white transition-colors duration-150 cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(item.productId, item.variantId)
                          }
                          aria-label="Remove item"
                          className="p-1 text-[#8A8078] hover:text-red-500 transition-colors duration-150 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* ── Footer ────────────────────────────────────────────────────── */}
            <div className="border-t border-[#E8D5B0] px-6 py-4 space-y-3 bg-[#FAF7F2]">
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-sans font-medium text-[#2C2C2C]">
                  Subtotal
                </span>
                <span className="text-base font-sans font-semibold text-[#2C2C2C]">
                  {formatPrice(subtotal)}
                </span>
              </div>

              {/* Shipping note */}
              <p className="text-xs text-[#8A8078] font-sans">
                Free shipping on all orders across India
              </p>

              {/* Checkout CTA */}
              <Link href="/checkout" onClick={closeDrawer} className="block">
                <Button variant="default" className="w-full font-sans text-sm">
                  Checkout
                </Button>
              </Link>

              {/* View full cart */}
              <Link href="/cart" onClick={closeDrawer} className="block">
                <Button
                  variant="outline"
                  className="w-full font-sans text-sm border-[#2C2C2C] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white"
                >
                  View Full Cart
                </Button>
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
