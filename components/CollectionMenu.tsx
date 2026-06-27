"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import type { TaxonomyGroupData } from "@/lib/taxonomy";

const panelLink =
  "block text-sm font-sans text-on-surface-variant hover:text-primary transition-colors duration-200";

/**
 * Desktop-only "Shop by Collection" dropdown. Mirrors OccasionMenu: opens on
 * hover and keyboard focus; closes on mouse leave, Escape, or link click.
 * Collection terms come from the admin-managed `collection` taxonomy group;
 * each links to /shop?collection=<slug>. The trigger is a button (there is no
 * dedicated /collections page) that also opens the panel.
 */
export function CollectionMenu({ groups }: { groups: TaxonomyGroupData[] }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const collectionGroup = groups.find((g) => g.slug === "collection");
  const collections = collectionGroup?.terms ?? [];

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
    if (e.key === "Escape" && open) closeNow();
  }

  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (
      containerRef.current &&
      !containerRef.current.contains(e.relatedTarget as Node)
    ) {
      closeNow();
    }
  }

  // Nothing to show if the owner hasn't created any collection terms.
  if (collections.length === 0) return null;

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
        className={`relative flex items-center gap-1 font-label-caps text-[13px] font-semibold tracking-[0.12em] uppercase whitespace-nowrap transition-colors duration-300 cursor-pointer after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-[#C9A96E] after:transition-transform after:duration-200 after:origin-left ${
          open
            ? "text-primary after:scale-x-100"
            : "text-on-surface-variant hover:text-primary after:scale-x-0 hover:after:scale-x-100"
        }`}
      >
        Shop by Collection
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="menu"
          aria-label="Shop by Collection"
          className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[min(22rem,90vw)] bg-background border border-outline-variant shadow-xl z-50"
        >
          <ul className="p-4 space-y-1">
            {collections.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/shop?collection=${c.slug}`}
                  role="menuitem"
                  onClick={closeNow}
                  className={`${panelLink} rounded-sm px-3 py-2 hover:bg-surface-container`}
                >
                  {c.label}
                  {c.blurb && (
                    <span className="block text-xs text-muted-foreground font-sans normal-case tracking-normal">
                      {c.blurb}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* View all footer */}
          <Link
            href="/shop"
            role="menuitem"
            onClick={closeNow}
            className="block px-4 py-3 text-xs font-label-caps tracking-wider uppercase text-primary hover:bg-surface-container transition-colors border-t border-outline-variant"
          >
            View All Jewellery →
          </Link>
        </div>
      )}
    </div>
  );
}
