# Sirini Jewellery — Manual SEO/AEO/GEO Audit Report

**2026-07-19** · One-off SEO + AEO + GEO audit & implementation · **Committed; awaiting orchestrator deploy**

## Summary

This was a manual increment on top of the automated early-morning run (`report-2026-07-19-early.md`), which had just cleared a large backlog (rate limiting, the 96-row "22kt→18–22K" DB migration, `ProductJsonLd` shipping/return fixes, `HeroCarousel` CWV, the checkout race-condition). I did **not** redo or contradict any of that.

The audit confirmed this store is, at the structured-data / metadata / crawlability level, **already near-exhaustively optimised**: correct per-route metadata + canonicals + OG/Twitter, a clean 626-URL sitemap whose faceted `/shop?…` entries exactly match the page's own `index/noindex` logic (no noindex-in-sitemap conflict), a correct `robots.txt`, a high-quality `llms.txt`, and valid Product / Breadcrumb / ItemList / FAQPage / BlogPosting / CollectionPage / WebSite(+SearchAction) / Organization / JewelryStore JSON-LD with visible breadcrumbs and good internal linking. Live prod was cross-checked against code and matched.

**The one genuine, current, high-value gap found:** the three site-identity JSON-LD nodes — `Organization`, `WebSite`, and `JewelryStore` (LocalBusiness) — were rendered as **three disconnected nodes all named "Sirini Jewellery" with no `@id`**, so a graph-aware consumer (Google's entity pipeline, and AI answer engines doing entity resolution for GEO) could read them as up to three separate businesses. This run connects them into a single knowledge-graph entity via shared `@id`s, and threads Products and blog articles into that same graph. Additive-only, deterministic, `tsc`/`eslint`/`build` all clean.

---

## Audit findings

| Area | Finding | Severity | Status |
|---|---|---|---|
| Entity JSON-LD graph | `Organization` (homepage), `WebSite` (site-wide), `JewelryStore`/LocalBusiness (site-wide) all describe the same brand but carried **no `@id`** and no cross-references. Confirmed on live prod: home renders `WebSite` + `Organization` + `JewelryStore` as standalone nodes; grepping the homepage HTML for `@id` returned nothing. This weakens entity consolidation for both Google's Knowledge Graph and GEO answer-engine citation. | 🟡 Medium | 🟢 **Fixed** |
| GEO expertise/coverage signals | `Organization` stated `foundingDate` but no machine-readable `areaServed` or `knowsAbout` — the exact fields answer engines use to categorise "what is this brand / what does it know about / where does it serve". | 🟢 Low | 🟢 **Fixed** — added `areaServed: India` and a `knowsAbout` topic list. |
| `sitemap.xml` vs `/shop` robots logic | Cross-checked the 626-entry sitemap's faceted `/shop?occasion=…`, `?style=…`, `?category=…`, `?collection=…` URLs against `app/shop/page.tsx`'s `isCleanSingleFacet` gate. Every faceted URL in the sitemap is a single-facet, page-1, no-refinement URL — exactly the set the page marks `index:true` and self-canonicalises. **No noindex-in-sitemap conflict.** | — | 🟢 Verified OK |
| `robots.txt` / `llms.txt` / canonicals / OG / Twitter | Fetched live. `robots.txt` disallows admin/api/cart/checkout/account/wishlist/order-confirmation/login/register + 2 sitemaps. `llms.txt` is a strong, accurate llmstxt.org-format brand map (Mumbai, 2017, Kundan/Meenakari/Polki, category/occasion/style links). Per-route metadata, canonicals, and social cards all correct. | — | 🟢 Verified OK, no change |
| `Product` / `Breadcrumb` / `ItemList` / `FAQPage` JSON-LD | Product schema is comprehensive (offers, `priceValidUntil` deterministic, `MerchantReturnPolicy`, `OfferShippingDetails`, aggregateRating/review when present). Breadcrumbs are paired with visible nav on every relevant route. `/shop` emits `ItemList`; `/faq` emits `FAQPage` from the same `getFaq()` source as the visible list. | — | 🟢 Verified OK |
| Image alt / CWV patterns | Spot-checked about/blog/occasions/product images — all have meaningful `alt`; `next/image` sizing + `preload`/`fetchPriority` + Cloudinary `preconnect` already in place (per prior run). | — | 🟢 Verified OK |
| AEO — blog `HowTo` opportunity | The two how-to guides (`how-to-style-kundan-bridal`, `jewellery-care-guide`) read as candidates for `HowTo` markup. | — | 🔵 **Deliberately deferred** (see below) |

---

## What was fixed (files)

A single connected entity graph, built from shared `@id`s that every node either declares or references. All values are static/deterministic (safe for ISR; no `Date.now()`/`Math.random()`), and the only image URL involved is the already-transformed brand-logo asset (not a raw product image, so `botImageUrl()` correctly does not apply).

1. **`components/OrganizationJsonLd.tsx`** — added `"@id": "{SITE_URL}/#organization"`; added GEO signals `areaServed` (Country: India) and `knowsAbout` (Kundan / Meenakari / Polki / gold-plated / bridal).
2. **`components/LocalBusinessJsonLd.tsx`** — added the **same** `"@id": "{SITE_URL}/#organization"`. Because a `JewelryStore` is an `Organization`, sharing the id merges the store's `geo`/`priceRange`/`openingHours` with the Organization's `foundingDate`/`contactPoint`/`knowsAbout` into one richer entity for graph consumers.
3. **`components/WebSiteJsonLd.tsx`** — added `"@id": "{SITE_URL}/#website"`, `inLanguage: "en-IN"`, and `publisher: { "@id": "{SITE_URL}/#organization" }`.
4. **`components/ProductJsonLd.tsx`** — added `"@id": "{SITE_URL}/#organization"` to `offers.seller` so every product's seller resolves to the one brand entity.
5. **`app/blog/[slug]/page.tsx`** — `BlogPosting` now sets `isPartOf: { "@id": "#website" }` and gives both `author` and `publisher` the `"@id": "#organization"` reference (the `#website`/`#organization` nodes render site-wide via the root layout, so these references resolve on every blog page).
6. **`app/blog/page.tsx`** — `CollectionPage` (Journal index) now sets `isPartOf: { "@id": "#website" }`.

**Why "same `@id`, different `@type`" is safe:** graph-aware parsers (Google) merge the `Organization` and `JewelryStore` scripts by id into one node typed as both — the intended, documented pattern. Non-graph parsers read each `<script>` independently and see exactly what they saw before, so there is no regression path.

---

## Verification evidence

- `npx tsc --noEmit` → clean (`TSC_OK`).
- `npx eslint` on all 6 changed files → clean (`ESLINT_OK`).
- `DOTENV_CONFIG_PATH=.env.local npm run build` → succeeded; full route table emitted, no errors from the changes; product/blog SSG + ISR windows unchanged.
- Live-prod baseline captured before edits: homepage rendered `WebSite`/`Organization`/`JewelryStore` with **no** `@id`; a sampled product page rendered `Product`/`Offer`/`Breadcrumb` + the two global entity nodes. Post-deploy the orchestrator can confirm the same URLs now expose `"@id":"…/#organization"` and `"@id":"…/#website"` with the `WebSite.publisher` / `Product.seller` / `BlogPosting.publisher` references pointing at them.

---

## Deliberately deferred

- **`HowTo` structured data on the two how-to blog posts.** Google **removed HowTo rich results entirely in Sept 2023**, so it yields zero Google benefit today; and the articles' `body` sections are multi-paragraph editorial prose, not atomic single-action steps, so forcing them into `HowToStep` would be low-quality markup for a negligible answer-engine gain. The existing `BlogPosting` + clean `<h2>` headings already convey the structure to AI crawlers.
- **Owner-decision items carried over from the early-morning run (unchanged, not re-litigated):** FAQ "7-day exchange" vs Shipping "7-day return" framing; the "Who made this website?" developer-credit Q&A inside the customer FAQPage; the `HeroSlide` per-slide alt-text schema migration; the `npm audit` moderate transitive advisories (no safe unattended fix on Next 16 / Prisma 7); the `sirini-world`/`sfj-world` source-vs-shipped stale-facts note.
- **Physically merging `Organization` + `JewelryStore` into one `@type: ["Organization","JewelryStore"]` node.** The shared-`@id` approach already achieves the same merged graph without changing which component renders on which route (Organization is homepage-only, JewelryStore is site-wide).
