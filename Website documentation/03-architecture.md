# 03 — Architecture

How the site is put together: stack, folders, routing, rendering, data flow.

---

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16**, App Router | Server components, file-based routing, ISR, built-in image + metadata APIs |
| UI | **React 19** + TypeScript (strict) | — |
| Styling | **Tailwind CSS v4** (`@theme inline` tokens) | Design tokens live in CSS, so owner theme overrides are a single injected `:root` block |
| Components | shadcn-style primitives in `components/ui`, `@base-ui/react`, `lucide-react` icons | Owned, not vendored — freely restyled to brand |
| Database | **PostgreSQL** via **Prisma 7** (`@prisma/adapter-pg`) | Relational data (orders, taxonomy joins) + typed client |
| Auth | **NextAuth v5** (beta) credentials provider, JWT sessions | No session table to manage; `isAdmin` carried in the token |
| Payments | **Razorpay** + Cash on Delivery | Razorpay is the practical India default; COD is non-negotiable in this market |
| Images | **Cloudinary** + custom `next/image` loader | Their CDN does resize/format; ours would cost more and be slower |
| Email | **Resend** | Simple API, generous free tier |
| State (client) | **Zustand** (cart, recently-viewed) with localStorage persistence | Cart survives refresh without a server round-trip |
| Forms | react-hook-form + Zod resolvers | Shared validation shapes between client and API routes |
| Toasts | Sonner | — |
| Analytics | GA4 + Google Tag Manager + Vercel Analytics | GTM lets the owner add pixels without code |
| Hosting | **Vercel** | Push to `main` → build → live |

---

## 2. Folder layout

```
Sirini_Website/
├── app/                     # All routes (App Router)
│   ├── layout.tsx           # Root layout: fonts, splash, providers, nav, footer, JSON-LD
│   ├── page.tsx             # Homepage — section registry + zone backgrounds
│   ├── globals.css          # Design tokens + the entire animation library
│   ├── loading.tsx          # Branded route loader
│   ├── (auth)/              # login, register (route group — no layout chrome)
│   ├── shop/                # Listing + [slug] product detail + skeletons
│   ├── admin/               # The whole admin panel (protected)
│   ├── api/                 # 44 route handlers
│   ├── about, faq, contact, shipping, privacy, terms, blog, occasions,
│   │   cart, checkout, order-confirmation, account, wishlist
│   ├── image-sitemap.xml/   # Route handlers that emit XML/text
│   ├── product-feed.xml/
│   └── llms.txt/
├── components/              # ~70 storefront components
│   ├── admin/               # ~29 admin-only components
│   └── ui/                  # Base primitives
├── lib/
│   ├── queries/             # Server-only, Prisma-backed readers (one per domain)
│   ├── commerce/pricing.ts  # THE money math
│   ├── store/               # Zustand client stores
│   ├── settings.ts, catalog.ts, taxonomy.ts   # CLIENT-SAFE types + defaults
│   ├── seo.ts               # siteConfig + metadata builders
│   ├── auth.ts, payment.ts, email.ts, cloudinary.ts, rateLimit.ts, …
├── prisma/schema.prisma     # 16 models
├── scripts/                 # ~70 one-off + maintenance scripts (ts-node)
├── public/                  # Static assets incl. world.html
├── proxy.ts                 # Route protection (this Next's middleware equivalent)
├── next.config.ts           # Headers, rewrites, image loader config
└── AGENTS.md / CLAUDE.md    # Project instructions for AI agents
```

### The `lib/` split that matters

```
CLIENT-SAFE (no prisma, importable from "use client")
  lib/settings.ts        BusinessDetails type + DEFAULT_BUSINESS
  lib/catalog.ts         BadgeDef, thresholds, sort options, CATALOG_KEYS
  lib/taxonomy.ts        NAV_CATEGORIES, categoryLabel(), OCCASIONS, STYLES,
                         PRICE_BUCKETS, taxonomy data shapes
  lib/commerce/pricing.ts computeTotals(), computeCouponDiscount()

SERVER-ONLY (prisma)   ← re-export the client-safe surface for convenience
  lib/queries/site.ts      getSetting(), hero slides, ribbon, business details
  lib/queries/home.ts      promo, trust badges, testimonials, sections, story
  lib/queries/catalog.ts   badges, stock threshold, default sort
  lib/queries/commerce.ts  GST/shipping/COD settings
  lib/queries/content.ts   About/Shipping/Privacy/Terms/FAQ + shipping timing
  lib/queries/theme.ts     colours + font pairing + CSS override builder
  lib/queries/navbar.ts    nav links + navbar colours
  lib/queries/taxonomy.ts  the taxonomy tree
  lib/queries/products.ts  catalogue queries + filtering
  lib/queries/orders.ts, admin.ts, messages.ts, pending.ts, wishlist.ts
```

Importing a `lib/queries/*` module from a client component pulls Prisma into the
browser bundle. That's the whole reason for the split.

---

## 3. Routing map

### Public
`/` · `/shop` · `/shop/[slug]` · `/about` · `/faq` · `/contact` · `/shipping` ·
`/privacy` · `/terms` · `/blog` · `/blog/[slug]` · `/blog/rss.xml` ·
`/occasions` · `/cart` · `/world` (rewrite → `public/world.html`)

### Machine-readable
`/image-sitemap.xml` · `/product-feed.xml` · `/llms.txt` (plus the standard
sitemap and robots routes)

### Auth-required (customer)
`/account` · `/wishlist` · `/checkout` · `/order-confirmation`

### Auth pages
`/login` · `/register` — logged-in users are redirected away

### Admin (isAdmin required)
`/admin` and 25 sub-routes — see [06 — Admin Panel](06-admin-panel.md)

### Route protection — `proxy.ts`

This Next.js version names the middleware file `proxy.ts`. It wraps NextAuth's
`auth()` and:

1. Lowercases the pathname **before** matching — on case-insensitive
   filesystems `/Admin` resolves to the same route and would otherwise bypass
   the check.
2. Redirects logged-in users away from `/login` and `/register`.
3. Redirects anonymous users away from `/wishlist`, `/account`, `/checkout` to
   `/login?callbackUrl=…`.
4. Redirects non-admins away from `/admin/*` to `/login?callbackUrl=…` — a
   login prompt, not a silent bounce to the homepage.

The matcher excludes `api`, `_next/static`, `_next/image`, `favicon.ico` and
static image extensions.

---

## 4. Rendering strategy

| Surface | Strategy | Why |
|---|---|---|
| Homepage | **ISR**, `revalidate = 600` | Featured/bestseller queries are expensive; 10 min freshness is plenty |
| Shop listing | Dynamic (search params drive it) | Filters/sort/pagination are per-request |
| Product detail | ISR + on-demand revalidation | Cached until the admin edits that product |
| Admin | Dynamic, server components + client forms | Always live data |
| API routes | Node runtime handlers | Prisma + crypto |

**On-demand revalidation:** when an admin creates/updates/deletes a product,
the affected paths are revalidated explicitly. This replaced short-interval
revalidation, which was generating constant ISR writes (a metered cost) even
when nothing had changed.

**Loading states:** `app/loading.tsx` (branded logo loader),
`app/shop/loading.tsx` (skeleton matching the real product grid — it imports
`PRODUCT_GRID_CLASSES` from `ProductGrid` so the two can't drift), and
`app/shop/[slug]/loading.tsx` (PDP skeleton). Plus the first-load splash in the
root layout, which is the only thing covering the very first page load.

---

## 5. Data flow — settings

This is the pattern used for every owner-editable value.

```
                 ┌──────────────────────────────────────┐
                 │  Setting table  (key TEXT, value JSON)│
                 └──────────────────────────────────────┘
                        ▲                        │
       PATCH /api/admin/settings                 │ getSetting<T>(key, fallback)
       (validated + sanitised)                   ▼
                 │                    ┌──────────────────────┐
        ┌────────┴─────────┐          │ lib/queries/<domain> │
        │  Admin form      │          │  cache()-wrapped     │
        │  (client comp.)  │          │  merges over DEFAULT │
        └──────────────────┘          └──────────┬───────────┘
                                                 ▼
                                       Server component renders
```

Key properties:

- **One generic table.** `Setting { key, value Json }` — no migration needed to
  add a new setting. Keys are namespaced: `home.*`, `commerce.*`, `catalog.*`,
  `content.*`, `theme.*`, `navbar.config`, `business.details`, `ribbon.messages`,
  `hero.durationMs`.
- **Stored value is merged over the default**, so a partial object still yields
  a complete, valid config.
- **Reads never throw.** try/catch → default.
- **Writes are validated** in the API route; colours pass a strict regex, font
  keys pass a whitelist, section keys pass an enum set, unknown keys are
  dropped.

---

## 6. Data flow — an order

```
Cart (Zustand, localStorage)
   └─► /checkout  ──► CheckoutForm (client)
          │  computeTotals()  ← lib/commerce/pricing.ts
          │
          ├─ ONLINE ─► POST /api/checkout/create-order
          │              server recomputes totals from DB prices
          │              exact-paise comparison → Razorpay order
          │            ─► Razorpay Checkout (hosted)
          │            ─► POST /api/checkout/verify
          │                 HMAC signature check (timing-safe)
          │                 fetch Razorpay order, confirm amount paid
          │                 stock guard → create Order (unique paymentId)
          │                 ├─ success → confirmation + emails
          │                 └─ can't create → OrphanedPayment + owner email
          │
          │            ◄─ POST /api/webhooks/razorpay  (independent 2nd path,
          │                 same idempotency guard)
          │
          └─ COD ────► POST /api/checkout/cod
                         same server-side recomputation
                         COD enabled + under codMaxOrder check
                         create Order
```

The exact-paise comparison is the reason `computeTotals()` must be the only
implementation. Any drift between client and server rejects real orders.

---

## 7. Auth model

- Single `User` table. `isAdmin` boolean distinguishes staff from customers.
- Login accepts **email OR username**, matched case-insensitively, both stored
  lowercase.
- Passwords are bcrypt hashes.
- A dummy bcrypt hash is compared when the user doesn't exist, so a wrong
  username takes the same time as a wrong password — no user enumeration.
- JWT sessions; `id` and `isAdmin` are copied into the token and then onto the
  session, so `proxy.ts` can authorise without a DB hit.
- Sign-in and error pages both route to `/login`.

**Separate auth surface:** machine-to-machine endpoints (lead export, coupon
mint, marketing metrics) use API-key auth via `lib/apiKeyAuth.ts` with a
timing-safe comparison — not sessions.

---

## 8. Image pipeline

```
Cloudinary (source of truth for all imagery)
   │
   ├─► Browser:  next/image → lib/cloudinaryLoader.ts
   │             adds f_auto,q_auto,w_<needed>,c_limit
   │             chains AFTER any existing transform (e_trim on the logo)
   │             widths limited to [640,828,1080,1920] + [128,256,384]
   │
   └─► Crawlers: lib/cdnImage.ts → botImageUrl()
                 adds w_1200,h_1200,c_limit,q_auto:good
                 deliberately NOT f_auto (Merchant Center rejects AVIF)
                 same string everywhere = one derived asset ever
```

`c_limit` preserves native aspect ratio — which is why product OG images
deliberately carry **no** hardcoded width/height (any fixed pair would be wrong
for most products and would distort link previews).

**Cache-busting rule:** Cloudinary caches by public_id for 30 days. Replacing an
image means uploading under a **new public_id**, not re-uploading the same one.

---

## 9. Theming pipeline

```
/admin/settings/theme  ──►  Setting "theme.colors" + "theme.font"
                                     │
                     lib/queries/theme.ts  getThemeSettings()
                       · isValidColor() — hex/rgb/hsl regex only
                       · font key must be in the whitelist
                       · values EQUAL to the default are dropped
                                     │
                       buildThemeOverrideCss() → ":root{…}" or ""
                                     │
              app/layout.tsx  <head><style>{css}</style></head>
```

Because every font token in `globals.css` bottoms out at `--font-eb-garamond` /
`--font-dm-sans`, remapping just those two variables swaps fonts site-wide. And
because an unmodified theme emits an **empty string**, the site renders
byte-for-byte identical to its shipped defaults until the owner changes
something.

---

## 10. Deploy

```
git push origin main → Vercel build (~2–3 min) → live
```

Verification is mandatory and is done against the **live production URL**, not
localhost: curl the page, check the rendered HTML/DOM, confirm the specific
thing that was changed. Local success proves nothing about production.

---

*Next: [04 — Site Map & Sections](04-site-map-and-sections.md)*
