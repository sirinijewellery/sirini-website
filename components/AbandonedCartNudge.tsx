"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store/cart";

const SESSION_FLAG = "sirini_cart_nudge_shown";
const TIMESTAMP_KEY = "sirini_cart_nudge_shown";
const IDLE_MS = 20_000;

/**
 * Gentle, one-time-per-session reminder for users who have items in their cart
 * but have wandered off without checking out. Renders nothing visible — it only
 * fires a sonner toast after ~20s of being on a non-cart/non-checkout page.
 */
export function AbandonedCartNudge() {
  const pathname = usePathname();
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const openDrawer = useCartStore((s) => s.openDrawer);

  // Keep a stable ref to current cart so the timer callback reads fresh values.
  const itemCountRef = useRef(items.length);
  itemCountRef.current = items.length;

  const isExcludedPage =
    pathname?.startsWith("/cart") || pathname?.startsWith("/checkout");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Don't run on cart/checkout pages.
    if (isExcludedPage) return;

    // Only ever show once per browser session.
    // sessionStorage access can throw (privacy mode / blocked storage) — never crash.
    try {
      if (sessionStorage.getItem(SESSION_FLAG)) return;
    } catch {
      return;
    }

    // Need at least one item right now.
    if (items.length === 0) return;

    const timer = window.setTimeout(() => {
      // Re-check guards at fire time — the user may have emptied the cart,
      // navigated to checkout, or already been nudged.
      try {
        if (sessionStorage.getItem(SESSION_FLAG)) return;
        if (itemCountRef.current === 0) return;
        sessionStorage.setItem(SESSION_FLAG, "1");
        localStorage.setItem(TIMESTAMP_KEY, String(Date.now()));
      } catch {
        // Storage may be unavailable (private mode) — non-fatal.
        if (itemCountRef.current === 0) return;
      }

      toast("Still thinking it over? Your handpicked pieces are waiting 💛", {
        duration: 10_000,
        action: {
          label: "View Cart",
          onClick: () => {
            if (typeof openDrawer === "function") {
              openDrawer();
            } else {
              router.push("/cart");
            }
          },
        },
      });
    }, IDLE_MS);

    return () => window.clearTimeout(timer);
    // Re-arm whenever the page or item presence changes.
  }, [pathname, isExcludedPage, items.length, openDrawer, router]);

  return null;
}
