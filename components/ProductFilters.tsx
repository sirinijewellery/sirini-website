"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface ProductFiltersProps {
  categories: { id: string; name: string; slug: string }[];
  materials: string[];
}

export function ProductFilters({ categories, materials }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") || "";
  const activeMaterial = searchParams.get("material") || "";
  const priceMin = searchParams.get("priceMin") || "";
  const priceMax = searchParams.get("priceMax") || "";

  // Local state for price inputs — debounced to avoid router.push on every keystroke
  const [localMin, setLocalMin] = useState(priceMin);
  const [localMax, setLocalMax] = useState(priceMax);
  const priceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep local state in sync when URL params change externally (e.g. "Clear all")
  useEffect(() => { setLocalMin(priceMin); }, [priceMin]);
  useEffect(() => { setLocalMax(priceMax); }, [priceMax]);

  function handlePriceChange(key: "priceMin" | "priceMax", value: string) {
    if (key === "priceMin") setLocalMin(value);
    else setLocalMax(value);

    if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
    priceDebounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`/shop?${params.toString()}`);
    }, 600);
  }

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

  function clearAll() {
    router.push("/shop");
  }

  const hasFilters = activeCategory || activeMaterial || priceMin || priceMax;

  return (
    <aside className="w-full lg:w-56 shrink-0 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-foreground">Filters</h2>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs font-sans text-muted-foreground hover:text-primary transition-colors underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label className="font-sans text-xs uppercase tracking-widest text-muted-foreground">Category</Label>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => updateParam("category", "")}
            className={`text-left text-sm font-sans py-1 transition-colors ${!activeCategory ? "text-primary font-medium" : "text-foreground hover:text-primary"}`}
          >
            All Jewellery
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateParam("category", cat.name)}
              className={`text-left text-sm font-sans py-1 transition-colors ${activeCategory === cat.name ? "text-primary font-medium" : "text-foreground hover:text-primary"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price range */}
      <div className="space-y-3">
        <Label className="font-sans text-xs uppercase tracking-widest text-muted-foreground">Price (₹)</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <input
              type="number"
              placeholder="Min"
              value={localMin}
              onChange={(e) => handlePriceChange("priceMin", e.target.value)}
              className="w-full h-8 px-2 text-sm border border-border rounded bg-background font-sans focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <input
              type="number"
              placeholder="Max"
              value={localMax}
              onChange={(e) => handlePriceChange("priceMax", e.target.value)}
              className="w-full h-8 px-2 text-sm border border-border rounded bg-background font-sans focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {[
            ["Under ₹500", "", "500"],
            ["₹500–1000", "500", "1000"],
            ["₹1000–2000", "1000", "2000"],
            ["₹2000+", "2000", ""],
          ].map(([label, min, max]) => (
            <button
              key={label}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                min ? params.set("priceMin", min) : params.delete("priceMin");
                max ? params.set("priceMax", max) : params.delete("priceMax");
                params.delete("page");
                router.push(`/shop?${params.toString()}`);
              }}
              className="text-xs font-sans px-2 py-1 rounded border border-border hover:border-primary hover:text-primary transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Material */}
      <div className="space-y-2">
        <Label className="font-sans text-xs uppercase tracking-widest text-muted-foreground">Material</Label>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => updateParam("material", "")}
            className={`text-left text-sm font-sans py-1 transition-colors ${!activeMaterial ? "text-primary font-medium" : "text-foreground hover:text-primary"}`}
          >
            All Materials
          </button>
          {materials.map((m) => (
            <button
              key={m}
              onClick={() => updateParam("material", m)}
              className={`text-left text-sm font-sans py-1 transition-colors ${activeMaterial === m ? "text-primary font-medium" : "text-foreground hover:text-primary"}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
