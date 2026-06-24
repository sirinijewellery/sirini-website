# Design: Admin & Storefront Fixes — 2026-06-24

## Scope

Five independent fixes across admin panel and storefront. Each can be implemented in parallel.

---

## 1. Hero Admin — Default Image Visible & Manageable (Option A)

**Problem:** When no HeroSlide DB records exist, the storefront shows a hardcoded default image (`hero-editorial.png`). The admin Hero tab shows "No slides yet" — the owner can't see, crop, or manage the default image.

**Design:** `HeroManager` receives a new optional `defaultImageUrl` prop (from `DEFAULT_HERO_IMAGE`). When `slides` is empty, render the default image as a synthetic "Slide 1" card using the same desktop+mobile focal-point picker UI. A "Replace" button lets the owner upload their own image, which creates a real DB record and takes over. The default is never written to DB — it just fills the visual gap until a real slide is added. Once at least one real slide exists, the fallback card is hidden.

**Files:** `components/admin/HeroManager.tsx`, `app/admin/page.tsx` (passes `defaultImageUrl`).

---

## 2. Announcement Bar — Remove Hardcoded CountdownBanner

**Problem:** Two ribbons appear: a hardcoded "FESTIVE SALE / FESTIVE10" countdown strip + the admin-managed rotating ribbon. FESTIVE10 coupon doesn't exist, causing confusion.

**Design:** Remove the `<CountdownBanner />` from `app/layout.tsx`. Delete `components/CountdownBanner.tsx` and `lib/saleConfig.ts`. The admin-managed `RibbonManager` ribbon remains as the single announcement bar.

**Files:** `app/layout.tsx`, delete `components/CountdownBanner.tsx`, delete `lib/saleConfig.ts`.

---

## 3. Admin Categories Tab — Remove Legacy Section

**Problem:** Admin categories page still shows a legacy "CategoriesClient" section beneath the taxonomy categories manager.

**Design:** Remove the legacy Prisma query for old `Category` records and the `<CategoriesClient>` render from `app/admin/categories/page.tsx`. Only `TaxonomyCategoriesClient` remains.

**Files:** `app/admin/categories/page.tsx`.

---

## 4. Shop Mega-Menu — First Column Fully Visible

**Problem:** "Shop by Category" first column in the mega-menu isn't showing properly. Root cause: taxonomy terms in the "category" group don't have `showInMenu: true`, so `getMenuTaxonomy()` returns an empty array and the column is omitted.

**Design:** Enable `showInMenu: true` on the "category" TaxonomyGroup and its main terms (Necklace Set, Earrings, Bangles, Accessories) via Prisma migration or seed update. If it's a layout issue (column clipped), widen the panel or fix the grid. Verify in browser after data fix.

**Files:** Prisma seed or direct DB update via admin API. `components/MegaMenu.tsx` grid layout if needed.

---

## 5. Remove Price Filter from Shop Page

**Problem:** A price filter still appears in the shop page filters.

**Design:** Remove any price-range or price-sort controls from `components/ProductFilters.tsx` and `components/SortSelect.tsx` (already done for SortSelect — verify ProductFilters).

**Files:** `components/ProductFilters.tsx`.
