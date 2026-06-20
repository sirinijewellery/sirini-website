# Sirini Jewellery — Project Handoff

Living context for continuing this build in a fresh Claude Code session. Read this
first, plus `AGENTS.md` / `CLAUDE.md` (auto-loaded). The full codebase and git
history are present in this repo.

## What this is
Production e-commerce site for **Sirini Jewellery** (Mumbai handcrafted fashion
jewellery — Kundan, Meenakari, gold-plated). Live at **https://sirinijewellery.com**
(Vercel). Customers browse/buy; the owner manages everything from `/admin`.

## Stack & important gotchas
- **Next.js 16 (App Router, Turbopack)** — this is a *modified* Next; APIs differ
  from training data. The middleware file is **`proxy.ts`** (not middleware.ts).
  On `next/image` use **`preload`** (not `priority`). ISR via `revalidate` +
  `generateStaticParams`. Read `node_modules/next/dist/docs/` before relying on
  Next behaviour.
- **Prisma 7 + Neon Postgres** (`PrismaPg` adapter). Schema: `prisma/schema.prisma`.
- **Tailwind CSS v4** (`@tailwindcss/postcss`), design tokens in `app/globals.css`.
- **NextAuth (Auth.js v5)**, Credentials provider, JWT sessions (`lib/auth.ts`).
- **Cloudinary** CDN for all images (custom loader `lib/cloudinaryLoader.ts`,
  cloud `dp8a2lvxg`). **Razorpay** payments (live keys are Vercel env only — never
  hardcode). **GA4** + **Vercel Web Analytics** for visitor tracking.

## How to work in this repo
- **Run scripts** (one-offs hit the LIVE Neon DB):
  `DOTENV_CONFIG_PATH=.env.local npx tsx -r dotenv/config scripts/<file>.ts`
- **Type-check:** `npx tsc --noEmit`  • **Build:** `DOTENV_CONFIG_PATH=.env.local npm run build`
- **DB schema change:** edit schema → `DOTENV_CONFIG_PATH=.env.local npx prisma db push` (add `--accept-data-loss` for additive nullable columns) → `npx prisma generate`.
- **Deploy = `git push` to `main`** → Vercel auto-builds & deploys (~2–3 min). On
  `main`, branch only if asked; commit/push only when the user asks (this project's
  norm is to commit+push each change). End commit messages with
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **Dev preview** (`.claude/launch.json`, `npm run dev`, port 3000): Turbopack dev
  gets a stale-chunk error ("module factory is not available") after long sessions /
  prisma regen — fix by stopping the server, `rm -rf .next/dev .next/cache`,
  restart. First compile of a route can take 1–2 min. The screenshot preview tool
  is flaky; verify via DOM/`curl`/build when it hangs.

## Architecture quick map
- `app/` routes: `page.tsx` (home), `shop/`, `shop/[slug]/` (product, ISR +
  generateStaticParams for all products), `(auth)/login`, `admin/*`, API under
  `app/api/*`, plus `sitemap.ts`, `robots.ts`, `manifest.ts`, `product-feed.xml`,
  `image-sitemap.xml`, `opengraph-image.tsx`.
- `lib/queries/products.ts` — product/category queries (filtering, search,
  featured, bestsellers, `getCategories` (image-bearing, homepage cards),
  `getShopCategories` (categories that have products, for shop filter bar)).
- `lib/queries/site.ts` — hero slides + settings (ribbon, hero duration).
- `lib/seo.ts` — metadata helpers + `SITE_URL` (canonical; ignores `*.vercel.app`).
- `lib/taxonomy.ts` — `NAV_CATEGORIES`, `OCCASIONS`, `STYLES`, `categoryLabel()`,
  `matchCategorySlugs()` (search→category).
- `lib/adminHelp.ts` — content for the admin Help/"Tell Me" tab.
- `components/admin/*` — admin UI (ProductForm, CategoriesClient, HeroManager,
  RibbonManager, AdminsManager, AccountForm, AdminHelp, AdminSidebar).
- `scripts/*` — one-off maintenance/seed/migration scripts (kept as records).

## Category system (the subtle part)
- A product has **`categories String[]`** (slugs) — multi-category — plus a legacy
  primary `category` string kept = `categories[0]` for display/back-compat.
- Filtering uses `categories: { has/hasSome }`. Slugs are canonical & lowercase.
- **Three "category" surfaces:** (1) `NAV_CATEGORIES` (code) drives the nav
  mega-menu/footer + `categoryLabel`; (2) the **Category DB table** (name, slug,
  image) drives the admin product form's options + homepage cards; (3)
  `getShopCategories()` (categories with ≥1 product) drives the shop filter pills.
- The admin product form lists ALL DB categories and can **create a category
  inline** (`POST /api/admin/categories`). SKU "Auto" button + form store slugs.
- 14 categories exist. Newest 8 (Bracelet, Tops, Nose Ring (Nath), Belt, Tikka,
  Kalgi, Hathpaan, Groom Mala) have no images/products yet — owner is uploading.

## Admin panel (`/admin`, gated by `isAdmin`)
Dashboard, Orders, Products, Categories, Coupons, **Hero Section** (DB-driven
rotating slides + per-device focal crop + duration; `HeroSlide` model),
**Header Ribbon** (announcement messages; `Setting` key `ribbon.messages`),
**Admins** (list/create/edit/delete admins), **Help** (searchable how-to with
"Take me there →" deep links), **My Account** (edit own username/email/password).

## Auth / admins
- Login accepts **username OR email**, case-insensitive (`lib/auth.ts`).
- Admins sign in with a **username** (customers use email). Username-only admins
  have a synthetic `@sirini.local` email kept in sync.
- Current admins: **`nishit.savla`** (main owner; weak temp password — should be
  changed) and **`sirini.jewellery`**.

## Current data state (live Neon DB)
- 191 products (all with unique 100–150 word descriptions, clean slug categories).
- 14 categories. 0 orders. 0 coupons. Reviews were all synthetic and were deleted
  (so product pages currently show no ratings until real reviews arrive — the
  Product schema emits `aggregateRating` only when reviewCount > 0).

## Conventions
- Commit + push each change; keep the working tree clean. LF→CRLF git warnings on
  Windows are benign.
- Verify before claiming done: `tsc` + production build; for DB changes, a
  read-only check script. Destructive DB ops only with explicit user authorization
  (show before/after counts).
- Use `categoryLabel(slug)` for any user-facing category text; store slugs.

## Pending — needs the OWNER (can't be done from code)
Tracked in **`Sirini Pending Tasks.docx`** on the Desktop. Highlights:
- `www.sirinijewellery.com` domain — DONE (cert valid).
- Set **`NEXT_PUBLIC_SITE_URL=https://sirinijewellery.com`** in Vercel (code now
  forces the real domain regardless, but set it for cleanliness).
- **Resend** (order emails): add `RESEND_API_KEY` + `ORDER_FROM_EMAIL`.
- **Razorpay webhook** + `RAZORPAY_WEBHOOK_SECRET`; **`CRON_SECRET`** for daily digest.
- **Google Search Console** (verify + submit `sitemap.xml`) and **Merchant Center**
  (submit `/product-feed.xml`). Optional `NEXT_PUBLIC_GA4_MEASUREMENT_ID` and
  enabling **Vercel Web Analytics** in the dashboard.

## Likely next requests (from recent sessions)
- More admin customizability (homepage section toggles/order, theme colours,
  About/contact content editing, trust-badge text, etc.).
- Set images for the 8 new categories once product folders are uploaded.
