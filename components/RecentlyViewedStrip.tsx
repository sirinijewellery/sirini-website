"use client";

import Link from "next/link";
import Image from "next/image";
import { useRecentlyViewedStore } from "@/lib/store/recentlyViewed";

interface RecentlyViewedStripProps {
  currentProductId: string;
}

export function RecentlyViewedStrip({ currentProductId }: RecentlyViewedStripProps) {
  const items = useRecentlyViewedStore((s) => s.items);
  const filteredItems = items.filter((i) => i.id !== currentProductId);

  if (filteredItems.length === 0) return null;

  return (
    <section className="mt-16 reveal">
      <h2 className="font-label-caps text-label-caps tracking-[0.2em] uppercase text-on-surface-variant mb-6">
        Recently Viewed
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {filteredItems.map((item) => (
          <Link key={item.id} href={`/shop/${item.slug}`} className="shrink-0 w-36 group">
            <div className="relative aspect-[4/5] bg-surface-container overflow-hidden mb-2 border border-outline-variant group-hover:border-primary/30 transition-colors">
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="144px"
                className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
              />
            </div>
            <p className="font-sans text-xs text-on-surface line-clamp-2 leading-snug">{item.name}</p>
            <p className="font-sans text-sm font-semibold text-on-surface mt-0.5">
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 0,
              }).format(item.price)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
