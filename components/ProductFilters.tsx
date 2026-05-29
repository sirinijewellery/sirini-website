"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface ProductFiltersProps {
  categories: { id: string; name: string; slug: string }[];
  materials: string[];
}

// Price presets — [label, priceMin, priceMax]
const PRICE_PRESETS: [string, string, string][] = [
  ["Under ₹500", "", "500"],
  ["₹500–1000", "500", "1000"],
  ["₹1000–2000", "1000", "2000"],
  ["₹2000+", "2000", ""],
];

export function ProductFilters({ categories, materials }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") || "";
  const activeMaterial = searchParams.get("material") || "";
  const priceMin = searchParams.get("priceMin") || "";
  const priceMax = searchParams.get("priceMax") || "";

  const hasFilters = activeCategory || activeMaterial || priceMin || priceMax;

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

  function handlePricePreset(min: string, max: string) {
    const params = new URLSearchParams(searchParams.toString());
    min ? params.set("priceMin", min) : params.delete("priceMin");
    max ? params.set("priceMax", max) : params.delete("priceMax");
    params.delete("page");
    router.push(`/shop?${params.toString()}`);
  }

  function clearAll() {
    router.push("/shop");
  }

  // Check if a price preset is currently active
  function isPricePresetActive(min: string, max: string) {
    return priceMin === min && priceMax === max;
  }

  // Base pill classes — shared by all pills
  const pillBase =
    "shrink-0 px-4 py-1.5 rounded-full text-sm font-sans border transition-colors duration-200 cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1";

  // Inactive pill
  const pillInactive =
    "border-border text-muted-foreground hover:border-primary hover:text-primary bg-background";

  // Active pill — rose gold fill
  const pillActive =
    "border-primary bg-primary text-primary-foreground";

  // Separator between groups
  const separator = "shrink-0 w-px h-5 bg-border mx-1 self-center";

  return (
    <div className="w-full">
      {/* Horizontal scrollable pill bar — no-scrollbar hides the track on all browsers */}
      <div
        className="flex items-center gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* ── Group 1: Categories ── */}
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

        {/* ── Separator ── */}
        <div className={separator} aria-hidden="true" />

        {/* ── Group 2: Price presets ── */}
        {PRICE_PRESETS.map(([label, min, max]) => (
          <button
            key={label}
            onClick={() => handlePricePreset(min, max)}
            className={`${pillBase} ${isPricePresetActive(min, max) ? pillActive : pillInactive}`}
            aria-pressed={isPricePresetActive(min, max)}
          >
            {label}
          </button>
        ))}

        {/* ── Separator ── */}
        {materials.length > 0 && (
          <div className={separator} aria-hidden="true" />
        )}

        {/* ── Group 3: Materials ── */}
        {materials.map((m) => (
          <button
            key={m}
            onClick={() => updateParam("material", m)}
            className={`${pillBase} ${activeMaterial === m ? pillActive : pillInactive}`}
            aria-pressed={activeMaterial === m}
          >
            {m}
          </button>
        ))}

        {/* ── Separator + Clear all (only when a filter is active) ── */}
        {hasFilters && (
          <>
            <div className={separator} aria-hidden="true" />
            <button
              onClick={clearAll}
              className={`${pillBase} border-destructive/40 text-destructive hover:bg-destructive/10`}
              aria-label="Clear all filters"
            >
              <span aria-hidden="true" className="mr-1">×</span>Clear All
            </button>
          </>
        )}
      </div>
    </div>
  );
}
