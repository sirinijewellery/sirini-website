"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { OCCASIONS, STYLES, PRICE_BUCKETS } from "@/lib/taxonomy";

interface ProductFiltersProps {
  categories: { id: string; name: string; slug: string }[];
  materials: string[];
}

export function ProductFilters({ categories, materials }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") || "";
  const activeMaterial = searchParams.get("material") || "";
  const activeOccasion = searchParams.get("occasion") || "";
  const activeStyle = searchParams.get("style") || "";
  const priceMin = searchParams.get("priceMin") || "";
  const priceMax = searchParams.get("priceMax") || "";
  const minRating = searchParams.get("minRating") || "";
  const inStock = searchParams.get("inStock") || "";

  const hasFilters =
    activeCategory ||
    activeMaterial ||
    activeOccasion ||
    activeStyle ||
    priceMin ||
    priceMax ||
    minRating ||
    inStock;

  // Generic single-param updater: set when truthy, delete when empty. Always
  // resets pagination so a new filter starts on page 1.
  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/shop?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Price buckets set two params at once (min/max), so they need their own setter.
  const applyPriceBucket = useCallback(
    (min: number | undefined, max: number | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      min !== undefined ? params.set("priceMin", String(min)) : params.delete("priceMin");
      max !== undefined ? params.set("priceMax", String(max)) : params.delete("priceMax");
      params.delete("page");
      router.push(`/shop?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Remove a single param (used by the chip ✕ buttons). Price chip clears both.
  const removeParam = useCallback(
    (...keys: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      keys.forEach((k) => params.delete(k));
      params.delete("page");
      router.push(`/shop?${params.toString()}`);
    },
    [router, searchParams]
  );

  function clearAll() {
    router.push("/shop");
  }

  const isPriceBucketActive = (min: number | undefined, max: number | undefined) =>
    priceMin === (min !== undefined ? String(min) : "") &&
    priceMax === (max !== undefined ? String(max) : "");

  // Label for the currently active price filter (for the chip + matching a bucket).
  const activePriceBucket = PRICE_BUCKETS.find((b) =>
    isPriceBucketActive(b.priceMin, b.priceMax)
  );
  const priceChipLabel = activePriceBucket
    ? activePriceBucket.label
    : priceMin && priceMax
      ? `₹${priceMin} – ₹${priceMax}`
      : priceMin
        ? `₹${priceMin}+`
        : priceMax
          ? `Under ₹${priceMax}`
          : "";

  // ── Pill styling (shared) ──
  const pillBase =
    "shrink-0 px-4 py-1.5 rounded-full text-sm font-sans border transition-colors duration-200 cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1";
  const pillInactive =
    "border-border text-muted-foreground hover:border-primary hover:text-primary bg-background";
  const pillActive = "border-primary bg-primary text-primary-foreground";

  // A horizontally-scrollable pill row (no-scrollbar on all browsers).
  const rowClass = "flex items-center gap-2 overflow-x-auto pb-1";
  const rowStyle = { scrollbarWidth: "none", msOverflowStyle: "none" } as const;
  const groupLabel =
    "shrink-0 text-[10px] font-sans uppercase tracking-[0.18em] text-on-surface-variant pr-1 self-center";

  // Chip (active-filter) styling — outlined, removable.
  const chipClass =
    "inline-flex items-center gap-1.5 shrink-0 pl-3 pr-2 py-1 rounded-full text-xs font-sans border border-primary/40 bg-primary/5 text-primary whitespace-nowrap";

  return (
    <div className="w-full space-y-3">
      {/* ── Active-filter chips ── */}
      {hasFilters && (
        <div className={rowClass} style={rowStyle}>
          {activeCategory && (
            <Chip
              label={activeCategory}
              onRemove={() => removeParam("category")}
              className={chipClass}
            />
          )}
          {activeOccasion && (
            <Chip
              label={
                OCCASIONS.find((o) => o.slug === activeOccasion)?.label || activeOccasion
              }
              onRemove={() => removeParam("occasion")}
              className={chipClass}
            />
          )}
          {activeStyle && (
            <Chip
              label={STYLES.find((s) => s.slug === activeStyle)?.label || activeStyle}
              onRemove={() => removeParam("style")}
              className={chipClass}
            />
          )}
          {priceChipLabel && (
            <Chip
              label={priceChipLabel}
              onRemove={() => removeParam("priceMin", "priceMax")}
              className={chipClass}
            />
          )}
          {minRating && (
            <Chip
              label={`${minRating}★ & up`}
              onRemove={() => removeParam("minRating")}
              className={chipClass}
            />
          )}
          {inStock && (
            <Chip
              label="In stock"
              onRemove={() => removeParam("inStock")}
              className={chipClass}
            />
          )}
          {activeMaterial && (
            <Chip
              label={activeMaterial}
              onRemove={() => removeParam("material")}
              className={chipClass}
            />
          )}
          <button
            onClick={clearAll}
            className="shrink-0 ml-1 text-xs font-sans underline text-muted-foreground hover:text-primary whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Group 1: Categories ── */}
      <div className={rowClass} style={rowStyle}>
        <button
          onClick={() => updateParam("category", "")}
          className={`${pillBase} ${!activeCategory ? pillActive : pillInactive}`}
          aria-pressed={!activeCategory}
        >
          All Jewellery
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => updateParam("category", cat.name)}
            className={`${pillBase} ${activeCategory === cat.name ? pillActive : pillInactive}`}
            aria-pressed={activeCategory === cat.name}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* ── Group 2: Occasion ── */}
      <div className={rowClass} style={rowStyle}>
        <span className={groupLabel}>Occasion</span>
        {OCCASIONS.map((o) => (
          <button
            key={o.slug}
            onClick={() => updateParam("occasion", activeOccasion === o.slug ? "" : o.slug)}
            className={`${pillBase} ${activeOccasion === o.slug ? pillActive : pillInactive}`}
            aria-pressed={activeOccasion === o.slug}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* ── Group 3: Style ── */}
      <div className={rowClass} style={rowStyle}>
        <span className={groupLabel}>Style</span>
        {STYLES.map((s) => (
          <button
            key={s.slug}
            onClick={() => updateParam("style", activeStyle === s.slug ? "" : s.slug)}
            className={`${pillBase} ${activeStyle === s.slug ? pillActive : pillInactive}`}
            aria-pressed={activeStyle === s.slug}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Group 4: Price + Rating + In stock ── */}
      <div className={rowClass} style={rowStyle}>
        <span className={groupLabel}>Price</span>
        {PRICE_BUCKETS.map((b) => {
          const active = isPriceBucketActive(b.priceMin, b.priceMax);
          return (
            <button
              key={b.slug}
              onClick={() =>
                active
                  ? applyPriceBucket(undefined, undefined)
                  : applyPriceBucket(b.priceMin, b.priceMax)
              }
              className={`${pillBase} ${active ? pillActive : pillInactive}`}
              aria-pressed={active}
            >
              {b.label}
            </button>
          );
        })}

        <div className="shrink-0 w-px h-5 bg-border mx-1 self-center" aria-hidden="true" />

        {/* Rating */}
        <button
          onClick={() => updateParam("minRating", minRating === "4" ? "" : "4")}
          className={`${pillBase} ${minRating === "4" ? pillActive : pillInactive}`}
          aria-pressed={minRating === "4"}
        >
          4★ &amp; up
        </button>

        {/* In stock toggle */}
        <button
          onClick={() => updateParam("inStock", inStock === "1" ? "" : "1")}
          className={`${pillBase} ${inStock === "1" ? pillActive : pillInactive}`}
          aria-pressed={inStock === "1"}
        >
          In stock
        </button>

        {/* ── Materials (kept) ── */}
        {materials.length > 0 && (
          <div className="shrink-0 w-px h-5 bg-border mx-1 self-center" aria-hidden="true" />
        )}
        {materials.map((m) => (
          <button
            key={m}
            onClick={() => updateParam("material", activeMaterial === m ? "" : m)}
            className={`${pillBase} ${activeMaterial === m ? pillActive : pillInactive}`}
            aria-pressed={activeMaterial === m}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}

function Chip({
  label,
  onRemove,
  className,
}: {
  label: string;
  onRemove: () => void;
  className: string;
}) {
  return (
    <span className={className}>
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span aria-hidden="true">✕</span>
      </button>
    </span>
  );
}
