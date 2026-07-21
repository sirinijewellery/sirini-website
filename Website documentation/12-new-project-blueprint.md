# 12 — New Project Blueprint

**This is the reusable file.** It describes what *any* jewellery ecommerce site
of this class needs, in build order, with no brand-specific copy. The other 11
documents are the worked example that proves each requirement is real.

Hand this to an AI agent or a developer along with the new brand's details.

---

## 0. Brand intake — fill this in first

Everything below depends on these answers. Get them before writing code.

| Question | Example (Sirini) |
|---|---|
| Brand name & tagline | Sirini Jewellery — Handcrafted Kundan & Gold-Plated Jewellery |
| Founding year, city, founder | 2017, Mumbai, Nishit Savla |
| The brand's actual promise (one sentence) | Bridal-grade craftsmanship without gold prices |
| Primary product categories | Necklace sets, earrings, bangles, rings, anklets, … |
| Other browse dimensions | Occasion, collection, look, stone, colour |
| Price range | ₹500 – ₹8,000 |
| Target customer | Indian brides & festive shoppers |
| Domain | sirinijewellery.com |
| Payment provider | Razorpay + COD |
| Currency & locale | INR, en-IN |
| Tax model | GST 3% |
| Shipping model | Free pan-India |
| Return window | 7 days |
| Contact: email, phone, WhatsApp, Instagram, address, hours | — |
| Brand colours: primary, light variant, accent, background, text | `#8a4853` / `#a6606b` / `#cba72f` / `#fff8f5` / `#221a15` |
| Display font + body font | EB Garamond + DM Sans |
| Who runs it day to day, and how technical are they? | The owner. Not technical → everything must be admin-editable |

> If the last answer is "not technical", the admin panel is not a nice-to-have.
> It's roughly a third of the work and it determines the architecture.

---

## 1. Non-negotiable principles

Adopt these before the first commit. Each one is in this list because skipping
it cost real time on the reference build.

1. **The golden rule** — when you make something configurable, its default must
   reproduce the current hardcoded behaviour exactly. Shipping a settings
   feature must change nothing visible.
2. **Single source of truth** — any fact appearing twice will drift. Contact
   details, delivery windows, logo URL, category labels, money math: one
   definition, imported everywhere.
3. **Money is computed once, server-side authoritative** — one `computeTotals()`
   imported by the client *and* every checkout route; the server recomputes from
   database prices and compares at exact minor units.
4. **Never lose money or messages** — persist first, notify second; capture
   orphaned payments; enforce idempotency with a unique database constraint, not
   just application logic.
5. **Fail soft on reads** — every settings/content getter falls back to its
   default on error. A database hiccup degrades to shipped defaults, never a
   white screen.
6. **Sanitise anything owner-authored that becomes CSS or markup** — strict
   regexes for colours, whitelists for enums, structured fields instead of raw
   HTML.
7. **Cost is a design constraint** — image transformations, ISR writes and
   bandwidth are metered. Decide the strategy up front.
8. **Accessibility is part of done** — one global reduced-motion guard that every
   animation lives behind; hide loading states with `visibility`, not just
   `opacity`.
9. **Nothing is done until verified on production** with evidence.
10. **Read the framework's own docs before writing framework code** — versions
    drift from training data.

---

## 2. Build order

### Phase 1 — Foundation *(week 1)*

- [ ] Framework + TypeScript strict + Tailwind, hosting connected, `main` → prod
- [ ] Design tokens: full colour palette, type scale, spacing, radii — as CSS
      variables in one file
- [ ] Root layout: fonts, providers, nav shell, footer shell
- [ ] Database + ORM, initial schema (Product, Category, User, Order, OrderItem)
- [ ] Image CDN account + **custom image loader** (do this now, not later —
      retrofitting it means re-auditing every `<Image>`)
- [ ] Auth with role flag, route protection middleware (lowercase the path
      before matching)

### Phase 2 — Catalogue *(week 2)*

- [ ] Product model with: primary category + multi-category array, price +
      compare-at price, stock, badge, featured flag, display-order pin,
      per-product SEO overrides
- [ ] Product listing with filters, sort, pagination
- [ ] Product detail: gallery + lightbox, price, stock/urgency, add to cart,
      wishlist, description, reviews, related, recently-viewed
- [ ] Search with **synonym mapping** for the vocabulary your customers actually
      use (regional/traditional product names), with word-boundary patterns
- [ ] Homepage v1: hero, category grid, featured, trust strip

### Phase 3 — Commerce *(week 3)*

- [ ] Persistent client cart (store + localStorage) + drawer + full page
- [ ] Checkout: address, contact, saved addresses, coupon field, gift-wrap
- [ ] **`computeTotals()` as the single money implementation** — build this
      before either payment path
- [ ] Online payment: create order → hosted checkout → verify (signature,
      timing-safe) → re-fetch and confirm amount → stock check → create order
- [ ] **Cash on Delivery** as a parallel path (essential in India; check your
      market)
- [ ] Webhook as an independent second order-creation path
- [ ] Idempotency: unique payment id at the database level
- [ ] Orphaned-payment table + owner alert
- [ ] Order confirmation, emails, account order history, cancellation
- [ ] Coupons: percentage/flat, minimum, max uses, expiry, active toggle

### Phase 4 — Taxonomy *(week 4)*

Do this before hardcoding a second browse dimension.

- [ ] `TaxonomyGroup` / `TaxonomyTerm` / `ProductTerm` tables
- [ ] Groups = "Shop by ___" dimensions; only Category is hierarchical
- [ ] Terms carry label, blurb, cover image, focal point, hex colour, sort
      order, menu visibility
- [ ] Drive the mega-menu, sidebar filters, homepage rows and facet URLs from it
- [ ] Admin screen to manage groups and terms

### Phase 5 — Admin panel *(weeks 5–6, the big one)*

- [ ] Layout: dark sidebar (visually distinct from the storefront), mobile
      drawer, live badges
- [ ] Dashboard: orders, revenue, recent activity
- [ ] Products: list + search, create/edit form covering every field, image
      upload with cover selection, on-demand revalidation on save
- [ ] Orders: list, detail, status workflow
- [ ] Messages inbox with unread badge
- [ ] Coupons, categories, taxonomy, colours
- [ ] **Hero manager**: multi-slide, per-device images, **click-to-set focal
      points for mobile and desktop independently**, brightness/contrast/overlay,
      reorder, hide, rotation speed
- [ ] Announcement ribbon editor
- [ ] Settings hub:
  - Business details (single source of truth for all contact info)
  - Homepage (promo banner, trust badges, section order & visibility, brand
    story, pull quote, curated testimonials)
  - Commerce (tax rate, fees, free-ship threshold, COD rules)
  - Catalogue (badges, low-stock threshold, hide sold-out, default sort)
  - Content (all static pages + FAQ + **shared delivery/return/refund timing**)
  - Navbar (colours, links, order, visibility, link type)
  - Theme (brand colours + font pairing)
- [ ] Multi-admin management with self/last-admin delete guards
- [ ] **Searchable help with deep links** — the owner's manual, in the product
- [ ] "Pending work" checklist driven by queries for incomplete data

**Architecture for all of the above:** one generic `Setting { key, value Json }`
table + a per-domain reader module holding the `DEFAULT_*` constants + one
validated `PATCH` write endpoint. No migration per setting.

### Phase 6 — SEO *(week 7)*

- [ ] Per-page canonicals, forced to the real domain (**explicitly ignore
      preview-host env values** — they leak into canonicals and sitemaps)
- [ ] Unique per-item meta descriptions built from name + category + price
- [ ] Open Graph + Twitter cards; **no hardcoded dimensions** if the transform
      preserves aspect ratio
- [ ] JSON-LD: Organization, WebSite + SearchAction, LocalBusiness, Product,
      Offer, Review, AggregateRating, BreadcrumbList, FAQPage, ItemList —
      **linked into one entity graph**, and escaped
- [ ] Sitemap + image sitemap + merchant feed + RSS + `llms.txt`
- [ ] Indexable facet pages with unique copy; do **not** canonicalise multi-facet
      or paginated combinations
- [ ] Search Console verification
- [ ] **Fact-consistency audit** — delivery, return and refund windows must match
      across every page and every schema block

### Phase 7 — Craft *(week 8)*

- [ ] Scroll-reveal system with directional variants and staggered grids
- [ ] Hero choreography (curtain, word rise, slow drift, light sweep)
- [ ] Card interactions (lift, tilt, image crossfade, vignette)
- [ ] Micro-interactions (wishlist pop, cart badge pop, press feedback, link
      sweep)
- [ ] Branded loading: route loaders, layout-matched skeletons, **first-load
      splash**
- [ ] **One global reduced-motion guard covering all of it**

### Phase 8 — Growth *(week 9)*

- [ ] Lead-capture popup (once per browser, delayed, dismissal counts as done)
- [ ] Attributed idempotent coupon minting per lead
- [ ] Newsletter, abandoned-cart nudge, WhatsApp button
- [ ] Real-review testimonials with a curated-order setting and a fallback set
- [ ] Analytics: GA4 + **Tag Manager** (so the owner can add pixels without code)
- [ ] Machine-readable export endpoints for external marketing tooling (API key,
      timing-safe comparison)

### Phase 9 — Hardening *(week 10)*

- [ ] Rate limiting on every public POST and any third-party proxy
- [ ] Security headers
- [ ] Timing-safe comparisons; timing-equalised login
- [ ] Zod validation at every route boundary
- [ ] Full security review; dependency audit
- [ ] Image and caching cost audit
- [ ] Font preload audit (**check how many font files actually preload**)
- [ ] Production verification of every critical flow

---

## 3. Requirements checklist

Condensed. Every line is something the reference build needed in practice.

### Must have
Product catalogue with multi-dimension browsing · filters, sort, pagination ·
search with local-vocabulary synonyms · product detail with gallery and reviews ·
persistent cart · checkout with online + cash-on-delivery · server-side price
authority · payment idempotency · order management · customer accounts, addresses,
order history, cancellation · wishlist · coupons · admin panel covering products,
orders, media, content, settings · transactional email · structured data ·
sitemaps · mobile-first responsive · reduced-motion support

### Should have
Owner-editable homepage section order · multi-slide hero with per-device focal
points · theme colour + font switching · in-app help for the owner · pending-work
checklist · lead capture with attributed coupons · real-review testimonials ·
blog/journal · delivery estimator · quick view · recently viewed · related and
bundle suggestions · abandoned-cart nudge · WhatsApp contact · multi-admin ·
branded loading states · merchant feed · `llms.txt`

### Nice to have
Immersive brand experience · AI-assistant prompt buttons · language toggle ·
Instagram strip · promo banner · price-bucket shortcuts · scroll progress ·
ambient scroll effects · daily digest cron

---

## 4. Traps to avoid

Each of these was a real bug on the reference build.

| Trap | Prevention |
|---|---|
| Money math duplicated across client and server | One shared function, imported everywhere |
| Contact details / delivery windows duplicated across pages | One settings object, read everywhere |
| Category labels re-derived locally | One `categoryLabel()` |
| Logo URL hardcoded in several components | One `siteConfig.logo` |
| Payment could create two orders | Unique constraint on the payment id **in the database** |
| Captured payment with no order → money lost | Orphaned-payment table + owner alert |
| Contact message lost when email is down | Persist first, notify second |
| Preview-host URL leaking into canonicals | Filter it out in the SEO config |
| Image change not appearing for 30 days | New CDN public_id, never a re-upload |
| Every font preloading on every page | `preload: false` on unselected families |
| Skeleton and real grid drifting apart | Export and share the class string |
| Pre-hydration script mutating React DOM | Toggle a class on `<html>` only; hide with CSS |
| `opacity: 0` loader still announced by screen readers | Add `visibility: hidden` |
| Animations with no reduced-motion guard | One global block; add every new animation to it |
| Rate limits so tight real customers get 429'd | Account for CGNAT — be generous on checkout |
| `/Admin` bypassing the admin check | Lowercase the path before matching |
| Crawlers fetching multi-MB originals | Separate compressed bot-image URL |
| ISR writes accumulating with no content change | On-demand, scoped revalidation |

---

## 5. Reference stack

Proven on this build. Substitute freely — the requirements above are what matter.

```
Next.js (App Router) · React · TypeScript strict · Tailwind CSS v4
Prisma + PostgreSQL
NextAuth (credentials, JWT)
Razorpay (or your market's provider) + Cash on Delivery
Cloudinary + custom next/image loader
Resend
Zustand (cart) · react-hook-form + Zod · Sonner · lucide-react
GA4 + Google Tag Manager + Vercel Analytics
Vercel
```

---

## 6. Prompt template for starting the new build

> I'm building an ecommerce site for **[BRAND]**, a **[category]** business in
> **[city, country]**, founded **[year]**.
>
> Use the attached `Website documentation/` folder as the reference
> specification. `12-new-project-blueprint.md` is the requirements spec; the
> other files are a worked example of the same class of site.
>
> Brand details: **[fill in the section 0 intake table]**
>
> Follow the principles in section 1 of the blueprint and the golden rules in
> `01-plan-and-philosophy.md` — especially: defaults must reproduce current
> behaviour, single source of truth for every fact, one implementation of the
> money math with server-side authority, persist-then-notify, and one global
> reduced-motion guard.
>
> Start with Phase 1. Before writing framework code, read the installed
> framework's own docs — do not assume the API matches your training data.
> Confirm the plan with me before Phase 3 (payments).

---

*Back to the [index](README.md)*
