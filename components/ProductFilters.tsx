"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { OCCASIONS, STYLES } from "@/lib/taxonomy";
import type { TaxonomyGroupData, TaxonomyTermData } from "@/lib/taxonomy";

interface ProductFiltersProps {
  categories: { id: string; name: string; slug: string }[];
  materials: string[];
  taxonomy?: TaxonomyGroupData[];
}

const DYNAMIC_DIMENSIONS: { groupSlug: string; param: string; label: string }[] = [
  { groupSlug: "collection", param: "collection", label: "Collection" },
  { groupSlug: "look", param: "look", label: "Look" },
  { groupSlug: "stone", param: "stone", label: "Stone" },
  { groupSlug: "colour", param: "colour", label: "Colour" },
];

function parseMulti(val: string | null): string[] {
  if (!val) return [];
  return val.split(",").map((s) => s.trim()).filter(Boolean);
}

function toggleInList(list: string[], val: string): string[] {
  return list.includes(val) ? list.filter((v) => v !== val) : [...list, val];
}

export function ProductFilters({ materials, taxonomy = [] }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeCategories = parseMulti(searchParams.get("category"));
  const activeMaterials = parseMulti(searchParams.get("material"));
  const activeOccasions = parseMulti(searchParams.get("occasion"));
  const activeStyles = parseMulti(searchParams.get("style"));
  const minRating = searchParams.get("minRating") || "";
  const inStock = searchParams.get("inStock") || "";

  const categoryGroup = taxonomy.find((g) => g.slug === "category");
  const mainCategories = categoryGroup?.terms ?? [];

  const dynamicGroups = DYNAMIC_DIMENSIONS.map((dim) => {
    const group = taxonomy.find((g) => g.slug === dim.groupSlug);
    return {
      ...dim,
      terms: group?.terms ?? [],
      active: parseMulti(searchParams.get(dim.param)),
    };
  }).filter((d) => d.terms.length > 0);

  const dynamicLabel = (groupSlug: string, slug: string): string =>
    taxonomy
      .find((g) => g.slug === groupSlug)
      ?.terms.find((t) => t.slug === slug)?.label || slug;

  const hasFilters =
    activeCategories.length > 0 ||
    activeMaterials.length > 0 ||
    activeOccasions.length > 0 ||
    activeStyles.length > 0 ||
    minRating ||
    inStock ||
    dynamicGroups.some((d) => d.active.length > 0);

  const updateParam = useCallback(
    (key: string, values: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (values.length > 0) {
        params.set(key, values.join(","));
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/shop?${params.toString()}`);
    },
    [router, searchParams],
  );

  const toggleParam = useCallback(
    (key: string, value: string) => {
      const current = parseMulti(searchParams.get(key));
      updateParam(key, toggleInList(current, value));
    },
    [searchParams, updateParam],
  );

  const removeParam = useCallback(
    (...keys: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      keys.forEach((k) => params.delete(k));
      params.delete("page");
      router.push(`/shop?${params.toString()}`);
    },
    [router, searchParams],
  );

  function clearAll() {
    router.push("/shop");
  }

  // Check if any main category is selected, to show sub-categories
  const selectedMains = mainCategories.filter((m) => activeCategories.includes(m.slug));
  const subCategories: TaxonomyTermData[] = selectedMains.flatMap((m) => m.children ?? []);

  const pillBase =
    "shrink-0 px-4 py-1.5 rounded-full text-sm font-sans border transition-colors duration-200 cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1";
  const pillInactive =
    "border-border text-muted-foreground hover:border-primary hover:text-primary bg-background";
  const pillActive = "border-primary bg-primary text-primary-foreground";

  const rowClass = "flex items-center gap-2 overflow-x-auto pb-1";
  const rowStyle = { scrollbarWidth: "none", msOverflowStyle: "none" } as const;
  const groupLabel =
    "shrink-0 text-[10px] font-sans uppercase tracking-[0.18em] text-on-surface-variant pr-1 self-center";

  const chipClass =
    "inline-flex items-center gap-1.5 shrink-0 pl-3 pr-2 py-1 rounded-full text-xs font-sans border border-primary/40 bg-primary/5 text-primary whitespace-nowrap";

  return (
    <div className="w-full space-y-3">
      {/* Active-filter chips */}
      {hasFilters && (
        <div className={rowClass} style={rowStyle}>
          {activeCategories.map((slug) => {
            const label = findCategoryLabel(mainCategories, slug);
            return (
              <Chip key={`cat-${slug}`} label={label} onRemove={() => toggleParam("category", slug)} className={chipClass} />
            );
          })}
          {activeOccasions.map((slug) => (
            <Chip key={`occ-${slug}`} label={OCCASIONS.find((o) => o.slug === slug)?.label || slug} onRemove={() => toggleParam("occasion", slug)} className={chipClass} />
          ))}
          {activeStyles.map((slug) => (
            <Chip key={`sty-${slug}`} label={STYLES.find((s) => s.slug === slug)?.label || slug} onRemove={() => toggleParam("style", slug)} className={chipClass} />
          ))}
          {dynamicGroups.map((d) =>
            d.active.map((slug) => (
              <Chip key={`${d.param}-${slug}`} label={dynamicLabel(d.groupSlug, slug)} onRemove={() => toggleParam(d.param, slug)} className={chipClass} />
            )),
          )}
          {minRating && <Chip label={`${minRating}★ & up`} onRemove={() => removeParam("minRating")} className={chipClass} />}
          {inStock && <Chip label="In stock" onRemove={() => removeParam("inStock")} className={chipClass} />}
          {activeMaterials.map((m) => (
            <Chip key={`mat-${m}`} label={m} onRemove={() => toggleParam("material", m)} className={chipClass} />
          ))}
          <button onClick={clearAll} className="shrink-0 ml-1 text-xs font-sans underline text-muted-foreground hover:text-primary whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded cursor-pointer">
            Clear all
          </button>
        </div>
      )}

      {/* Categories — taxonomy-based main categories */}
      <div className={rowClass} style={rowStyle}>
        <button
          onClick={() => setDrawerOpen(true)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-sans border border-border text-muted-foreground hover:border-primary hover:text-primary bg-background transition-colors cursor-pointer"
          aria-label="Open all filters"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </button>
        <div className="shrink-0 w-px h-5 bg-border mx-0.5 self-center" aria-hidden="true" />
        <button
          onClick={() => updateParam("category", [])}
          className={`${pillBase} ${activeCategories.length === 0 ? pillActive : pillInactive}`}
          aria-pressed={activeCategories.length === 0}
        >
          All Jewellery
        </button>
        {mainCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => toggleParam("category", cat.slug)}
            className={`${pillBase} ${activeCategories.includes(cat.slug) ? pillActive : pillInactive}`}
            aria-pressed={activeCategories.includes(cat.slug)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Sub-categories — shown when a main category is selected */}
      {subCategories.length > 0 && (
        <div className={rowClass} style={rowStyle}>
          <span className={groupLabel}>Sub-category</span>
          {subCategories.map((sub) => (
            <button
              key={sub.id}
              onClick={() => toggleParam("category", sub.slug)}
              className={`${pillBase} ${activeCategories.includes(sub.slug) ? pillActive : pillInactive}`}
              aria-pressed={activeCategories.includes(sub.slug)}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {/* Occasion */}
      <div className={rowClass} style={rowStyle}>
        <span className={groupLabel}>Occasion</span>
        {OCCASIONS.map((o) => (
          <button
            key={o.slug}
            onClick={() => toggleParam("occasion", o.slug)}
            className={`${pillBase} ${activeOccasions.includes(o.slug) ? pillActive : pillInactive}`}
            aria-pressed={activeOccasions.includes(o.slug)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Style */}
      <div className={rowClass} style={rowStyle}>
        <span className={groupLabel}>Style</span>
        {STYLES.map((s) => (
          <button
            key={s.slug}
            onClick={() => toggleParam("style", s.slug)}
            className={`${pillBase} ${activeStyles.includes(s.slug) ? pillActive : pillInactive}`}
            aria-pressed={activeStyles.includes(s.slug)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Admin-managed dimensions */}
      {dynamicGroups.map((d) => (
        <div key={d.param} className={rowClass} style={rowStyle}>
          <span className={groupLabel}>{d.label}</span>
          {d.terms.map((t) => (
            <button
              key={t.id}
              onClick={() => toggleParam(d.param, t.slug)}
              className={`${pillBase} ${d.active.includes(t.slug) ? pillActive : pillInactive}`}
              aria-pressed={d.active.includes(t.slug)}
            >
              {t.label}
            </button>
          ))}
        </div>
      ))}

      {/* Rating + In stock + Materials */}
      <div className={rowClass} style={rowStyle}>
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            if (minRating === "4") params.delete("minRating");
            else params.set("minRating", "4");
            params.delete("page");
            router.push(`/shop?${params.toString()}`);
          }}
          className={`${pillBase} ${minRating === "4" ? pillActive : pillInactive}`}
          aria-pressed={minRating === "4"}
        >
          4★ &amp; up
        </button>
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            if (inStock === "1") params.delete("inStock");
            else params.set("inStock", "1");
            params.delete("page");
            router.push(`/shop?${params.toString()}`);
          }}
          className={`${pillBase} ${inStock === "1" ? pillActive : pillInactive}`}
          aria-pressed={inStock === "1"}
        >
          In stock
        </button>
        {materials.length > 0 && (
          <div className="shrink-0 w-px h-5 bg-border mx-1 self-center" aria-hidden="true" />
        )}
        {materials.map((m) => (
          <button
            key={m}
            onClick={() => toggleParam("material", m)}
            className={`${pillBase} ${activeMaterials.includes(m) ? pillActive : pillInactive}`}
            aria-pressed={activeMaterials.includes(m)}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Full-page filter drawer */}
      {drawerOpen && (
        <FilterDrawer
          taxonomy={taxonomy}
          mainCategories={mainCategories}
          dynamicGroups={dynamicGroups}
          materials={materials}
          searchParams={searchParams}
          onApply={(params) => {
            router.push(`/shop?${params.toString()}`);
            setDrawerOpen(false);
          }}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}

function findCategoryLabel(mains: TaxonomyTermData[], slug: string): string {
  for (const m of mains) {
    if (m.slug === slug) return m.label;
    for (const c of m.children ?? []) {
      if (c.slug === slug) return c.label;
    }
  }
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function Chip({ label, onRemove, className }: { label: string; onRemove: () => void; className: string }) {
  return (
    <span className={className}>
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-primary/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
      >
        <span aria-hidden="true" className="text-xs">✕</span>
      </button>
    </span>
  );
}

/* ── Full-page filter drawer ─────────────────────────────────────────────── */

function FilterDrawer({
  mainCategories,
  dynamicGroups,
  materials,
  searchParams,
  onApply,
  onClose,
}: {
  taxonomy: TaxonomyGroupData[];
  mainCategories: TaxonomyTermData[];
  dynamicGroups: { groupSlug: string; param: string; label: string; terms: TaxonomyTermData[]; active: string[] }[];
  materials: string[];
  searchParams: ReturnType<typeof useSearchParams>;
  onApply: (params: URLSearchParams) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(() => {
    const p = new URLSearchParams(searchParams.toString());
    return p;
  });

  function getDraftMulti(key: string): string[] {
    const val = draft.get(key);
    return val ? val.split(",").filter(Boolean) : [];
  }

  function toggleDraft(key: string, value: string) {
    const next = new URLSearchParams(draft.toString());
    const current = getDraftMulti(key);
    const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    if (updated.length > 0) next.set(key, updated.join(","));
    else next.delete(key);
    next.delete("page");
    setDraft(next);
  }

  function toggleDraftSingle(key: string, value: string) {
    const next = new URLSearchParams(draft.toString());
    if (draft.get(key) === value) next.delete(key);
    else next.set(key, value);
    next.delete("page");
    setDraft(next);
  }

  function clearDraft() {
    setDraft(new URLSearchParams());
  }

  const checkClass = (active: boolean) =>
    `w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${active ? "bg-primary border-primary text-white" : "border-border bg-background"}`;

  const sectionHeading = "text-xs font-sans font-semibold uppercase tracking-[0.15em] text-on-surface-variant mb-3";

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-md bg-background h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-background border-b border-outline-variant">
          <h2 className="text-lg font-semibold text-on-surface font-sans">All Filters</h2>
          <button onClick={onClose} aria-label="Close filters" className="p-2 rounded-lg hover:bg-surface-container transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-8">
          {/* Categories */}
          {mainCategories.length > 0 && (
            <div>
              <h3 className={sectionHeading}>Category</h3>
              <div className="space-y-2">
                {mainCategories.map((cat) => {
                  const catActive = getDraftMulti("category").includes(cat.slug);
                  return (
                    <div key={cat.id}>
                      <button onClick={() => toggleDraft("category", cat.slug)} className="flex items-center gap-3 w-full py-1.5 text-sm font-sans text-on-surface hover:text-primary transition-colors cursor-pointer">
                        <span className={checkClass(catActive)}>{catActive && <Check />}</span>
                        {cat.label}
                      </button>
                      {cat.children.length > 0 && (
                        <div className="ml-8 space-y-1.5">
                          {cat.children.map((sub) => {
                            const subActive = getDraftMulti("category").includes(sub.slug);
                            return (
                              <button key={sub.id} onClick={() => toggleDraft("category", sub.slug)} className="flex items-center gap-3 w-full py-1 text-xs font-sans text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                                <span className={checkClass(subActive)}>{subActive && <Check />}</span>
                                {sub.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Occasion */}
          <div>
            <h3 className={sectionHeading}>Occasion</h3>
            <div className="space-y-2">
              {OCCASIONS.map((o) => {
                const active = getDraftMulti("occasion").includes(o.slug);
                return (
                  <button key={o.slug} onClick={() => toggleDraft("occasion", o.slug)} className="flex items-center gap-3 w-full py-1.5 text-sm font-sans text-on-surface hover:text-primary transition-colors cursor-pointer">
                    <span className={checkClass(active)}>{active && <Check />}</span>
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Style */}
          <div>
            <h3 className={sectionHeading}>Style</h3>
            <div className="space-y-2">
              {STYLES.map((s) => {
                const active = getDraftMulti("style").includes(s.slug);
                return (
                  <button key={s.slug} onClick={() => toggleDraft("style", s.slug)} className="flex items-center gap-3 w-full py-1.5 text-sm font-sans text-on-surface hover:text-primary transition-colors cursor-pointer">
                    <span className={checkClass(active)}>{active && <Check />}</span>
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic groups */}
          {dynamicGroups.map((d) => (
            <div key={d.param}>
              <h3 className={sectionHeading}>{d.label}</h3>
              <div className="space-y-2">
                {d.terms.map((t) => {
                  const active = getDraftMulti(d.param).includes(t.slug);
                  return (
                    <button key={t.id} onClick={() => toggleDraft(d.param, t.slug)} className="flex items-center gap-3 w-full py-1.5 text-sm font-sans text-on-surface hover:text-primary transition-colors cursor-pointer">
                      <span className={checkClass(active)}>{active && <Check />}</span>
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Rating */}
          <div>
            <h3 className={sectionHeading}>Rating</h3>
            <button onClick={() => toggleDraftSingle("minRating", "4")} className="flex items-center gap-3 w-full py-1.5 text-sm font-sans text-on-surface hover:text-primary transition-colors cursor-pointer">
              <span className={checkClass(draft.get("minRating") === "4")}>{draft.get("minRating") === "4" && <Check />}</span>
              4★ & up
            </button>
          </div>

          {/* In stock */}
          <div>
            <h3 className={sectionHeading}>Availability</h3>
            <button onClick={() => toggleDraftSingle("inStock", "1")} className="flex items-center gap-3 w-full py-1.5 text-sm font-sans text-on-surface hover:text-primary transition-colors cursor-pointer">
              <span className={checkClass(draft.get("inStock") === "1")}>{draft.get("inStock") === "1" && <Check />}</span>
              In stock only
            </button>
          </div>

          {/* Materials */}
          {materials.length > 0 && (
            <div>
              <h3 className={sectionHeading}>Material</h3>
              <div className="space-y-2">
                {materials.map((m) => {
                  const active = getDraftMulti("material").includes(m);
                  return (
                    <button key={m} onClick={() => toggleDraft("material", m)} className="flex items-center gap-3 w-full py-1.5 text-sm font-sans text-on-surface hover:text-primary transition-colors cursor-pointer">
                      <span className={checkClass(active)}>{active && <Check />}</span>
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center gap-3 px-6 py-4 bg-background border-t border-outline-variant">
          <button onClick={clearDraft} className="flex-1 py-3 rounded-lg border border-border text-sm font-sans font-medium text-on-surface hover:bg-surface-container transition-colors cursor-pointer">
            Clear all
          </button>
          <button onClick={() => onApply(draft)} className="flex-1 py-3 rounded-lg bg-primary text-on-primary text-sm font-sans font-medium hover:bg-on-primary-fixed-variant transition-colors cursor-pointer">
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
}

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,6 5,9 10,3" />
    </svg>
  );
}
