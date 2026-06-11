"use client";

import { useCartStore } from "@/lib/store/cart";

export function CartBadge() {
  const count = useCartStore((state) => state.getItemCount());
  if (count === 0) return null;
  return (
    // key={count} remounts the badge whenever the count changes → pop replays
    <span
      key={count}
      className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-sans font-medium text-primary-foreground animate-badge-pop"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
