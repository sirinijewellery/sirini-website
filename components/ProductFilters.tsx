"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { SlidersHorizontal, X, ChevronLeft } from "lucide-react";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  const activeChips = buildActiveChips({
    activeCategories, activeOccasions, activeStyles, activeMaterials,
    minRating, inStock, dynamicGroups, mainCategories, dynamicLabel,
  });

  const sectionHeading = "text-[10px] font-sans font-semibold uppercase tracking-[0.18em] text-on-surface-variant mb-2";

  const checkClass = (active: boolean) =>
    `w-4 h-4 rounded border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${active ? "bg-primary border-primary text-white" : "border-on-surface-variant/40 bg-background"}`;

  const chipClass =
    "inline-flex items-center gap-1 shrink-0 pl-2.5 pr-1.5 py-0.5 rounded-full text-[11px] font-sans border border-primary/40 bg-primary/5 text-primary whitespace-nowrap";

  return (
    <>
      {/* ── DESKTOP SIDEBAR (lg+) ─────────────────────────────── */}
      <div className="hidden lg:block" data-sidebar-state={sidebarOpen ? "open" : "closed"}>
        {sidebarOpen ? (
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-4 pb-6 w-fit min-w-[170px] max-w-[220px]">
            {/* Sidebar header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs font-sans font-semibold uppercase tracking-[0.15em] text-on-surface">Filters</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded hover:bg-surface-container transition-colors cursor-pointer"
                aria-label="Collapse filters"
              >
                <ChevronLeft className="h-4 w-4 text-on-surface-variant" />
              </button>
            </div>

            {/* Active chips */}
            {hasFilters && (
              <div className="flex flex-wrap gap-1.5 mb-5 pb-4 border-b border-outline-variant">
                {activeChips.map((c) => (
                  <span key={c.key} className={chipClass}>
                    {c.label}
                    <button onClick={() => c.onRemove(toggleParam, removeParam)} aria-label={`Remove ${c.label}`} className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/15 cursor-pointer">
                      <span className="text-[9px]">✕</span>
                    </button>
                  </span>
                ))}
                <button onClick={clearAll} className="text-[11px] font-sans underline text-muted-foreground hover:text-primary cursor-pointer mt-0.5">
                  Clear all
                </button>
              </div>
            )}

            {/* Category */}
            {mainCategories.length > 0 && (
              <div className="mb-5">
                <h3 className={sectionHeading}>Category</h3>
                <div className="space-y-0.5">
                  {mainCategories.map((cat) => {
                    const catActive = activeCategories.includes(cat.slug);
                    return (
                      <div key={cat.id}>
                        <button onClick={() => toggleParam("category", cat.slug)} className="flex items-center gap-2 w-full py-1 text-[13px] font-sans text-on-surface hover:text-primary transition-colors cursor-pointer">
                          <span className={checkClass(catActive)}>{catActive && <Check />}</span>
                          {cat.label}
                        </button>
                        {cat.children.length > 0 && (
                          <div className="ml-6 space-y-0.5">
                            {cat.children.map((sub) => {
                              const subActive = activeCategories.includes(sub.slug);
                              return (
                                <button key={sub.id} onClick={() => toggleParam("category", sub.slug)} className="flex items-center gap-2 w-full py-0.5 text-[12px] font-sans text-muted-foreground hover:text-primary transition-colors cursor-pointer">
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
            <SidebarSection heading="Occasion" headingClass={sectionHeading}>
              {OCCASIONS.map((o) => (
                <CheckItem key={o.slug} label={o.label} active={activeOccasions.includes(o.slug)} onClick={() => toggleParam("occasion", o.slug)} checkClass={checkClass} />
              ))}
            </SidebarSection>

            {/* Style */}
            <SidebarSection heading="Style" headingClass={sectionHeading}>
              {STYLES.map((s) => (
                <CheckItem key={s.slug} label={s.label} active={activeStyles.includes(s.slug)} onClick={() => toggleParam("style", s.slug)} checkClass={checkClass} />
              ))}
            </SidebarSection>

            {/* Dynamic groups */}
            {dynamicGroups.map((d) => (
              <SidebarSection key={d.param} heading={d.label} headingClass={sectionHeading}>
                {d.terms.map((t) => (
                  <CheckItem key={t.id} label={t.label} active={d.active.includes(t.slug)} onClick={() => toggleParam(d.param, t.slug)} checkClass={checkClass} />
                ))}
              </SidebarSection>
            ))}

            {/* Rating */}
            <SidebarSection heading="Rating" headingClass={sectionHeading}>
              <CheckItem
                label="4★ & up"
                active={minRating === "4"}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (minRating === "4") params.delete("minRating");
                  else params.set("minRating", "4");
                  params.delete("page");
                  router.push(`/shop?${params.toString()}`);
                }}
                checkClass={checkClass}
              />
            </SidebarSection>

            {/* Availability */}
            <SidebarSection heading="Availability" headingClass={sectionHeading}>
              <CheckItem
                label="In stock only"
                active={inStock === "1"}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (inStock === "1") params.delete("inStock");
                  else params.set("inStock", "1");
                  params.delete("page");
                  router.push(`/shop?${params.toString()}`);
                }}
                checkClass={checkClass}
              />
            </SidebarSection>

            {/* Materials */}
            {materials.length > 0 && (
              <SidebarSection heading="Material" headingClass={sectionHeading}>
                {materials.map((m) => (
                  <CheckItem key={m} label={m} active={activeMaterials.includes(m)} onClick={() => toggleParam("material", m)} checkClass={checkClass} />
                ))}
              </SidebarSection>
            )}
          </div>
        ) : (
          /* Collapsed state: just a vertical strip */
          <div className="sticky top-24 flex flex-col items-start gap-2 pr-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans border border-border text-muted-foreground hover:border-primary hover:text-primary bg-background transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </button>
            {/* Active chips stacked vertically */}
            {activeChips.length > 0 && (
              <div className="flex flex-col gap-1 mt-1">
                {activeChips.map((c) => (
                  <span key={c.key} className={chipClass}>
                    {c.label}
                    <button onClick={() => c.onRemove(toggleParam, removeParam)} aria-label={`Remove ${c.label}`} className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/15 cursor-pointer">
                      <span className="text-[9px]">✕</span>
                    </button>
                  </span>
                ))}
                <button onClick={clearAll} className="text-[11px] font-sans underline text-muted-foreground hover:text-primary cursor-pointer mt-0.5">
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MOBILE: Filter button + chip row + drawer (< lg) ─── */}
      <div className="lg:hidden w-full space-y-3">
        {/* Active chips */}
        {hasFilters && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}>
            {activeChips.map((c) => (
              <span key={c.key} className={chipClass}>
                {c.label}
                <button onClick={() => c.onRemove(toggleParam, removeParam)} aria-label={`Remove ${c.label}`} className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-primary/15 cursor-pointer">
                  <span className="text-[10px]">✕</span>
                </button>
              </span>
            ))}
            <button onClick={clearAll} className="shrink-0 text-xs font-sans underline text-muted-foreground hover:text-primary whitespace-nowrap cursor-pointer">
              Clear all
            </button>
          </div>
        )}

        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-sans border border-border text-muted-foreground hover:border-primary hover:text-primary bg-background transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {hasFilters && <span className="ml-1 text-xs text-primary">({activeChips.length})</span>}
        </button>
      </div>

      {/* Mobile drawer */}
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
    </>
  );
}

/* ── Shared sub-components ─────────────────────────────────────────────── */

function SidebarSection({ heading, headingClass, children }: {
  heading: string; headingClass: string; children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <h3 className={headingClass}>{heading}</h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function CheckItem({ label, active, onClick, checkClass }: {
  label: string; active: boolean; onClick: () => void; checkClass: (a: boolean) => string;
}) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 w-full py-1 text-[13px] font-sans text-on-surface hover:text-primary transition-colors cursor-pointer">
      <span className={checkClass(active)}>{active && <Check />}</span>
      {label}
    </button>
  );
}

interface ActiveChip {
  key: string;
  label: string;
  onRemove: (toggle: (k: string, v: string) => void, remove: (...k: string[]) => void) => void;
}

function buildActiveChips({
  activeCategories, activeOccasions, activeStyles, activeMaterials,
  minRating, inStock, dynamicGroups, mainCategories, dynamicLabel,
}: {
  activeCategories: string[];
  activeOccasions: string[];
  activeStyles: string[];
  activeMaterials: string[];
  minRating: string;
  inStock: string;
  dynamicGroups: { groupSlug: string; param: string; label: string; terms: TaxonomyTermData[]; active: string[] }[];
  mainCategories: TaxonomyTermData[];
  dynamicLabel: (g: string, s: string) => string;
}): ActiveChip[] {
  const chips: ActiveChip[] = [];
  for (const slug of activeCategories) {
    chips.push({ key: `cat-${slug}`, label: findCategoryLabel(mainCategories, slug), onRemove: (t) => t("category", slug) });
  }
  for (const slug of activeOccasions) {
    chips.push({ key: `occ-${slug}`, label: OCCASIONS.find((o) => o.slug === slug)?.label || slug, onRemove: (t) => t("occasion", slug) });
  }
  for (const slug of activeStyles) {
    chips.push({ key: `sty-${slug}`, label: STYLES.find((s) => s.slug === slug)?.label || slug, onRemove: (t) => t("style", slug) });
  }
  for (const d of dynamicGroups) {
    for (const slug of d.active) {
      chips.push({ key: `${d.param}-${slug}`, label: dynamicLabel(d.groupSlug, slug), onRemove: (t) => t(d.param, slug) });
    }
  }
  if (minRating) chips.push({ key: "rating", label: `${minRating}★ & up`, onRemove: (_t, r) => r("minRating") });
  if (inStock) chips.push({ key: "stock", label: "In stock", onRemove: (_t, r) => r("inStock") });
  for (const m of activeMaterials) {
    chips.push({ key: `mat-${m}`, label: m, onRemove: (t) => t("material", m) });
  }
  return chips;
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

function Check() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,6 5,9 10,3" />
    </svg>
  );
}

/* ── Mobile filter drawer ──────────────────────────────────────────────── */

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
  const [draft, setDraft] = useState(() => new URLSearchParams(searchParams.toString()));

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
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-background border-b border-outline-variant">
          <h2 className="text-lg font-semibold text-on-surface font-sans">All Filters</h2>
          <button onClick={onClose} aria-label="Close filters" className="p-2 rounded-lg hover:bg-surface-container transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-8">
          {mainCategories.length > 0 && (
            <div>
              <h3 className={sectionHeading}>Category</h3>
              <div className="space-y-2">
                {mainCategories.map((cat) => {
                  const catActive = getDraftMulti("category").includes(cat.slug);
                  return (
                    <div key={cat.id}>
                      <button onClick={() => toggleDraft("category", cat.slug)} className="flex items-center gap-3 w-full py-1.5 text-sm font-sans text-on-surface hover:text-primary transition-colors cursor-pointer">
                        <span className={checkClass(catActive)}>{catActive && <DrawerCheck />}</span>
                        {cat.label}
                      </button>
                      {cat.children.length > 0 && (
                        <div className="ml-8 space-y-1.5">
                          {cat.children.map((sub) => {
                            const subActive = getDraftMulti("category").includes(sub.slug);
                            return (
                              <button key={sub.id} onClick={() => toggleDraft("category", sub.slug)} className="flex items-center gap-3 w-full py-1 text-xs font-sans text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                                <span className={checkClass(subActive)}>{subActive && <DrawerCheck />}</span>
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

          <div>
            <h3 className={sectionHeading}>Occasion</h3>
            <div className="space-y-2">
              {OCCASIONS.map((o) => {
                const active = getDraftMulti("occasion").includes(o.slug);
                return (
                  <button key={o.slug} onClick={() => toggleDraft("occasion", o.slug)} className="flex items-center gap-3 w-full py-1.5 text-sm font-sans text-on-surface hover:text-primary transition-colors cursor-pointer">
                    <span className={checkClass(active)}>{active && <DrawerCheck />}</span>
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className={sectionHeading}>Style</h3>
            <div className="space-y-2">
              {STYLES.map((s) => {
                const active = getDraftMulti("style").includes(s.slug);
                return (
                  <button key={s.slug} onClick={() => toggleDraft("style", s.slug)} className="flex items-center gap-3 w-full py-1.5 text-sm font-sans text-on-surface hover:text-primary transition-colors cursor-pointer">
                    <span className={checkClass(active)}>{active && <DrawerCheck />}</span>
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {dynamicGroups.map((d) => (
            <div key={d.param}>
              <h3 className={sectionHeading}>{d.label}</h3>
              <div className="space-y-2">
                {d.terms.map((t) => {
                  const active = getDraftMulti(d.param).includes(t.slug);
                  return (
                    <button key={t.id} onClick={() => toggleDraft(d.param, t.slug)} className="flex items-center gap-3 w-full py-1.5 text-sm font-sans text-on-surface hover:text-primary transition-colors cursor-pointer">
                      <span className={checkClass(active)}>{active && <DrawerCheck />}</span>
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <h3 className={sectionHeading}>Rating</h3>
            <button onClick={() => toggleDraftSingle("minRating", "4")} className="flex items-center gap-3 w-full py-1.5 text-sm font-sans text-on-surface hover:text-primary transition-colors cursor-pointer">
              <span className={checkClass(draft.get("minRating") === "4")}>{draft.get("minRating") === "4" && <DrawerCheck />}</span>
              4★ & up
            </button>
          </div>

          <div>
            <h3 className={sectionHeading}>Availability</h3>
            <button onClick={() => toggleDraftSingle("inStock", "1")} className="flex items-center gap-3 w-full py-1.5 text-sm font-sans text-on-surface hover:text-primary transition-colors cursor-pointer">
              <span className={checkClass(draft.get("inStock") === "1")}>{draft.get("inStock") === "1" && <DrawerCheck />}</span>
              In stock only
            </button>
          </div>

          {materials.length > 0 && (
            <div>
              <h3 className={sectionHeading}>Material</h3>
              <div className="space-y-2">
                {materials.map((m) => {
                  const active = getDraftMulti("material").includes(m);
                  return (
                    <button key={m} onClick={() => toggleDraft("material", m)} className="flex items-center gap-3 w-full py-1.5 text-sm font-sans text-on-surface hover:text-primary transition-colors cursor-pointer">
                      <span className={checkClass(active)}>{active && <DrawerCheck />}</span>
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

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

function DrawerCheck() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,6 5,9 10,3" />
    </svg>
  );
}
