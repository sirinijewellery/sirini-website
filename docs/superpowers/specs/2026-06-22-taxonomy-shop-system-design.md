# Taxonomy & Shop System — Design Spec

Date: 2026-06-22
Status: Awaiting owner review

## Goal

Replace the hardcoded, flat taxonomy (`NAV_CATEGORIES`, `OCCASIONS`, `STYLES` in
`lib/taxonomy.ts`) with a fully **admin-managed, dynamic, multi-dimension**
taxonomy: hierarchical product Categories plus several "Shop by ___"
dimensions, surfaced in a nested Shop mega-menu, the shop filters, search, and
the homepage — all editable (and extensible) from `/admin`.

## Confirmed decisions

1. **Products are tagged fresh by the owner** (no auto-migration of the 191
   existing products). A PENDING tracker surfaces untagged products.
2. **Collection replaces Style.** The old `Style` dimension is retired;
   `Collection` is canonical.
3. **The admin can create entirely new dimensions** (e.g. "Shop by Metal")
   later — so the model is a generic group/term engine, not fixed fields.

## Initial taxonomy content (owner can edit all of this in admin)

Categories are hierarchical (main → sub). All other dimensions are flat.

- **Categories**
  - Necklace Set › short necklaces, chokers, pendant set, long set, mangalsutra, groom mala
  - Earrings › jhumkis, studs, danglers, chandbalis
  - Bangles › kada, bracelets, pair bangle, jota
  - Accessories › anklet, maangtika, hathpan, belt, nath, kalgi, finger ring
- **Shop by Look** — western, traditional, indo-western, daily wear
- **Shop by Collection** — heritage, kundan, antique gold, temple, victorian, demi-fine
- **Shop by Stone** — polki kundan, ruby, emerald, kemp
- **Shop by Colour** — white, ruby, mint, pink, mint+pink, green, others
- **Shop by Occasion** (existing) — bridal, festive, party, daily

No cover images are added now; every term's image starts blank.

## Data model (Prisma)

```
model TaxonomyGroup {
  id          String   @id @default(cuid())
  slug        String   @unique          // "category", "look", "collection", "stone", "colour", "occasion"
  label       String                    // menu heading, e.g. "Shop by Look"
  hierarchical Boolean @default(false)  // true only for "category" (supports sub-terms)
  sortOrder   Int      @default(0)
  showInMenu  Boolean  @default(true)    // appears in the Shop mega-menu
  isSystem    Boolean  @default(false)   // built-in groups can't be deleted, only edited
  terms       TaxonomyTerm[]
}

model TaxonomyTerm {
  id          String   @id @default(cuid())
  groupId     String
  group       TaxonomyGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  parentId    String?       // for sub-categories
  parent      TaxonomyTerm? @relation("TermChildren", fields: [parentId], references: [id])
  children    TaxonomyTerm[] @relation("TermChildren")
  slug        String        // unique within a group
  label       String
  blurb       String?
  coverImage  String?
  sortOrder   Int      @default(0)
  showInMenu  Boolean  @default(true)
  products    ProductTerm[]
  @@unique([groupId, slug])
  @@index([groupId])
  @@index([parentId])
}

model ProductTerm {            // product <-> term many-to-many
  productId String
  termId    String
  product   Product      @relation(fields: [productId], references: [id], onDelete: Cascade)
  term      TaxonomyTerm @relation(fields: [termId], references: [id], onDelete: Cascade)
  @@id([productId, termId])
  @@index([termId])
}
```

`Product` gains `terms ProductTerm[]`. The existing `categories[] / occasions[]
/ styles[] / tags[]` arrays are **left in place** (not dropped) so nothing
breaks mid-transition; the new system reads `ProductTerm`. `styles[]` simply
stops being surfaced.

Rationale: a join table (not per-dimension array fields) is required because
dimensions are dynamic (decision 3). A generic group/term/link model lets the
owner add a whole new "Shop by X" with zero code.

## Transition strategy (live shop must not go blank)

Because products start untagged in the new system, category/dimension pages
would be empty until the owner tags them. To keep the live shop populated:

- The main `/shop` (no filter) is unaffected — it lists all products.
- Dimension filters match a product if it has the new `ProductTerm` **OR** the
  matching legacy slug in its existing `categories[]/occasions[]` array
  (a thin compatibility layer in `getProducts`). As the owner tags products the
  new data takes over; the legacy fallback can be removed later.
- The homepage "Shop by Category" cards link to the new category terms; until
  cover images are set they render as text/label cards (existing CategoryGrid
  already handles imageless categories gracefully — confirm).

## Shop mega-menu (rebuilt, dynamic)

- Driven by `TaxonomyGroup` + `TaxonomyTerm` where `showInMenu` is true.
- **Shop by Category** column lists the 4 mains. Hovering/focusing a main
  reveals its sub-categories in a flyout (keyboard-accessible). Clicking a
  **main** → `/shop?category=<main>` which includes the main **and all its
  sub-categories**; clicking a **sub** → `/shop?category=<sub>`.
- Additional columns render each non-category `showInMenu` group (Look,
  Collection, Stone, Colour, Occasion) → `/shop?<group>=<term>`.
- Server-rendered data (a cached `getMenuTaxonomy()` query) passed into the
  existing client `MegaMenu` so it stays fast.

## Shop filtering & search

- `getProducts` accepts a generic `{ group: slug[] }` filter set
  (category/look/collection/stone/colour/occasion). Category filter expands a
  parent slug to parent + child slugs.
- Search: term labels are indexed; query is lower-cased (already
  case-insensitive). Searching a term label (e.g. "chokers", "ruby") filters to
  it. Replaces the hardcoded `matchCategorySlugs` patterns with a DB-backed
  label match (keep a few synonym patterns).

## Admin

- **New "Shop" section** (sidebar entry) with a tab per dimension: Categories
  (hierarchical add: main + sub), Looks, Collections, Stones, Colours,
  Occasions — plus an **"+ Add dimension"** action (decision 3) to create a new
  group. Each tab: add/edit/reorder/delete terms, `showInMenu` toggle, blurb,
  and a **browsable cover image** (reusing the category Browse-upload control).
- **Product form**: a multi-select per dimension (categories incl. sub, looks,
  collections, stones, colours, occasions), writing `ProductTerm` rows.
- **PENDING tab** (sidebar): a live checklist of actionable gaps — e.g.
  "N products have no category", "N products untagged in the new taxonomy",
  "terms without a cover image". Each links to the relevant filtered admin list.
  When the list is empty the PENDING entry moves to the **bottom** of the
  sidebar (and shows a done state).
- **Admin title link**: the "Sirini Admin Management Panel" heading (top-left of
  `AdminSidebar`) becomes a link to `/admin`.

## Homepage

The homepage is already section-registry driven (`home.sections`). Changes:
- New default order: **Shop by Category → Shop by Occasion → Shop by Collection
  → …** (then the rest).
- A new **Shop by Collection** homepage section (renders Collection terms).
- Move the **Story (BrandStory)** section **below Testimonials**.
- No cover images yet.

## Build staging

- **Stage 1 — Data + admin:** schema (groups/terms/join) + seed the structure
  above; admin "Shop" section (all dimension tabs + add-dimension + cover
  upload); product-form multi-assign; PENDING tab; admin-title link.
- **Stage 2 — Storefront:** dynamic mega-menu; `getProducts`/search over the new
  dimensions (with legacy compat); homepage reorder + Shop-by-Collection
  section + Story-below-Testimonials.

Each stage is `tsc` + `npm run build` verified and committed before the next.

## Out of scope (for now)

- Auto-tagging existing products (owner does it).
- Cover images (added later by owner).
- Per-term SEO copy blocks (the current hardcoded `SEO_COPY` stays until asked).
- Removing the legacy `categories[]/occasions[]/styles[]` arrays (kept as a
  compatibility fallback; cleaned up in a later pass once tagging is complete).
