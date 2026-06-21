import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PromoBanner as PromoBannerData } from "@/lib/queries/home";

// Warm editorial promo banner shown near the top of the homepage.
// Renders ONLY when the owner has enabled it (page.tsx guards on `enabled`).
// Receives its data from the server page so there is no extra client fetch.

export function PromoBanner({ promo }: { promo: PromoBannerData }) {
  if (!promo.enabled || !promo.text.trim()) return null;

  const bg = promo.bg?.trim() || "#8a4853";
  const hasCta = promo.ctaLabel.trim() && promo.ctaHref.trim();

  return (
    <section
      className="w-full"
      style={{ backgroundColor: bg }}
      aria-label="Announcement"
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-16 py-3 flex flex-col sm:flex-row items-center justify-center gap-x-4 gap-y-1.5 text-center">
        <p className="font-sans text-[12px] md:text-[13px] tracking-[0.12em] uppercase text-white/95 font-medium">
          {promo.text}
        </p>
        {hasCta && (
          <Link
            href={promo.ctaHref}
            className="group inline-flex items-center gap-1.5 font-sans text-[11px] md:text-[12px] tracking-[0.16em] uppercase font-semibold text-[#C9A96E] hover:text-white transition-colors duration-200"
          >
            {promo.ctaLabel}
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        )}
      </div>
    </section>
  );
}
