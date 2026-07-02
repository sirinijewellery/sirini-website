# Sirini Jewellery — Project Handoff

Living context for continuing in a fresh Claude Code session. Read this first.
`AGENTS.md` / `CLAUDE.md` auto-load too. Git history + full codebase are present.

---

## What this is
Production e-commerce site for **Sirini Jewellery** (Mumbai handcrafted fashion
jewellery — Kundan, Meenakari, gold-plated). Live at **https://sirinijewellery.com**
(Vercel, auto-deploys from `main`). Owner manages everything from `/admin`.

---

## ⭐ Latest session — 2026-06-30 (read this first)

Recent commits (newest first):
- `d8d43aa` On-demand revalidation on product create/update/delete (targeted `revalidatePath`
  for `/shop/<slug>`, `/shop`, `/` — never the broad `"/","layout"` nuke). Edits show instantly.
- `615904a` Hero animations: centre-out **curtain reveal**, word-by-word **split-text headline**,
  **magnetic CTA**. CSS in `app/globals.css` (`.hero-curtain`, `.word-rise`); logic in `HeroCarousel.tsx`.
- `e60a99d` **Infra cost fixes** (both free tiers were maxed):
  - *Vercel ISR writes* hit 100% of free 200k. Cause: `components/ProductJsonLd.tsx` used
    `Date.now()` for `priceValidUntil`, so every product page's JSON-LD differed every render →
    every revalidation = a write. Fixed → deterministic `${nextYear}-12-31`.
  - *Cloudinary* at 112% of free 25 credits. Trimmed `next.config.ts` `deviceSizes`/`imageSizes`
    (8+8 → 4+3) + hero `quality` 90 → 75.
- `7dff052` Hero image = emerald-necklace "cleaned_hero" at Cloudinary public_id
  **`hero-editorial-3`** (`lib/queries/site.ts` `DEFAULT_HERO_IMAGE`).
- `dd73ff0` 4 "easy" animations: navbar shrink-on-scroll, product card hover lift,
  gold focus glow on inputs, page-fade `app/template.tsx`.

**Open / next:**
- [ ] **Monitor free-tier usage for a few days.** Cloudinary dashboard → is the overage
  Transformations / Storage / Bandwidth? (fixes target transforms+bandwidth; quota resets monthly;
  upgrade Plus $89/mo only if real bandwidth growth persists). Vercel → ISR Writes chart should
  flatten hard after the determinism fix (should stay on free Hobby).

**Two hard-won gotchas (don't relearn these):**
1. **Cloudinary image won't change for users?** Overwriting a public_id doesn't reliably bump the
   version, and browsers cache derived images 30 days (`max-age=2592000`); a versionless URL never
   busts. ALWAYS upload under a NEW public_id (`…-2`, `…-3`) and point code at the new versioned URL.
   Tool: `scripts/upload-hero.ts` (env `HERO_SRC`, `HERO_PUBLIC_ID`). Verify by hashing:
   `curl -s "<prod transformed url>" | md5sum` vs the local source.
2. **Keep ISR output deterministic** — any `Date.now()`/`Math.random()`/per-render timestamp in an
   ISR page makes every revalidation a costly write. All custom animations live in `app/globals.css`
   behind one `prefers-reduced-motion` guard — add new ones there.

See the project skill **`/deploy-and-verify`** (`.claude/skills/deploy-and-verify/`) for the full
ship → verify-on-prod loop.

---

## Stack & critical gotchas

| Layer | Detail |
|---|---|
| **Next.js 16** (App Router, Turbopack) | *Modified* — APIs differ from training data. Middleware = **`proxy.ts`** not middleware.ts. `next/image` uses **`preload`** not `priority`. Read `node_modules/next/dist/docs/` before relying on Next behaviour. |
| **Prisma 7 + Neon** | `PrismaPg` adapter. Schema: `prisma/schema.prisma`. Run scripts against live Neon only. |
| **Tailwind v4** | Design tokens as CSS custom properties in `app/globals.css`. `@theme inline`. No `tailwind.config.js`. |
| **NextAuth v5 (Auth.js)** | JWT sessions. `auth()` in server components. `isAdmin` flag on user. |
| **Cloudinary** | Custom loader `lib/cloudinaryLoader.ts`, cloud `dp8a2lvxg`. Upload endpoint `POST /api/admin/products/upload` (FormData `{file}` → `{url}`). |
| **Razorpay** | Live keys are Vercel env only. `computeTotals()` in `lib/commerce/pricing.ts` is used by both client + server to avoid paise mismatch. |

---

## How to work in this repo

```bash
# Type-check
npx tsc --noEmit

# Production build (verifies everything)
DOTENV_CONFIG_PATH=.env.local npm run build

# DB schema change
# 1. Edit prisma/schema.prisma
# 2. DOTENV_CONFIG_PATH=.env.local npx prisma db push
# 3. npx prisma generate

# Run a one-off script against live Neon DB
DOTENV_CONFIG_PATH=.env.local npx tsx -r dotenv/config scripts/<file>.ts

# Deploy = git push to main (Vercel auto-builds, ~2-3 min)
```

LF→CRLF warnings on Windows are benign. Always `tsc` + production build before push.

---

## Architecture quick map

```
app/
  page.tsx                  Homepage (section-registry driven via home.sections setting)
  shop/                     Shop listing (dynamic, server-rendered)
  shop/[slug]/              Product detail (ISR, generateStaticParams)
  admin/                    Admin panel (isAdmin gated via layout.tsx)
    layout.tsx              Fetches pendingCount → AdminSidebar
    pending/page.tsx        PENDING tab (untagged products + terms missing covers)
    shop/page.tsx           Taxonomy/Shop-by dimension manager
    products/, orders/, categories/, coupons/, hero/, ribbons/, blog/, settings/*
  api/admin/
    taxonomy/               CRUD for TaxonomyGroup + TaxonomyTerm
    products/, categories/, settings/, blog/, ...

lib/
  taxonomy.ts               CLIENT-SAFE: types TaxonomyGroupData/TaxonomyTermData,
                            PRICE_BUCKETS, SYSTEM_GROUP_SLUGS. NO prisma import.
  queries/taxonomy.ts       SERVER: getTaxonomyTree, getMenuTaxonomy,
                            expandCategorySlugs, productIdsForFilters,
                            getProductTermsGrouped
  queries/products.ts       getProducts (now accepts collection/look/stone/colour),
                            getShopCategories, getMaterials
  queries/home.ts           Homepage section getters (getHomeCategories reads taxonomy)
  queries/catalog.ts        getBadges, getLowStockThreshold, getHideOutOfStock, getDefaultSort
  queries/commerce.ts       getCommerceSettings (GST, gift-wrap, COD, shipping)
  queries/content.ts        getAbout, getShipping, getPrivacy, getTerms, getFaq
  queries/theme.ts          getThemeSettings
  queries/pending.ts        getPendingItems / getPendingCount (sidebar badge)
  queries/site.ts           getSetting, hero slides
  commerce/pricing.ts       computeTotals() — shared by CheckoutForm + checkout API routes
  catalog.ts                CLIENT-SAFE: BadgeDef, DEFAULT_BADGES, catalog constants
  seo.ts                    baseMetadata, siteConfig, productMetadata
  blog.ts                   getAllArticles (async, DB + SEED_ARTICLES fallback)

components/
  MegaMenu.tsx              "use client" — accepts groups: TaxonomyGroupData[]
  NavbarWrapper.tsx         async SERVER — fetches getMenuTaxonomy(), passes to NavbarGate
  NavbarGate.tsx            "use client" — usePathname admin gate
  Navbar.tsx                accepts groups prop, mobile drawer
  admin/AdminSidebar.tsx    pendingCount prop; title → live site; AdminQuickNav below it
  admin/AdminQuickNav.tsx   "tell me what you want to do" launcher
  admin/ProductForm.tsx     taxonomy multi-select (selectedTermIds → termIds in payload)
  admin/ShopTaxonomyManager.tsx   CRUD UI for /admin/shop
  ShopByOccasion.tsx, ShopByCollection.tsx   Homepage sections
```

---

## The taxonomy / Shop-by system (shipped 2026-06-22)

### Data model
```prisma
TaxonomyGroup { id, slug(unique), label, hierarchical, sortOrder, showInMenu, isSystem }
TaxonomyTerm  { id, groupId, parentId?, slug(unique within group), label, blurb?, coverImage?,
                sortOrder, showInMenu }
ProductTerm   { productId, termId }  ← many-to-many join
```
Product also has `terms ProductTerm[]`.

### Seeded dimensions (6 groups, 50 terms)
| Group slug | Type | Terms |
|---|---|---|
| `category` | hierarchical | **Necklace Set** (short necklaces, chokers, pendant set, long set, mangalsutra, groom mala) · **Earrings** (jhumkis, studs, danglers, chandbalis) · **Bangles** (kada, bracelets, pair bangle, jota) · **Accessories** (anklet, maangtika, hathpan, belt, nath, kalira, sheeshphool) |
| `occasion` | flat | bridal, festive, party, daily |
| `collection` | flat | heritage, kundan, antique gold, temple, victorian, demi-fine |
| `look` | flat | western, traditional, indo-western, daily wear |
| `stone` | flat | polki kundan, ruby, emerald, kemp |
| `colour` | flat | white, ruby, mint, pink, mint+pink, green, others |

Owner can add whole new dimensions from `/admin/shop`.

### Legacy-compat (critical — live shop is not empty pre-tagging)
Products are **currently UNTAGGED** in the new system (owner tags them over time).
`getProducts()` matches a product if it has a `ProductTerm` OR its legacy
`categories[]` / `occasions[]` slug array contains the slug. So earrings/bangles
still populate (exact slug match). New slugs like `necklace-set` (singular, vs
old `necklace-sets` plural) only populate after the owner tags.

### PENDING tab
`/admin/pending` tracks: products missing a category term, products with no terms,
terms missing a cover image. Count shown as badge on sidebar (top when >0, bottom
when 0). `lib/queries/pending.ts` → `getPendingCount()` feeds `AdminSidebar`.

---

## Admin panel — complete surface map

| URL | Purpose |
|---|---|
| `/admin` | Dashboard |
| `/admin/orders` | Order list + detail |
| `/admin/products` | Product list; `/new` + `/[id]/edit` |
| `/admin/categories` | Legacy category CRUD + image browse-upload |
| `/admin/shop` | **Taxonomy/Shop-by CRUD** (new) |
| `/admin/pending` | **PENDING checklist** (new) |
| `/admin/coupons` | Coupon CRUD |
| `/admin/hero` | Hero slides (image, focal, duration) |
| `/admin/ribbons` | Header announcement ribbon |
| `/admin/blog` | Blog/Journal CMS |
| `/admin/settings` | Hub → 6 sub-pages |
| `/admin/settings/business` | Contact, social, address |
| `/admin/settings/homepage` | Promo banner, trust badges, section order |
| `/admin/settings/commerce` | GST, gift-wrap, shipping, COD |
| `/admin/settings/catalog` | Badges, low-stock, hide-sold-out, default sort |
| `/admin/settings/content` | About, Shipping, Privacy, Terms, FAQ |
| `/admin/settings/theme` | Brand colours, font pairing |
| `/admin/admins` | Admin user management |
| `/admin/help` | Searchable how-to guide |
| `/admin/account` | Own profile / password |

### Settings pattern
Every setting is a `Setting { key, value(JSON) }` row. Generic `PATCH /api/admin/settings`
accepts `{key, value}`. Keys namespaced: `commerce.*`, `home.*`, `content.*`,
`catalog.*`, `theme.*`. Server getters in `lib/queries/*` wrapped in `cache()`.
Golden rule: **defaults always equal the current live value** so deploy changes nothing
until the owner edits.

### Auth pattern (admin API routes)
```ts
const session = await auth();
if (!session?.user?.isAdmin) return NextResponse.json({error:"Forbidden"},{status:403});
```
Admin page guard: `if (!session?.user?.isAdmin) redirect("/login?callbackUrl=/admin/...");`

---

## Homepage (section-registry driven)
Default section order (editable at `/admin/settings/homepage`):
**hero → trust strip → Shop by Category → Shop by Occasion → Shop by Collection →
featuredProducts → bestsellers → shopByPrice → pullQuote → testimonials →
brandStory → instagram → newsletter → askAI**

`CategoryGrid` now reads the taxonomy `category` group's mains (not `prisma.category`).
`ShopByOccasion` + `ShopByCollection` are new components registered in `app/page.tsx`.

---

## Mega-menu architecture
`app/layout.tsx` renders `<NavbarWrapper>` (server component, unchanged file).
NavbarWrapper calls `getMenuTaxonomy()` → passes `groups` into `NavbarGate`
(client, usePathname admin gate) → `Navbar` → `<MegaMenu groups={groups} />`.
MegaMenu: "Shop by Category" column = 4 mains, hover reveals sub-category flyout
(keyboard accessible, Escape closes); one column per other `showInMenu` group;
Price column + "View All" preserved.

---

## Current data state (live Neon)
- **191 products** — all have descriptions, images, SKUs; **no ProductTerm rows yet**.
- **50 taxonomy terms** across 6 groups (just seeded; owner needs to tag products).
- **0 orders, 0 coupons, 0 blog posts in DB** (seed articles show from code).
- **1 hero slide, 1 ribbon message** (editable from admin).
- Admin users: `nishit.savla` (owner), `sirini.jewellery`.

---

## Pending — needs the OWNER (can't be done from code)
Full doc: **`Sirini Pending Tasks.docx`** on the Desktop (updated 2026-06-22).

| Task | Steps |
|---|---|
| **Tag 191 products** | `/admin/products` → edit each → assign taxonomy terms (category, occasion, etc.). PENDING tab tracks progress. |
| **Add cover images** | `/admin/shop` → each term has a Browse button for cover image. |
| **Resend (order emails)** | Sign up resend.com → verify domain DNS → get API key → Vercel: `RESEND_API_KEY` + `ORDER_FROM_EMAIL=Sirini Jewellery <orders@sirinijewellery.com>` → redeploy. |
| **Razorpay webhook** | dashboard.razorpay.com → Account & Settings → Webhooks → URL: `https://sirinijewellery.com/api/webhooks/razorpay`, events: `payment.captured` + `order.paid`, note secret → Vercel: `RAZORPAY_WEBHOOK_SECRET` → redeploy. |
| **CRON_SECRET** | Vercel env var: `CRON_SECRET = 205b3ba0c29ea419744e6925595ecc80577029e4d27ee505d5691f18ee507993` → redeploy. |
| **Merchant Center** | merchants.google.com → create account → add feed URL `https://sirinijewellery.com/product-feed.xml` (scheduled daily). |
| **Google Search Console** | ✅ DONE — verified (HTML tag), sitemap.xml submitted. |

---

## Decisions the owner should give Claude answers to
(from the pending tasks doc — just reply yes/no/etc. and Claude will build it)

1. Customer reviews post live with no approval — want an **admin approval step**? (yes/no)
2. Rate-limiting on forms to block bots (needs free Upstash account)? (yes/later)
3. When online-paid order is cancelled, flag "refund owed"? (yes/no)
4. Delete stray personal files in the repo (`ABoutUSPage.png`, `Logo.jpeg`, `logo_proper.jpeg`, `IMPROVEMENTS.MD`, `marketing.txt`)? (yes/keep)
5. TEST1 coupon (₹10,000, used up): delete/keep/reset?
6. Instagram strip — real Instagram feed or leave as product images?

---

## Known cleanup items (not yet done)
- Legacy `prisma.category` table + legacy Categories admin now coexist with the
  new taxonomy (redundant); can be retired once tagging is complete.
- Legacy `styles[]` product field retained but unused (Collection replaced Style).
- Product form still shows the legacy category multi-select alongside the new
  taxonomy multi-select; both write to their respective fields.
- `matchCategorySlugs()` in `lib/taxonomy.ts` (search keyword→old slug) still
  active; can be replaced entirely by taxonomy term label search once tagging done.
