// ─────────────────────────────────────────────────────────────────────────
// SERVER reads + helpers for the admin-managed taxonomy (groups/terms/links).
// Client-safe types live in lib/taxonomy.ts. Admin writes go through
// app/api/admin/taxonomy/*.
// ─────────────────────────────────────────────────────────────────────────
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { TaxonomyGroupData, TaxonomyTermData } from "@/lib/taxonomy";

type TermRow = {
  id: string;
  slug: string;
  label: string;
  blurb: string | null;
  coverImage: string | null;
  sortOrder: number;
  showInMenu: boolean;
  parentId: string | null;
};

function buildTree(flat: TermRow[]): TaxonomyTermData[] {
  const nodes = new Map<string, TaxonomyTermData>();
  for (const t of flat) nodes.set(t.id, { ...t, children: [] });
  const roots: TaxonomyTermData[] = [];
  for (const t of flat) {
    const node = nodes.get(t.id)!;
    if (t.parentId && nodes.has(t.parentId)) {
      nodes.get(t.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/** All groups with their terms (sub-terms nested). Cached per request. */
export const getTaxonomyTree = cache(async (): Promise<TaxonomyGroupData[]> => {
  const groups = await prisma.taxonomyGroup.findMany({
    orderBy: { sortOrder: "asc" },
    include: { terms: { orderBy: [{ sortOrder: "asc" }, { label: "asc" }] } },
  });
  return groups.map((g) => ({
    id: g.id,
    slug: g.slug,
    label: g.label,
    hierarchical: g.hierarchical,
    sortOrder: g.sortOrder,
    showInMenu: g.showInMenu,
    isSystem: g.isSystem,
    terms: buildTree(g.terms as TermRow[]),
  }));
});

/** Only groups + terms flagged showInMenu — drives the Shop mega-menu. */
export const getMenuTaxonomy = cache(async (): Promise<TaxonomyGroupData[]> => {
  const tree = await getTaxonomyTree();
  const prune = (terms: TaxonomyTermData[]): TaxonomyTermData[] =>
    terms
      .filter((t) => t.showInMenu)
      .map((t) => ({ ...t, children: prune(t.children) }));
  return tree
    .filter((g) => g.showInMenu)
    .map((g) => ({ ...g, terms: prune(g.terms) }))
    .filter((g) => g.terms.length > 0);
});

/**
 * For a category slug, return it plus all descendant sub-category slugs, so
 * filtering by a MAIN category includes its sub-categories. Non-category or
 * leaf slugs return just themselves.
 */
export async function expandCategorySlugs(slug: string): Promise<string[]> {
  const tree = await getTaxonomyTree();
  const category = tree.find((g) => g.slug === "category");
  if (!category) return [slug];
  const collect = (terms: TaxonomyTermData[]): string[] => {
    for (const t of terms) {
      if (t.slug === slug) {
        const out = [t.slug];
        const walk = (children: TaxonomyTermData[]) => {
          for (const c of children) {
            out.push(c.slug);
            walk(c.children);
          }
        };
        walk(t.children);
        return out;
      }
      const found = collect(t.children);
      if (found.length) return found;
    }
    return [];
  };
  const result = collect(category.terms);
  return result.length ? result : [slug];
}

/** Map { groupSlug -> termSlug[] } to the matching term IDs (category slugs
 *  are expanded to include sub-categories). Useful for product filtering. */
export async function termIdsForFilters(
  filters: Record<string, string[]>
): Promise<Record<string, string[]>> {
  const tree = await getTaxonomyTree();
  const out: Record<string, string[]> = {};
  for (const [groupSlug, slugs] of Object.entries(filters)) {
    if (!slugs?.length) continue;
    const group = tree.find((g) => g.slug === groupSlug);
    if (!group) continue;
    const wanted = new Set<string>();
    for (const s of slugs) {
      if (groupSlug === "category") {
        (await expandCategorySlugs(s)).forEach((x) => wanted.add(x));
      } else {
        wanted.add(s);
      }
    }
    const ids: string[] = [];
    const walk = (terms: TaxonomyTermData[]) => {
      for (const t of terms) {
        if (wanted.has(t.slug)) ids.push(t.id);
        walk(t.children);
      }
    };
    walk(group.terms);
    if (ids.length) out[groupSlug] = ids;
  }
  return out;
}

/**
 * Product IDs that match ALL of the provided dimension filters (AND across
 * groups, OR within a group). Returns null when no filters are supplied (so
 * the caller can skip filtering). Category filters include sub-categories.
 */
export async function productIdsForFilters(
  filters: Record<string, string[]>
): Promise<string[] | null> {
  const byGroup = await termIdsForFilters(filters);
  const groups = Object.values(byGroup);
  if (groups.length === 0) return null;

  let current: Set<string> | null = null;
  for (const termIds of groups) {
    const rows = await prisma.productTerm.findMany({
      where: { termId: { in: termIds } },
      select: { productId: true },
    });
    const ids = new Set<string>(rows.map((r) => r.productId));
    if (current === null) {
      current = ids;
    } else {
      const prev: Set<string> = current;
      current = new Set<string>([...prev].filter((id) => ids.has(id)));
    }
    if (current.size === 0) return [];
  }
  return current ? [...current] : [];
}

/** A product's assigned term slugs, grouped by dimension slug. */
export async function getProductTermsGrouped(
  productId: string
): Promise<Record<string, string[]>> {
  const rows = await prisma.productTerm.findMany({
    where: { productId },
    select: { term: { select: { slug: true, group: { select: { slug: true } } } } },
  });
  const out: Record<string, string[]> = {};
  for (const r of rows) {
    const g = r.term.group.slug;
    (out[g] ??= []).push(r.term.slug);
  }
  return out;
}
