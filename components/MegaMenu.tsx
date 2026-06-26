"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { type TaxonomyGroupData } from "@/lib/taxonomy";

const columnHeading =
  "font-label-caps text-xs font-semibold tracking-[0.2em] uppercase text-[#C9A96E] mb-3";

const columnLink =
  "block text-sm font-sans text-on-surface-variant hover:text-primary transition-colors duration-200";

/**
 * Desktop-only "Shop" mega menu — data-driven from the admin-managed taxonomy.
 *
 * `groups` comes from getMenuTaxonomy() (server) and contains only showInMenu
 * groups/terms, already ordered. The "category" group is hierarchical: its
 * top-level terms are the 4 MAINS, each with nested `children` sub-categories.
 * Every other group is flat.
 *
 * Opens on hover and on keyboard focus; closes on mouse leave, Escape, or click.
 * Within "Shop by Category", hovering/focusing a MAIN reveals its sub-category
 * flyout; ArrowRight/Enter opens it, ArrowLeft/Escape collapses it.
 */
export function MegaMenu({ groups }: { groups: TaxonomyGroupData[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [panelTop, setPanelTop] = useState(0);
  // Slug of the MAIN category whose sub-category flyout is currently revealed.
  const [activeMain, setActiveMain] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isActive = pathname === "/shop";

  // Split taxonomy: the hierarchical "category" group drives "Shop by Category"
  // (with sub-category flyouts); every other group renders as a flat column.
  const categoryGroup = groups.find((g) => g.slug === "category");
  const mains = categoryGroup?.terms ?? [];
  const otherGroups = groups.filter((g) => g.slug !== "category");

  function clearCloseTimer() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openMenu() {
    clearCloseTimer();
    if (containerRef.current) {
      setPanelTop(containerRef.current.getBoundingClientRect().bottom + 12);
    }
    setOpen(true);
  }

  // Small delay on mouse-leave so brief gaps between trigger/panel don't flicker it shut.
  function scheduleClose() {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      setActiveMain(null);
    }, 120);
  }

  function closeNow() {
    clearCloseTimer();
    setOpen(false);
    setActiveMain(null);
  }

  useEffect(() => () => clearCloseTimer(), []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape" && open) {
      // If a sub-category flyout is showing, Escape collapses it first;
      // a second Escape closes the whole panel.
      if (activeMain) {
        setActiveMain(null);
      } else {
        closeNow();
      }
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

  // Keyboard handling for a MAIN category row: Right/Enter/Space reveals its
  // sub-category flyout; Left collapses it. (Up/Down is native tab/list order.)
  function handleMainKeyDown(
    e: React.KeyboardEvent<HTMLAnchorElement>,
    main: TaxonomyGroupData["terms"][number],
  ) {
    if (main.children.length === 0) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActiveMain(main.slug);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActiveMain(null);
    }
  }

  // Has anything to show beyond "View All"?
  const hasTaxonomy = mains.length > 0 || otherGroups.length > 0;

  // Column count: category column (if any mains) + one per other showInMenu group.
  const columnCount = (mains.length > 0 ? 1 : 0) + otherGroups.length;

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
        onClick={() => {
          if (!open && containerRef.current) {
            setPanelTop(containerRef.current.getBoundingClientRect().bottom + 12);
          }
          setOpen((v) => !v);
        }}
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

      {/* Mega panel — fixed so it's centered on the viewport, not the narrow button */}
      {open && (
        <div
          role="menu"
          aria-label="Shop"
          style={{ top: panelTop, maxHeight: `calc(100svh - ${panelTop}px - 16px)` }}
          className="fixed left-1/2 -translate-x-1/2 w-[min(56rem,90vw)] bg-background border border-outline-variant shadow-xl z-[100] overflow-y-auto"
        >
          <div
            className="grid gap-6 p-6 lg:gap-8 lg:p-8"
            style={{
              gridTemplateColumns: `repeat(${Math.max(columnCount, 1)}, minmax(0, 1fr))`,
            }}
          >
            {/* ── Shop by Category — mains with inline sub-category expansion ── */}
            {mains.length > 0 && (
              <div>
                <h3 className={columnHeading}>Shop by Category</h3>
                <ul className="space-y-0.5">
                  {mains.map((main) => {
                    const hasChildren = main.children.length > 0;
                    const isExpanded = activeMain === main.slug;
                    return (
                      <li
                        key={main.id}
                        onMouseEnter={() => setActiveMain(main.slug)}
                        onMouseLeave={() => setActiveMain(null)}
                      >
                        <Link
                          href={`/shop?category=${main.slug}`}
                          role="menuitem"
                          onClick={closeNow}
                          onFocus={() => setActiveMain(main.slug)}
                          onKeyDown={(e) => handleMainKeyDown(e, main)}
                          className={`flex items-center justify-between gap-2 py-1.5 text-sm font-sans transition-colors duration-200 ${
                            isExpanded
                              ? "text-primary font-medium"
                              : "text-on-surface-variant hover:text-primary"
                          }`}
                        >
                          <span>{main.label}</span>
                          {hasChildren && (
                            <ChevronDown
                              className={`h-3 w-3 shrink-0 opacity-50 transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`}
                              aria-hidden="true"
                            />
                          )}
                        </Link>

                        {/* Sub-categories expand inline below the main */}
                        {hasChildren && isExpanded && (
                          <ul
                            role="menu"
                            aria-label={`${main.label} sub-categories`}
                            className="pl-3 pb-1 border-l border-outline-variant/50 ml-1 space-y-0.5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-100"
                          >
                            <li>
                              <Link
                                href={`/shop?category=${main.slug}`}
                                role="menuitem"
                                onClick={closeNow}
                                className="block py-1 text-xs font-sans font-medium text-on-surface-variant hover:text-primary transition-colors duration-150"
                              >
                                All {main.label}
                              </Link>
                            </li>
                            {main.children.map((sub) => (
                              <li key={sub.id}>
                                <Link
                                  href={`/shop?category=${sub.slug}`}
                                  role="menuitem"
                                  onClick={closeNow}
                                  className="block py-1 text-xs font-sans text-muted-foreground hover:text-primary transition-colors duration-150"
                                >
                                  {sub.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* ── One column per other showInMenu group (flat) ── */}
            {otherGroups.map((group) => (
              <div key={group.id}>
                <h3 className={columnHeading}>{group.label}</h3>
                <ul className="space-y-2.5">
                  {group.terms.map((term) => (
                    <li key={term.id}>
                      <Link
                        href={`/shop?${group.slug}=${term.slug}`}
                        role="menuitem"
                        onClick={closeNow}
                        className={columnLink}
                      >
                        {term.label}
                        {term.blurb && (
                          <span className="block text-xs text-muted-foreground font-sans normal-case tracking-normal">
                            {term.blurb}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

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

          {!hasTaxonomy && <span className="sr-only">Browse all jewellery.</span>}
        </div>
      )}
    </div>
  );
}
