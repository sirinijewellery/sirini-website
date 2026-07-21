# 01 — The Plan & Working Philosophy

This file explains *why* the site is the way it is. Every convention here was
paid for with a real bug, a real cost overrun, or a real owner complaint. Carry
these rules into any new project; skipping them re-buys the same lessons.

---

## 1. The original goal

Build a jewellery ecommerce site that:

- **Sells** — real payments, real orders, real fulfilment, not a brochure.
- **Ranks** — organic search is the whole acquisition channel; no ad budget.
- **Runs itself** — the owner is a jewellery manufacturer, not a developer.
  Every recurring change (prices, products, hero image, banner text, page copy,
  colours, fonts, nav links) must be doable from an admin panel, forever, with
  no code change and no developer.
- **Costs almost nothing** — free/hobby tiers of Vercel, Cloudinary, Resend.
  Every architectural decision has a cost dimension.
- **Looks expensive** — the product is aspirational; the site must feel like a
  boutique, not a marketplace listing.

---

## 2. The five build phases

The site was built in waves. Each wave shipped fully before the next started.

### Phase 1 — Core commerce
Catalogue, product pages, cart, checkout, Razorpay + COD, orders, accounts,
wishlist, coupons. The site could take money at the end of this phase.

### Phase 2 — Discovery & SEO
Search, filters, category/occasion/collection facets, sitemaps, structured data
(JSON-LD), Open Graph cards, blog/journal, product feed for Google Merchant,
`llms.txt` for AI crawlers. This is where traffic came from.

### Phase 3 — Owner customisability
The big one. Everything hardcoded was moved behind a database-backed setting
with an admin UI: hero slides, announcement ribbon, homepage section order,
trust badges, promo banner, brand story, pull quote, business/contact details,
commerce rates (GST, shipping, COD limits), catalogue behaviour (badges, stock
thresholds, default sort), all legal/static page copy, the FAQ, theme colours,
font pairings, and the navbar itself.

### Phase 4 — Craft & polish
Motion design (scroll reveals, hero choreography, card tilt, parallax),
a 3D immersive brand world, testimonials from real reviews, lead-capture popup,
abandoned-cart nudge, WhatsApp button, Ask-AI section.

### Phase 5 — Hardening
Security audits, payment-path correctness (orphaned-payment capture,
idempotency, timing-safe comparisons), rate limiting, Cloudinary cost control,
performance (font preloading, ISR write reduction, branded loading states).

---

## 3. The golden rules

These appear as comments throughout the codebase. They are not suggestions.

### Rule 1 — "Shipping a setting must change nothing"

> Every default value in a settings module MUST equal the value the site
> currently shows hardcoded, so shipping a new setting changes nothing visible
> until the owner edits it.

When you make something configurable, the un-configured state must reproduce
the old behaviour byte-for-byte. This is why `lib/queries/home.ts`,
`lib/settings.ts`, `lib/catalog.ts`, `lib/commerce/pricing.ts` and
`lib/queries/content.ts` all carry a `DEFAULT_*` constant that is the literal
current copy/value. Deploying a settings feature is then a zero-risk deploy.

### Rule 2 — Single source of truth, always

Any fact that appears in two places will drift. Real examples that bit us:

- Delivery window said "5–7 days" on Shipping and "3–7 days" on the FAQ →
  fixed by `getShippingTime()`, one setting read by both pages.
- Contact phone/email/Instagram were duplicated across Footer, Contact page,
  WhatsApp button and two JSON-LD components → fixed by `DEFAULT_BUSINESS` in
  `lib/settings.ts`.
- The logo URL was hardcoded in four components → fixed by `siteConfig.logo`.
- `categoryLabel()` was re-implemented locally in the shop page → fixed by
  importing the canonical one from `lib/taxonomy.ts`.
- Checkout totals were computed in three places (client form + two API routes)
  and any divergence rejected real orders with "Order amount mismatch" → fixed
  by `computeTotals()` in `lib/commerce/pricing.ts`, imported by all three.

### Rule 3 — Money math is computed once and verified server-side

The client never decides what an order costs. The client computes a total for
display, sends it, and the server **recomputes from scratch and compares to the
exact paise**. Mismatch → reject. This is only survivable because all parties
import the same `computeTotals()`.

### Rule 4 — Never lose a customer's money or message

- A captured Razorpay payment that can't become an Order is written to
  `OrphanedPayment` and the owner is emailed. Money is never silently lost.
- A contact-form message is written to the database *first*; the notification
  email is best-effort on top. Email being down never loses a message.
- Both the verify route and the Razorpay webhook can create the order; both are
  idempotent (unique `paymentId` at the DB level, not just in code).

### Rule 5 — Read the framework docs before writing framework code

This project runs a modified Next.js. `AGENTS.md` at the repo root says:

> This is NOT the Next.js you know. This version has breaking changes — APIs,
> conventions, and file structure may all differ from your training data. Read
> the relevant guide in `node_modules/next/dist/docs/` before writing any code.
> Heed deprecation notices.

Concrete consequences already hit: `next/image` uses `preload`, not the
deprecated `priority`; the middleware file is `proxy.ts`, not `middleware.ts`.

### Rule 6 — Nothing is "done" until it's verified live

The deploy loop is: change → verify locally → push to `main` → **verify on
production with evidence** (curl the live URL, read the live DOM, screenshot).
"It should work now" is not a completion. If a test fails, say so with the
output. If a step was skipped, say that.

### Rule 7 — Accessibility is part of the definition of done

Every custom animation lives behind the single global
`@media (prefers-reduced-motion: reduce)` guard in `app/globals.css`. Loading
states hide with `visibility: hidden`, not just `opacity: 0` — opacity alone
still lets screen readers announce a live region that isn't visible.

### Rule 8 — Cost is a design constraint

Cloudinary credits and Vercel ISR writes are finite on the free tier. So:
one shared transform string per image (one derived asset, ever); a trimmed
`deviceSizes` ladder; bot-facing surfaces get a compressed URL instead of the
8–10 MB stored original; ISR revalidation is on-demand and scoped rather than
short-interval.

---

## 4. Working conventions

**Comments explain *why*, not *what*.** The codebase is dense with comments
that record the reasoning and the bug that motivated the code. Match that
density — it is the reason a new agent can pick this codebase up cold.

**Slugs are canonical, labels are display-only.** URLs, filters and DB values
use lowercase-hyphen slugs. Human text always comes from `categoryLabel()` or a
taxonomy term's `label`. Never render a raw slug.

**Sanitise before injecting.** Owner-editable colours and fonts are injected as
inline CSS in the root layout, so they pass through strict regex validation
(`isValidColor`) and a whitelist (font pairings) first. Content settings are
rendered as structured fields (headings + paragraph strings) only — never as
raw HTML.

**Fail soft on reads.** Every settings/content getter wraps its query in
try/catch and falls back to the default. A database hiccup degrades the site to
its shipped defaults; it never white-screens.

**`cache()` every settings read.** React's `cache()` dedupes reads within a
single render, so a value read by five components is one query.

**Client-safe vs server-only modules are separated deliberately.**
`lib/settings.ts`, `lib/catalog.ts`, `lib/taxonomy.ts` and
`lib/commerce/pricing.ts` import nothing server-only so admin forms can import
them. The Prisma-backed readers live in `lib/queries/*` and are re-exported for
server callers. Importing a `lib/queries/*` module from a client component
would drag Prisma into the browser bundle.

---

## 5. How work is executed

- **Systematic debugging over guess-fixing.** When something is reported broken,
  the first job is to *prove what is actually happening* — read the live DOM,
  check the CSSOM, measure — before proposing a fix. The "loading animations
  aren't showing" bug turned out to be "the animations work perfectly, but
  nothing covered the initial page load," which no guess would have found.
- **Code review before merge.** Multi-angle review (correctness, removed
  behaviour, cross-file consistency, reuse, simplification, efficiency,
  conventions), then verification of each candidate finding before acting.
- **Parallel agents for independent tracks.** Multi-part implementation work is
  split across parallel subagents, then the orchestrator personally reviews the
  resulting diffs before deploying — subagent self-reports are not trusted as
  verification.

---

*Next: [02 — What Changed](02-what-changed.md)*
