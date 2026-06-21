"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  CATALOG_KEYS,
  DEFAULT_BADGES,
  type BadgeDef,
  type CatalogSort,
} from "@/lib/catalog";

// Initial values resolved server-side (defaults match the live site).
export interface CatalogSettingsInitial {
  badges: BadgeDef[];
  lowStockThreshold: number;
  hideOutOfStock: boolean;
  defaultSort: CatalogSort;
}

// Curated palette so the owner never has to type Tailwind classes by hand. Each
// option pairs a background + text class (the same shape stored on a badge).
const COLOR_OPTIONS: { label: string; value: string; swatch: string }[] = [
  { label: "Green", value: "bg-emerald-100 text-emerald-700", swatch: "bg-emerald-100" },
  { label: "Amber", value: "bg-amber-100 text-amber-700", swatch: "bg-amber-100" },
  { label: "Rose", value: "bg-rose-100 text-rose-700", swatch: "bg-rose-100" },
  { label: "Blue", value: "bg-blue-100 text-blue-700", swatch: "bg-blue-100" },
  { label: "Violet", value: "bg-violet-100 text-violet-700", swatch: "bg-violet-100" },
  { label: "Slate", value: "bg-slate-100 text-slate-700", swatch: "bg-slate-100" },
  { label: "Grey (default)", value: "bg-muted text-muted-foreground", swatch: "bg-slate-200" },
];

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name A–Z" },
];

export function CatalogSettingsManager({ initial }: { initial: CatalogSettingsInitial }) {
  const [badges, setBadges] = useState<BadgeDef[]>(
    initial.badges.length ? initial.badges : DEFAULT_BADGES
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    String(initial.lowStockThreshold)
  );
  const [hideOutOfStock, setHideOutOfStock] = useState(initial.hideOutOfStock);
  const [defaultSort, setDefaultSort] = useState<CatalogSort>(initial.defaultSort);
  const [saving, setSaving] = useState(false);

  function updateBadge(index: number, patch: Partial<BadgeDef>) {
    setBadges((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }
  function removeBadge(index: number) {
    setBadges((prev) => prev.filter((_, i) => i !== index));
  }
  function addBadge() {
    setBadges((prev) => [...prev, { label: "", color: COLOR_OPTIONS[0].value }]);
  }

  async function save() {
    const threshold = Number(lowStockThreshold);
    if (!Number.isFinite(threshold) || threshold < 0) {
      toast.error("Low-stock threshold must be a non-negative number");
      return;
    }

    // Clean badges: trim labels, drop blanks, reject duplicates.
    const cleanBadges = badges
      .map((b) => ({ label: b.label.trim(), color: b.color.trim() }))
      .filter((b) => b.label !== "");
    const labels = cleanBadges.map((b) => b.label.toLowerCase());
    if (new Set(labels).size !== labels.length) {
      toast.error("Badge labels must be unique");
      return;
    }

    const updates: [string, unknown][] = [
      [CATALOG_KEYS.badges, cleanBadges],
      [CATALOG_KEYS.lowStockThreshold, Math.floor(threshold)],
      [CATALOG_KEYS.hideOutOfStock, hideOutOfStock],
      [CATALOG_KEYS.defaultSort, defaultSort],
    ];

    setSaving(true);
    try {
      const results = await Promise.all(
        updates.map(([key, value]) =>
          fetch("/api/admin/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, value }),
          })
        )
      );
      const bad = results.find((r) => !r.ok);
      if (bad) throw new Error((await bad.json()).error || "Failed to save");
      // Reflect the cleaned list back into the form.
      setBadges(cleanBadges.length ? cleanBadges : DEFAULT_BADGES);
      toast.success("Catalog settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Stock display ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Stock display</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Controls the urgency line shown on a product page.
          </p>
        </div>
        <label className="block max-w-xs">
          <span className="text-xs font-medium text-slate-700">Low-stock threshold</span>
          <span className="mt-1 flex items-center rounded-lg border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
            <input
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 focus:outline-none h-9"
            />
            <span className="pr-3 text-sm text-slate-400 whitespace-nowrap">units</span>
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Show &quot;only N left&quot; when stock is at or below this. Default 5.
          </span>
        </label>
      </div>

      {/* ── Catalog behaviour ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Catalog behaviour</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            How the shop listing treats sold-out products and which order it uses by
            default.
          </p>
        </div>

        <label className="flex items-center gap-3 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={hideOutOfStock}
            onChange={(e) => setHideOutOfStock(e.target.checked)}
            className="h-4 w-4 accent-primary cursor-pointer"
          />
          <span className="text-sm text-slate-700">
            Hide out-of-stock products from shop listings
          </span>
        </label>

        <label className="block max-w-xs">
          <span className="text-xs font-medium text-slate-700">Default sort order</span>
          <select
            value={defaultSort}
            onChange={(e) => setDefaultSort(e.target.value as CatalogSort)}
            className="mt-1 w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Used when a visitor hasn&apos;t chosen a sort. Default: Newest first.
          </span>
        </label>
      </div>

      {/* ── Badges ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Product badges</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            The labels (and colours) available in the product editor&apos;s Badge
            dropdown, shown as a pill on the product page.
          </p>
        </div>

        <div className="space-y-3">
          {badges.map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                type="text"
                value={b.label}
                onChange={(e) => updateBadge(i, { label: e.target.value })}
                placeholder="Badge label e.g. NEW"
                className="flex-1 h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <select
                value={b.color}
                onChange={(e) => updateBadge(i, { color: e.target.value })}
                className="h-9 w-40 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
              >
                {/* Keep an unrecognised colour selectable. */}
                {!COLOR_OPTIONS.some((c) => c.value === b.color) && b.color && (
                  <option value={b.color}>Custom</option>
                )}
                {COLOR_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${b.color}`}
              >
                {b.label || "Preview"}
              </span>
              <button
                type="button"
                onClick={() => removeBadge(i)}
                className="text-slate-400 hover:text-rose-600 cursor-pointer"
                aria-label="Remove badge"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addBadge}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Add badge
        </button>
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
