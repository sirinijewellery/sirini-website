"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  NAV_CATEGORIES,
  STYLES,
  OCCASIONS,
  PRICE_BUCKETS,
} from "@/lib/taxonomy";

// Build a /shop URL from a price bucket, omitting undefined bounds.
function priceHref(priceMin?: number, priceMax?: number): string {
  const params = new URLSearchParams();
  if (priceMin !== undefined) params.set("priceMin", String(priceMin));
  if (priceMax !== undefined) params.set("priceMax", String(priceMax));
  const qs = params.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

const columnHeading =
  "font-label-caps text-xs font-semibold tracking-[0.2em] uppercase text-[#C9A96E] mb-3";

const columnLink =
  "block text-sm font-sans text-on-surface-variant hover:text-primary transition-colors duration-200";

/**
 * Desktop-only "Shop" mega menu.
 * Opens on hover and on keyboard focus; closes on mouse leave, Escape, or link click.
 */
export function MegaMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isActive = pathname === "/shop";

  function clearCloseTimer() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openMenu() {
    clearCloseTimer();
    setOpen(true);
  }

  // Small delay on mouse-leave so brief gaps between trigger/panel don't flicker it shut.
  function scheduleClose() {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  function closeNow() {
    clearCloseTimer();
    setOpen(false);
  }

  // Escape closes; close when focus leaves the whole group.
  useEffect(() => () => clearCloseTimer(), []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape" && open) {
      closeNow();
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    // If focus moves outside the container, close the panel.
    if (
      containerRef.current &&
      !containerRef.current.contains(e.relatedTarget as Node)
    ) {
      closeNow();
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        onFocus={openMenu}
        className={`relative flex items-center gap-1 font-label-caps text-sm font-semibold tracking-widest uppercase transition-colors duration-300 cursor-pointer after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-[#C9A96E] after:transition-transform after:duration-200 after:origin-left ${
          isActive || open
            ? "text-primary after:scale-x-100"
            : "text-on-surface-variant hover:text-primary after:scale-x-0 hover:after:scale-x-100"
        }`}
      >
        Shop
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Mega panel */}
      {open && (
        <div
          role="menu"
          aria-label="Shop"
          className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[min(56rem,90vw)] bg-background border border-outline-variant shadow-xl z-50"
        >
          <div className="grid grid-cols-4 gap-8 p-8">
            {/* Shop by Category */}
            <div>
              <h3 className={columnHeading}>Shop by Category</h3>
              <ul className="space-y-2.5">
                {NAV_CATEGORIES.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/shop?category=${c.slug}`}
                      role="menuitem"
                      onClick={closeNow}
                      className={columnLink}
                    >
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Shop by Material */}
            <div>
              <h3 className={columnHeading}>Shop by Material</h3>
              <ul className="space-y-2.5">
                {STYLES.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/shop?style=${s.slug}`}
                      role="menuitem"
                      onClick={closeNow}
                      className={columnLink}
                    >
                      {s.label}
                      <span className="block text-xs text-muted-foreground font-sans normal-case tracking-normal">
                        {s.blurb}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Shop by Occasion */}
            <div>
              <h3 className={columnHeading}>Shop by Occasion</h3>
              <ul className="space-y-2.5">
                {OCCASIONS.map((o) => (
                  <li key={o.slug}>
                    <Link
                      href={`/shop?occasion=${o.slug}`}
                      role="menuitem"
                      onClick={closeNow}
                      className={columnLink}
                    >
                      {o.label}
                      <span className="block text-xs text-muted-foreground font-sans normal-case tracking-normal">
                        {o.blurb}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Shop by Price */}
            <div>
              <h3 className={columnHeading}>Shop by Price</h3>
              <ul className="space-y-2.5">
                {PRICE_BUCKETS.map((b) => (
                  <li key={b.slug}>
                    <Link
                      href={priceHref(b.priceMin, b.priceMax)}
                      role="menuitem"
                      onClick={closeNow}
                      className={columnLink}
                    >
                      {b.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* View all footer */}
          <Link
            href="/shop"
            role="menuitem"
            onClick={closeNow}
            className="block px-8 py-3 text-xs font-label-caps tracking-wider uppercase text-primary hover:bg-surface-container transition-colors border-t border-outline-variant"
          >
            View All Jewellery →
          </Link>
        </div>
      )}
    </div>
  );
}
