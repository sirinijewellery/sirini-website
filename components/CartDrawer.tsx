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
import { PriceDisplay, formatPrice, getMrp } from "@/components/PriceDisplay";
import { useState, useEffect } from "react";

const GIFT_THRESHOLD = 2500;

function GiftProgressBar({ subtotal }: { subtotal: number }) {
  const unlocked = subtotal >= GIFT_THRESHOLD;
  const remaining = Math.max(0, GIFT_THRESHOLD - subtotal);
  const pct = Math.min(100, Math.round((subtotal / GIFT_THRESHOLD) * 100));

  return (
    <div className="px-6 py-3 border-b border-[#E8D5B0] bg-[#FDF9F6]">
      <p className="font-sans text-xs text-[#2C2C2C] mb-2 flex items-center gap-1.5">
        {unlocked ? (
          <span>🎁 You&apos;ve unlocked a free surprise gift!</span>
        ) : (
          <span>
            Add {formatPrice(remaining)} more to unlock a FREE surprise gift 🎁
          </span>
        )}
      </p>
      <div
        className="h-1.5 w-full rounded-full bg-[#E8D5B0] overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-[#C9A96E] transition-[width] duration-500 ease-out"
          style={{ width: `${unlocked ? 100 : pct}%` }}
        />
      </div>
    </div>
  );
}

interface SuggestionProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  category: string;
}

export function CartDrawer() {
  const isDrawerOpen = useCartStore((s) => s.isDrawerOpen);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const getTotal = useCartStore((s) => s.getTotal);

  const subtotal = getTotal();
  const compareTotal = items.reduce(
    (s, i) => s + (i.compareAtPrice ?? getMrp(i.price)) * i.quantity,
    0
  );
  const savings = compareTotal - subtotal;

  const [suggestions, setSuggestions] = useState<SuggestionProduct[]>([]);

  useEffect(() => {
    if (items.length === 0) {
      setSuggestions([]);
      return;
    }

    // Find the most expensive item's category
    const topItem = [...items].sort((a, b) => b.price - a.price)[0];
    const cartProductIds = new Set(items.map((i) => i.productId));

    const searchTerm = topItem.category ?? topItem.name;
    fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`)
      .then((r) => r.json())
      .then((data) => {
        const filtered = (data.results ?? [])
          .filter((p: SuggestionProduct) => !cartProductIds.has(p.id))
          .slice(0, 3);
        setSuggestions(filtered);
      })
      .catch(() => setSuggestions([]));
  }, [items]);

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
            {/* ── Free-gift threshold progress ─────────────────────────────── */}
            <GiftProgressBar subtotal={subtotal} />

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
                      href={`/shop/${item.slug}`}
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
                        href={`/shop/${item.slug}`}
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
                      <div className="mt-1">
                        <PriceDisplay
                          price={item.price}
                          mrp={item.compareAtPrice ?? getMrp(item.price)}
                          size="sm"
                        />
                      </div>

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

            {/* ── Complete the Look upsell ─────────────────────────────────── */}
            {suggestions.length > 0 && (
              <div className="border-t border-[#E8D5B0] px-6 py-4 bg-[#FDF9F6]">
                <p className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[#8A8078] mb-3">
                  Complete the Look
                </p>
                <div className="space-y-3">
                  {suggestions.map((s) => (
                    <Link
                      key={s.id}
                      href={`/shop/${s.slug}`}
                      onClick={closeDrawer}
                      className="flex items-center gap-3 group"
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-12 shrink-0 overflow-hidden bg-[#F2E8E0] border border-[#E8D5B0]">
                        {s.images[0] && (
                          <img
                            src={s.images[0]}
                            alt={s.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-sans text-[#2C2C2C] truncate group-hover:text-[#B76E79] transition-colors duration-150">
                          {s.name}
                        </p>
                        <p className="text-xs font-sans font-semibold text-[#B76E79] mt-0.5">
                          {formatPrice(s.price)}
                        </p>
                      </div>
                      {/* Arrow */}
                      <span className="text-[#8A8078] group-hover:text-[#B76E79] transition-colors shrink-0 text-sm">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

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

              {/* You save */}
              {savings > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-sans text-[#8A8078]">You save</span>
                  <span className="text-sm font-sans font-medium text-green-600">
                    {formatPrice(savings)}
                  </span>
                </div>
              )}

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
