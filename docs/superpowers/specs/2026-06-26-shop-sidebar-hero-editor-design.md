# Shop Sidebar Filters + Admin Hero Editor

**Date:** 2026-06-26  
**Status:** Approved for implementation

## Feature 1: Shop Sidebar Filters

### Current State
Filters render as horizontal pill rows stacked above the product grid, pushing products far down the page. All filter rows (Category, Occasion, Style, Collection, Look, Stone, Colour, Rating, In Stock, Material) display simultaneously.

### Design
Replace horizontal pills with a persistent vertical sidebar on the left (desktop only). Mobile keeps the existing slide-over drawer pattern.

**Sidebar (desktop, lg+):**
- Content-fitted width (~180px based on longest label, max 220px)
- Collapsible via X button in header; "Filters" button re-opens
- When collapsed: just a "Filters" toggle button + active filter chips stacked vertically, products expand to 4 columns
- When expanded: checkbox-style filters grouped by dimension, products in 3 columns beside it
- All categories show subcategories indented below them, visible by default (not collapsed)
- Each dimension section: uppercase label + checkbox items
- Sidebar scrolls independently if taller than viewport (sticky top)

**Mobile (< lg):**
- No sidebar visible
- "Filters" button opens the existing full-screen slide-over drawer (already built)
- No changes to mobile behavior

**Layout change in `app/shop/page.tsx`:**
- Wrap filters + products in a flex row on desktop
- Sidebar on left, product area (sort + grid + pagination) on right

### Files Changed
- `components/ProductFilters.tsx` — rewrite as vertical sidebar
- `app/shop/page.tsx` — flex layout wrapping sidebar + products

## Feature 2: Admin Hero Image Editor

### Current State
- Upload hero images, set focal point by clicking on preview
- Desktop (16:9) and mobile (9:16) previews with small focal-point dot
- Optional separate mobile image upload
- No image replacement (must delete + re-add)
- No live preview of final render
- No image adjustments

### Design
Upgrade HeroManager with:

1. **Replace image button** — swap an existing slide's image without deleting (preserves order, active state, focal points)
2. **Improved crop/focal UI** — larger previews with the draggable focal-point dot, plus a visible viewport rectangle showing the crop area
3. **Live preview section** — full-width desktop (16:9) and mobile (9:16) previews showing exactly how visitors see the hero, including the site's gradient overlays
4. **Adjustment sliders** — brightness, contrast, overlay darkness. CSS filter values stored on the slide, applied at render time by HeroCarousel
5. **Multiple images** — already supported (add another slide), but improve the UX flow

### Schema Changes
Add to `HeroSlide` model:
```
brightness     Float    @default(1.0)
contrast       Float    @default(1.0)
overlayOpacity Float    @default(0.4)
```

### Files Changed
- `prisma/schema.prisma` — add brightness/contrast/overlayOpacity fields
- `components/admin/HeroManager.tsx` — full rewrite with new UI
- `components/HeroCarousel.tsx` — apply CSS filters from slide data
- `lib/queries/site.ts` — add new fields to HeroSlideData + query
- `app/api/admin/hero/route.ts` — accept new fields on POST
- `app/api/admin/hero/[id]/route.ts` — accept new fields on PATCH
