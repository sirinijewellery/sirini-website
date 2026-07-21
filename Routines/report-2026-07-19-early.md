# Sirini Jewellery — Daily Audit Report (Early Morning)
**2026-07-19, ~5:15 AM** · SEO/AEO/GEO + Code Bug audit · **Everything below is now live on sirinijewellery.com**

## Summary

| | SEO/AEO/GEO | Code Bugs |
|---|---|---|
| Areas checked | 13 | 13 |
| 🟢 Auto-fixed today | 8 | 3 |
| 🟡 Needs manual/owner action | 5 (1 is a low-priority build-pipeline note) | 2 (1 no-safe-fix, 1 previously declined) |
| Verified OK, no issue | (folded into the 13 above) | 8 |

**Headline:** this run cleared a large backlog that had been piling up uncommitted across the last several audit runs (rate limiting on 8 public routes, GEO fact fixes, a CWV fix), plus found and fixed two new, more significant issues on its own pass: **96 live product descriptions** still said "22kt" instead of the site-wide "18–22K" fact (Product JSON‑LD's delivery/return window was also silently hardcoded and ignoring the real setting), and a **payment-verification race condition** where a captured Razorpay payment could lose a database serialization conflict and end up with no order *and* no orphaned-payment flag — i.e. money taken with no record for the owner to act on. Everything passed `tsc` + a full production build, shipped in 3 commits, and was verified live post-deploy.

---

## SEO, AEO & GEO

| File / Area | Finding | Severity | Status |
|---|---|---|---|
| `components/ProductJsonLd.tsx` | `shippingDetails.deliveryTime.transitTime` was hardcoded `minValue:3, maxValue:7` on every product, completely ignoring `getShippingTime()` — the single source of truth already fixed everywhere else to "5–7". This is exactly the kind of machine-readable fact Google rich results and AI/GEO crawlers extract, so it was silently re-introducing an inconsistency the site had otherwise eliminated. | 🔴 High | 🟢 Fixed — now reads the live `content.shippingTime` setting via `app/shop/[slug]/page.tsx`, parsed to numeric min/max with a safe fallback. |
| `components/ProductJsonLd.tsx` | Same class of bug, smaller blast radius: `merchantReturnDays` was hardcoded `7` instead of reading the `returnDays` setting — currently both equal 7 so no visible drift today, but would silently diverge the moment the owner edits the setting. | 🟡 Medium | 🟢 Fixed — now reads `shippingTime.returnDays`. |
| **96 live `Product.description` rows** (Neon DB) | The "22kt → 18–22K" GEO fact-consistency sweep from prior runs covered every page's static copy but never checked the database itself. A DB query found **96 of 191 live products** still had "22kt"/"22KT" baked into their description — visible on the PDP body copy *and* fed straight into each product's JSON-LD `description` field. This is a live, indexed GEO fact conflict at real scale, not a hypothetical. | 🔴 High | 🟢 Fixed — dry-run reviewed then applied via `scripts/fix-22kt-descriptions.ts` (mechanical token replace only, sentence structure untouched; product **slugs** were left alone even where a slug itself contains "22kt", to avoid breaking any existing URL/backlink). |
| `scripts/generate-descriptions.ts`, `scripts/expand-descriptions.ts` | The description-generator template pools used to produce those 96 (and future) product descriptions still hardcoded "22kt" in their string templates — re-running either script would have reintroduced the exact fact just fixed above. | 🟡 Medium | 🟢 Fixed — template pools updated to "18–22K". |
| `app/shop/[slug]/page.tsx` + `components/FAQJsonLd.tsx` | The site-wide FAQPage JSON-LD (12 generic Q&As) was rendered **identically on every one of 191 unrelated product pages**. Duplicate/non-specific FAQ structured data across many pages is exactly the pattern Google's FAQ rich-result guidelines restrict as low-quality/spammy. | 🟡 Medium | 🟢 Fixed — removed from the product page; kept only on `app/faq/page.tsx` where it's actually relevant (verified still present there). |
| `components/LocalBusinessJsonLd.tsx` | `address.streetAddress` was set to the same value as `addressLocality` ("Mumbai") because no real street-address field exists in `BusinessDetails` — weak/duplicate NAP data that a structured-data validator or Google Business Profile match could flag. | 🟢 Low | 🟢 Fixed — key dropped entirely (schema.org doesn't require it). |
| `app/robots.ts` | `disallow` list didn't cover `/login` or `/register`. | 🟢 Low | 🟢 Fixed (part of this run's backlog). |
| `components/HeroCarousel.tsx` | Used `preload={i===0}` on an art-directed mobile/desktop image pair — per Next 16's own docs this forces **both** crops to load regardless of viewport, doubling hero bandwidth/Cloudinary transform cost. | 🟡 Medium | 🟢 Fixed — switched to `fetchPriority="high"`, the pattern Next's docs explicitly recommend for this exact case (confirmed against `node_modules/next/dist/docs`). |
| `sirini-world/src/template.html`, `main.js`, `dist/Sirini_World.html` | Same "22kt" / "3–7 days" stale facts live in the *source* project for the separate 3D `/world` experience (its own build pipeline; `public/world.html` is the compiled, already-fixed output actually served/indexed). | 🟢 Low | 🟡 Needs manual action — flag for whoever next rebuilds that experience so source and shipped output don't drift; zero live-site exposure today. |
| `app/(auth)/login`, `/register` | Both are `"use client"` pages under a shared layout, so neither sets its own `<title>` — the browser tab falls back to the homepage title. `robots: {index:false}` is already correctly set. | 🟢 Low | 🟡 Not fixed — zero SEO impact (noindex); a real fix means splitting these into server+client components for a cosmetic tab-title-only gain. Left as informational. |
| `lib/queries/content.ts` (FAQ) vs `app/shipping/page.tsx` | Recurring, unchanged: FAQ frames the 7-day window as a defects/wrong-item "exchange" (excludes change-of-mind/size); Shipping frames the same window as a general "return" with a different eligibility list. | 🟡 Medium | 🟡 Needs owner decision (business-language call, not a mechanical fix). |
| `lib/queries/content.ts` (FAQ) | Recurring, unchanged: a developer-credit "Who made this website?" Q&A sits inside the customer-facing FAQPage schema. | 🟢 Low | 🟡 Needs owner decision. |
| `prisma/schema.prisma` (`HeroSlide`) | Recurring, unchanged: no per-slide alt/caption field, so hero alt text stays a hardcoded generic string. | 🟢 Low | 🟡 Needs action — schema migration + admin field, out of scope for an unattended fix. |
| Everything else re-verified this run | `llms.txt`, `app/sitemap.ts`, canonical URLs, facet noindex logic on `/shop`, Open Graph/Twitter tags, product/gallery image alt text, heading hierarchy (one `<h1>`/page, no level-skipping), homepage `Organization`/`WebSite` JSON-LD, `app/blog/*` metadata + `BlogPosting`/`CollectionPage` JSON-LD, font loading (`next/font`, `display:swap`, selective `preload:false`), `next.config.ts` image ladder, `product-feed.xml`/`image-sitemap.xml`/`opengraph-image.tsx`/`blog/rss.xml`. | — | 🟢 OK, no new issues found. |

---

## Code Bugs & Security

| File / Area | Issue | Severity | Status |
|---|---|---|---|
| `app/api/checkout/verify/route.ts` | The order-creation transaction runs at `Serializable` isolation (needed to make the paymentId idempotency check race-safe). On a `P2034` serialization-conflict error, the old catch-all **assumed** it always meant "a concurrent request for this same payment is already handling it" and just returned a 409 — but `Serializable` aborts on *any* overlapping read/write, including two *different* customers' orders touching the same product's stock row or the same coupon row. A payment already verified-authentic and captured by Razorpay could lose that race, and **the customer's payment was left with no order and no orphan record** — the only backstop being the Razorpay webhook, whose live config status wasn't verifiable from the repo. | 🔴 Medium‑High | 🟢 Fixed — on `P2034`, now re-checks whether an order for that `paymentId` actually exists: if yes, returns it (the real duplicate case); if no, calls `recordOrphanedPayment()` like every other failed-after-payment path so the owner can refund/fulfil it. |
| `app/api/leads/coupon/route.ts` | New since the last audit (commit `7eceb67`). Mints a real single-use `Coupon` row, guarded by the same fail-closed timing-safe API-key pattern as the other `leads/*` routes — but unlike `leads/route.ts` POST, had no `enforceRateLimit`. Not publicly reachable without the key, but a leaked key + no throttle = unlimited free coupons. | 🟢 Low | 🟢 Fixed — added `enforceRateLimit`, matching its sibling route. |
| `app/api/addresses`, `/[id]`, `checkout/failed`, `orders/[id]/cancel`, `products/[slug]`, `search`, `wishlist`, `wishlist/check` | Backlog carried over from prior audit runs (verified correct, tsc-clean, but never previously committed): these 8 public routes were missing `enforceRateLimit`. | 🟡 Medium | 🟢 Fixed — shipped this run. |
| `npm audit` | 5 moderate advisories, unchanged from prior runs: Next's bundled `postcss` (CSS-stringify XSS, CWE-79) and Prisma's dev-CLI `@hono/node-server` (path bypass, CWE-22) — both transitive and **build-time/dev-tooling only**, never shipped to the browser or the production server. | 🟡 Medium | 🟡 Needs owner decision — `npm audit fix --force` would downgrade Next to a 9.x canary or Prisma to 6.x; not safe to apply unattended on this Next 16 / Prisma 7 codebase. |
| `lib/auth.ts` — brute-force login throttle | Still absent. | 🟢 Low | Noted only — explicitly proposed and **declined by the owner on 2026-07-02**; not re-flagged as new. |
| All 21 `app/api/admin/**/route.ts` files | Every exported handler checks `session?.user?.isAdmin` as the first statement before touching Prisma/the filesystem. | — | 🟢 OK, no gaps. |
| `dangerouslySetInnerHTML` (12 usages across `app/`, `components/`) | All are either JSON-LD with `<` escaped to `<` (including every admin-editable field: business details, FAQ, product description, reviews) or the deterministic splash/theme script. Blog body renders as plain React text, never raw HTML. | — | 🟢 OK, no stored-XSS vector. |
| SQL injection | Only 2 `$queryRaw` usages (`marketing-metrics`, `scripts/delete-test-order.ts`), both parameterized tagged templates. | — | 🟢 OK. |
| Sensitive data exposure | All `process.env` reads inside client-rendered code are `NEXT_PUBLIC_*` and genuinely public (GTM/GA IDs, site-verification token, WhatsApp number). | — | 🟢 OK. |
| `app/api/admin/products/upload/route.ts` | Admin-gated, MIME allowlist excludes `image/svg+xml`, 5MB cap enforced before buffering, `publicId` fully server-generated (no user-controlled path component). | — | 🟢 OK. |
| Auth config (`lib/auth.ts`) | JWT strategy, NextAuth v5 default cookie flags (`httpOnly`, `secure` in prod, `sameSite: lax`), bcrypt timing-equalized against a dummy hash (no user-enumeration), `callbackUrl` validated both in `proxy.ts` and the login page regex (blocks `//evil.com` and backslash tricks). | — | 🟢 OK, no open redirect. |
| Broken links | Swept every `href="/..."` in `components/` and `app/**/page.tsx`; every target resolves, including `/world` (rewritten to `public/world.html`, not a dead link). | — | 🟢 OK. |
| `npx tsc --noEmit` + `DOTENV_CONFIG_PATH=.env.local npm run build` | Ran clean both before and after this run's edits (including all backlog changes carried over from prior sessions). | — | 🟢 OK. |

---

## What shipped

Three commits, pushed to `main`, deployed and verified live on `https://sirinijewellery.com`:

1. **`f09610e`** — rate limiting on 8 previously-uncovered public routes + `leads/coupon`.
2. **`f476141`** — SEO/AEO/GEO fact-consistency + structured-data fixes (includes the 96-row live DB content migration, `ProductJsonLd`/`LocalBusinessJsonLd` schema fixes, robots.txt, generator-script template fixes).
3. **`d891073`** — checkout/verify orphaned-payment race-condition fix.

**Post-deploy verification (evidence):**
- Deployment `dpl_ATtbQ4Cw6NT2NS23RujbMGoScaKg` → `READY`, aliased to `sirinijewellery.com`.
- `curl https://sirinijewellery.com/shop/festive-kundan-chandelier-earrings` → JSON-LD `transitTime` now `{minValue:5, maxValue:7}` (was hardcoded 3/7), `merchantReturnDays:7`, description contains no "22kt".
- Same product page → no `FAQPage` schema (confirmed still present on `/faq`).
- Homepage `LocalBusinessJsonLd` → `address` no longer has `streetAddress`.
- `robots.txt` → now disallows `/login` and `/register`.
- `https://sirinijewellery.com/` → `200`.
- Vercel runtime logs for the new deployment show clean `200`s (`cache=PRERENDER`) on `/`, `/faq`, `/robots.txt`, and the sampled product page — no errors.
- The `checkout/verify` fix could not be exercised live (would require a real/faked Razorpay signature + a genuine concurrent-order race); correctness was verified by code review + `tsc`/build, matching the already-proven pattern used in the sibling `cod`/`payment-link` routes.

**Not committed / left for the owner:** none — everything reviewed this run that was safe to fix has been shipped. The five 🟡 SEO items and two 🟡 code items above remain open by design (either a genuine business/content decision, a separate build pipeline out of scope, or — for `npm audit` — no safe unattended fix available).
