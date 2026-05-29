"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, ShoppingBag, Heart, User, Search } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { CartBadge } from "@/components/CartBadge";

// Pages where the bottom nav should not appear
const HIDDEN_PREFIXES = [
  "/admin",
  "/login",
  "/register",
  "/checkout",
  "/order-confirmation",
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const openDrawer = useCartStore((state) => state.openDrawer);

  // Hide on admin, auth, and checkout flows
  const hidden = HIDDEN_PREFIXES.some((p) => pathname.startsWith(p));
  if (hidden) return null;

  const accountHref = session ? "/account" : "/login";

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-outline-variant h-16"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="grid grid-cols-5 h-full">
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-colors duration-150 ${
            pathname === "/"
              ? "text-primary"
              : "text-on-surface-variant hover:text-primary"
          }`}
          aria-label="Home"
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-label-caps tracking-wide">Home</span>
        </Link>

        {/* Shop */}
        <Link
          href="/shop"
          className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-colors duration-150 ${
            pathname.startsWith("/shop")
              ? "text-primary"
              : "text-on-surface-variant hover:text-primary"
          }`}
          aria-label="Shop"
          aria-current={pathname.startsWith("/shop") ? "page" : undefined}
        >
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-label-caps tracking-wide">Shop</span>
        </Link>

        {/* Cart — action button, never marked active */}
        <button
          onClick={openDrawer}
          className="flex flex-col items-center justify-center gap-0.5 py-2 text-on-surface-variant hover:text-primary transition-colors duration-150 cursor-pointer w-full"
          aria-label="Open cart"
        >
          <div className="relative">
            <ShoppingBag className="h-5 w-5" />
            <CartBadge />
          </div>
          <span className="text-[10px] font-label-caps tracking-wide">Cart</span>
        </button>

        {/* Wishlist */}
        <Link
          href="/wishlist"
          className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-colors duration-150 ${
            pathname === "/wishlist"
              ? "text-primary"
              : "text-on-surface-variant hover:text-primary"
          }`}
          aria-label="Wishlist"
          aria-current={pathname === "/wishlist" ? "page" : undefined}
        >
          <Heart className="h-5 w-5" />
          <span className="text-[10px] font-label-caps tracking-wide">Wishlist</span>
        </Link>

        {/* Account */}
        <Link
          href={accountHref}
          className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-colors duration-150 ${
            pathname.startsWith("/account")
              ? "text-primary"
              : "text-on-surface-variant hover:text-primary"
          }`}
          aria-label="Account"
          aria-current={pathname.startsWith("/account") ? "page" : undefined}
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] font-label-caps tracking-wide">Account</span>
        </Link>
      </div>
    </nav>
  );
}
