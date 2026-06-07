"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { OCCASIONS } from "@/lib/taxonomy";

const panelLink =
  "block text-sm font-sans text-on-surface-variant hover:text-primary transition-colors duration-200";

/**
 * Desktop-only "Shop by Occasion" dropdown.
 * Mirrors MegaMenu's interaction: opens on hover and on keyboard focus;
 * closes on mouse leave, Escape, or link click.
 * The trigger label is a Link to /occasions so the page stays reachable.
 */
export function OccasionMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isActive = pathname.startsWith("/occasions");

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
      <Link
        href="/occasions"
        aria-expanded={open}
        aria-haspopup="true"
        onFocus={openMenu}
        className={`relative flex items-center gap-1 font-label-caps text-[13px] font-semibold tracking-[0.12em] uppercase whitespace-nowrap transition-colors duration-300 cursor-pointer after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-[#C9A96E] after:transition-transform after:duration-200 after:origin-left ${
          isActive || open
            ? "text-primary after:scale-x-100"
            : "text-on-surface-variant hover:text-primary after:scale-x-0 hover:after:scale-x-100"
        }`}
      >
        Shop by Occasion
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </Link>

      {/* Dropdown panel */}
      {open && (
        <div
          role="menu"
          aria-label="Shop by Occasion"
          className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[min(22rem,90vw)] bg-background border border-outline-variant shadow-xl z-50"
        >
          <ul className="p-4 space-y-1">
            {OCCASIONS.map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/shop?occasion=${o.slug}`}
                  role="menuitem"
                  onClick={closeNow}
                  className={`${panelLink} rounded-sm px-3 py-2 hover:bg-surface-container`}
                >
                  {o.label}
                  <span className="block text-xs text-muted-foreground font-sans normal-case tracking-normal">
                    {o.blurb}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {/* View all footer */}
          <Link
            href="/occasions"
            role="menuitem"
            onClick={closeNow}
            className="block px-4 py-3 text-xs font-label-caps tracking-wider uppercase text-primary hover:bg-surface-container transition-colors border-t border-outline-variant"
          >
            View All Occasions →
          </Link>
        </div>
      )}
    </div>
  );
}
