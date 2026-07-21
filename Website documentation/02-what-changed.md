# 02 — What Changed

The evolution of the site across ~161 commits, grouped by theme rather than
strict chronology. Each wave lists what was built and *what problem it solved* —
that's the transferable part.

---

## Wave 1 — Core commerce foundation

Built the thing that takes money.

- Product catalogue, product detail pages, cart, checkout.
- **Razorpay** integration — real hosted Checkout, HMAC signature verification,
  order creation, payment-link fallback.
- **Cash on Delivery** as a first-class parallel path (critical in India).
- Customer accounts (NextAuth credentials), saved addresses, order history,
  order cancellation.
- Wishlist (DB-backed for logged-in users).
- Coupons — percentage and flat, min-order, max-uses, expiry, active toggle.
- Sequential human-readable order numbers (`SR` series) instead of raw cuids.
- Order confirmation emails + owner notification emails via Resend.
- Razorpay webhook as a second, independent order-creation path.

**Problems solved:** a coupon that made an order free used to break the payment
flow; quantity could exceed stock; the same payment could create two orders.
Fixed with server-side recomputation, a stock guard, and a DB-level unique
`paymentId`.

---

## Wave 2 — Catalogue depth & product data

- 191 product descriptions rewritten to be unique and 100–150 words each
  (templated descriptions were hurting SEO — near-duplicate content).
- Multi-category products: a product belongs to one *primary* category plus
  many via a `categories` array, so filtering is many-to-many.
- Compare-at (struck-through) pricing spread across the catalogue.
- Product badges (NEW / HOT / SALE / Handcrafted / Traditional / Bestseller).
- Stock quantities, low-stock urgency messaging.
- Occasions, styles, tags as product dimensions.
- Cover-image classifier: model shot → decorative/styled shot → plain white,
  in that priority, because model shots convert better on cards.
- 30+ new products added across several batches; 8 new categories
  (Bracelet, Tops, Nose Ring, Belt, Tikka, Kalira, Hathpaan, Groom Mala,
  Long Sets).
- Category-casing consistency fix — slugs everywhere in data, labels everywhere
  in UI.

---

## Wave 3 — The taxonomy system

The single biggest architectural change. Replaced hardcoded category lists with
an **admin-managed, multi-dimension taxonomy**.

- New tables: `TaxonomyGroup`, `TaxonomyTerm`, `ProductTerm`.
- A *group* is a "Shop by ___" dimension: Category, Occasion, Collection, Look,
  Stone, Colour — and the owner can create new ones.
- Only the Category group is hierarchical (main → sub).
- Terms carry a label, blurb, cover image, focal point, hex colour, sort order
  and a show-in-menu flag.
- Drives: the mega-menu, the shop sidebar filters, the homepage "shop by" rows,
  and indexable facet URLs.
- A **Pending** admin tab surfaces products/terms missing data (images, blurbs,
  assignments) so the catalogue can be completed incrementally.

**Why it mattered:** before this, adding "Shop by Stone" meant a code change.
After it, it's three clicks.

---

## Wave 4 — SEO, AEO & GEO

Organic search is the only acquisition channel, so this got disproportionate
attention.

- Per-page canonicals, forced to the real domain (Vercel preview URLs were
  leaking into canonicals).
- Structured data (JSON-LD): Organization, WebSite + SearchAction, LocalBusiness,
  Product (with offers, reviews, aggregate rating), BreadcrumbList, FAQPage,
  ItemList — later **connected into one entity graph** so Google reads them as a
  single identity rather than disconnected nodes.
- Sitemaps: main sitemap, **image sitemap**, RSS feed for the journal, and
  a **Google Merchant Center product feed** (`/product-feed.xml`).
- Indexable facet pages for category / occasion / collection / look / stone /
  colour, each with unique title, description and copy — added to the sitemap.
  Non-canonical combinations (multiple facets, pagination) are deliberately
  *not* canonicalised.
- Open Graph + Twitter cards site-wide, with per-product unique meta
  descriptions built from name + category + price (guaranteed unique).
- `llms.txt` — a plain-text brand/product summary for AI crawlers (AEO/GEO).
- Google Search Console verification token with env override.
- Return-policy schema, category-specific titles, breadcrumbs everywhere.
- **Fact-consistency audit** — delivery days, return window and refund window
  were saying different things on different pages and in schema; unified behind
  one setting.

---

## Wave 5 — Admin customisability (Phases 1–3)

Everything the owner might ever want to change, moved out of code.

- **Business details** as single source of truth (email, phone, WhatsApp,
  Instagram, address, opening hours, JustDial link).
- **Hero manager** — multi-slide rotating hero, per-slide upload, separate
  mobile image, click-to-set focal points for desktop and mobile independently,
  brightness/contrast/overlay sliders, reorder, hide, delete, rotation speed.
- **Header ribbon** — editable rotating announcement messages.
- **Homepage settings** — reorder and hide every post-hero section, promo
  banner, trust badges, brand story, pull quote, curated testimonials.
- **Commerce settings** — GST rate, gift-wrap fee, shipping fee, free-shipping
  threshold, COD on/off, COD max order value.
- **Catalogue settings** — custom badge list with colours, low-stock threshold,
  hide-out-of-stock toggle, default sort.
- **Content settings** — About, Shipping, Privacy, Terms, FAQ, and the shared
  delivery/return/refund timing values.
- **Theme settings** — five brand colour tokens and five curated font pairings,
  applied by injecting a sanitised `:root` override.
- **Navbar editor** — link labels, hrefs, order, visibility, link type
  (plain / mega-menu / occasion / collection), plus announcement bar, header
  background and accent colours.
- **Admins management** — username-based login, add/edit/delete admins, with
  guards against deleting yourself or the last admin.
- **My Account** — admin changes own username/display name/password, current
  password required.
- **Searchable Help tab** with "Tell Me" deep links — plain-English step-by-step
  instructions for every admin task, jumping straight to the right screen.
- **Colors admin** and **Shop taxonomy manager**.
- **Messages inbox** — every contact-form submission, with unread badge.
- **Blog manager** — create/edit/publish journal articles with structured body.

---

## Wave 6 — Motion & craft

- Scroll-reveal system with directional variants (up / left / right / zoom /
  clip-wipe / tilt) and staggered grids.
- Hero choreography: curtain reveal, word-by-word headline rise, Ken Burns
  drift, breathing scale, diagonal light glint, cursor spotlight, gold sparkle
  motes, magnetic CTA button.
- Product cards: 3D tilt toward cursor, image crossfade on hover, warm vignette,
  card lift with layered shadow, slow editorial image zoom.
- Micro-interactions: heart pop on wishlist, badge pop on cart change, press
  scale, gold underline sweep on links, button sheen, drawer item cascade.
- Reading progress bar and a gold scroll-warmth vignette that deepens on scroll.
- Marquee product rail, animated hamburger, page-enter fade on every route.
- **Every one of these sits behind the global reduced-motion guard.**
- An **immersive 3D brand world** at `/world`, plus a portal section on the
  homepage.

---

## Wave 7 — Growth & lead capture

- Lead-capture popup with a welcome discount.
- Idempotent, attributed single-use coupon minting per captured lead
  (`Coupon.issuedToEmail` unique — a second mint for the same email returns the
  existing code rather than creating a duplicate).
- Key-authed lead export endpoint, with a "has this lead purchased?" flag.
- Contact-form leads folded into the same pipeline.
- Newsletter signup.
- Abandoned-cart nudge.
- Testimonials sourced from real published reviews, with a curated-order
  setting and a 15-item fallback so the section never empties.
- Ask-AI section — one-click buttons that open ChatGPT / Claude / Gemini with a
  preloaded brand prompt.
- Instagram strip, WhatsApp floating button.
- Key-authed read-only marketing-metrics API for an external marketing agent,
  with timing-safe key comparison.
- Daily revenue digest cron.

---

## Wave 8 — Security hardening

- Full security audit: fixed 2 critical, 5 high and 20+ further issues.
- Rate limiting on every public POST endpoint and the pincode proxy.
- Timing-safe comparison for Razorpay signatures and API keys.
- Timing-equalised login (a dummy bcrypt hash so non-existent users take the
  same time as wrong passwords — blocks user enumeration).
- Admin route protection in `proxy.ts`, with lowercase path matching so `/Admin`
  can't bypass the check on case-insensitive filesystems.
- Security headers: `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy`, HSTS with preload.
- JSON-LD XSS hardening.
- Coupon partial-update validation gap closed; expiry no longer truncated on
  toggle.
- npm audit fixes across several rounds (axios, brace-expansion, form-data,
  hono, js-yaml, @babel/core).
- Orphaned-payment capture, including on serialization conflicts.
- Cron endpoint fails closed without its secret.

---

## Wave 9 — Performance & cost

- **Custom Cloudinary loader** for `next/image` — Cloudinary does the resizing
  and AVIF/WebP conversion instead of proxying multi-MB originals through
  Vercel's optimizer.
- Trimmed the srcset width ladder (`deviceSizes` 4 entries, `imageSizes` 3)
  because every distinct width becomes a separate billed Cloudinary derived
  asset.
- `botImageUrl()` — bot-facing surfaces (JSON-LD, sitemaps, OG, merchant feed)
  get one shared compressed transform instead of the raw original. Crawlers were
  burning bandwidth credits on 8–10 MB files.
- Deliberately **not** `f_auto` on bot URLs — Merchant Center and some
  link-preview scrapers reject AVIF.
- Script to compress oversized stored originals in place.
- ISR: home page on a 10-minute revalidate; on-demand scoped revalidation when
  admin changes products, replacing short-interval revalidation that was
  churning ISR writes.
- **Font preloading fix** — all 10 owner-selectable font families were being
  eagerly preloaded on every page load (15 font files) even though only one
  pairing renders. `preload: false` on the 8 non-default pairings cut it to 3.
- Branded loading states: `loading.tsx` boundaries with logo + shimmer skeletons
  matching the real layouts.
- **First-load branded splash** — `loading.tsx` only covers route transitions,
  so the *initial* page load (the wait users actually feel) had no coverage. A
  server-rendered splash now paints the breathing logo straight from the HTML,
  invisible for the first 800ms so fast loads never see it.

---

## Wave 10 — Documentation & tooling

- `AGENTS.md` / `CLAUDE.md` — the "this is not the Next.js you know" rule.
- A `deploy-and-verify` skill recording the deploy loop and the project's real
  traps (Cloudinary cache-busting requires a new public_id; ISR write cost;
  Turbopack serving stale CSS after an offline edit — delete `.next`; a hidden
  browser pane freezes CSS animation timelines, so verify by driving
  `Animation.currentTime` manually).
- ~70 maintenance scripts in `scripts/` for catalogue operations (bulk renames,
  description generation, image uploads, category backfills, audits, seeding).
- This documentation folder.

---

## Notable bugs and their root causes

Worth reading — each one is a class of mistake, not a one-off.

| Symptom | Root cause | Fix |
|---|---|---|
| "Order amount mismatch" rejecting real orders | Three copies of the total-calculation math drifted | One `computeTotals()` imported by client + both routes |
| Splash screen stuck permanently covering the live site | An inline script mutated a React-managed DOM node before hydration; React silently re-rendered client-side and re-inserted the node *without* re-running the inline script | Script only toggles a class on `<html>` (React never reconciles `documentElement`); CSS descendant selectors do all hiding |
| Loading animations "not showing anywhere" | They worked — but ISR-cached pages resolve instantly and nothing covered the *first* load | Added the server-rendered first-load splash |
| Hero image change not appearing | Cloudinary caches by public_id for 30 days | New public_id per image swap, not a re-upload |
| Categories not showing in shop | Slug mismatch between DB values and nav constants | Canonical slugs + `categoryLabel()` |
| FAQ and Shipping page disagreeing on delivery time | Two hardcoded copies | `getShippingTime()` single source |
| Cloudinary credits draining | Crawlers fetching raw 8–10 MB originals | `botImageUrl()` shared compressed transform |
| Site slow to load | 15 font files preloaded per page for fonts that weren't rendering | `preload: false` on unused pairings |

---

*Next: [03 — Architecture](03-architecture.md)*
