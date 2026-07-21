# Sirini Jewellery — Daily Audit Report (Early Morning)
**2026-07-20**

Repo location note: `D:\Owner\Desktop\Claude\Sirini_Website` does not exist yet — the repo is still at `D:\Owner\Desktop\Sirini_Website`, so this audit (and report) ran there.

## Summary

| Section | Findings | Auto-fixed & deployed | Needs manual action |
|---|---|---|---|
| SEO / AEO / GEO | 1 | 1 | 0 |
| Code Bugs | 1 | 1 | 0 |

**Headline:** the midnight run just before this one already fixed the biggest SEO gap (facet-page indexing), so this pass went hunting in less-trodden ground: cross-page fact consistency (GEO) and edge-case API validation gaps. Found one real instance of each — both small, both real, both fixed, verified (`tsc`, `eslint`, full production build), committed, and **deployed to production with verified evidence**. Everything else re-checked (fonts, hero LCP strategy, Cloudinary pipeline, security headers, admin auth, XSS/CSRF surfaces, `npm audit`) was already solid from prior hardening passes — see "already audited, no issues" below each table.

---

## SEO / AEO / GEO

| # | File | Issue | Severity | Status |
|---|---|---|---|---|
| 1 | [lib/queries/content.ts](lib/queries/content.ts) | `DEFAULT_FAQ`'s "How long does delivery take?" and "What is the return and exchange policy?" answers hardcoded "5–7" / "7" days as their own string literals, instead of reading `DEFAULT_SHIPPING_TIME` — the single source of truth the Shipping page, Terms page, and `ProductJsonLd` were already unified onto in an earlier session specifically to stop this class of drift. The FAQ's `FAQPage` JSON-LD is exactly the kind of content AI answer engines (ChatGPT, Perplexity, Google AI Overviews) lift and cite directly — if the owner ever edits the shared shipping-time setting from `/admin/settings/content`, the Shipping/Terms pages and structured data would update correctly while the FAQ silently kept stating the old numbers. No live drift exists today (values coincidentally matched), but the code held two independent copies of the same fact. | 🟡 Medium (GEO fact-consistency) | 🟢 **Fixed & deployed** |

**Verified live after deploy** (`curl https://sirinijewellery.com/faq`): the two answers now render exactly as before ("5–7 business days" / "within 7 days") but are sourced from `DEFAULT_SHIPPING_TIME` at build/render time, not typed twice.

**Everything else checked this pass, already solid (no changes needed):**
- **Fonts** (`app/layout.tsx`) — `next/font` with `display:"swap"`; `preload:false` on all 8 non-default theme pairings so a visitor only downloads the 2 fonts actually rendering, not all 10 curated families.
- **Hero image LCP strategy** (`components/HeroCarousel.tsx`) — uses `fetchPriority="high"` on the first slide, deliberately *not* `preload`/`loading="eager"`, for the mobile/desktop art-directed image pair. Cross-checked against Next 16's own docs (`node_modules/next/dist/docs/.../image.md` line 1319): this is the officially documented pattern for exactly this case ("you cannot use preload or loading=eager because that would cause both images to load... use fetchPriority=high instead"). Confirmed correct, not a bug.
- **`next.config.ts`** — Cloudinary custom loader, trimmed `deviceSizes`/`imageSizes` (4+3 widths), full security header set (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS) already present.
- **`lib/cloudinaryLoader.ts`** — `f_auto` (AVIF/WebP), `q_auto`, width-capped via `c_limit`, correctly chains after any existing transform segment.
- **Metadata coverage** — every top-level `page.tsx` has `metadata`/`generateMetadata` except `app/cart/page.tsx` and `app/(auth)/login,register/page.tsx`; all three get `robots:{index:false}` from a co-located `layout.tsx` instead — correct pattern, re-confirmed as a false alarm.
- **Taxonomy internal linking** — queried the live DB: `look`/`stone`/`colour` taxonomy groups (indexed for the first time in the midnight run just before this one) already have `showInMenu:true`, so the mega-menu already links to them site-wide. The footer's 4-column link grid doesn't include them, but that's the existing intentional layout (category/occasion/material/company) — adding a 5th column would be a visual/layout change, explicitly out of scope for this audit.
- **Blog articles** (`app/blog/[slug]/page.tsx`) — per-article `generateMetadata` with canonical + OG `article` type, deterministic `BlogPosting` JSON-LD (`dateModified` = the article's own date field, no `Date.now()`), clean heading hierarchy (one `h1`, `h2` per section), `BreadcrumbJsonLd`, entity-graph `@id` links to `#organization`/`#website`.
- **Heading hierarchy** — spot-checked FAQ, Contact, About pages: single `h1` each, logical `h2`/`h3` nesting, no skipped levels.
- **GEO fact consistency** — founding year (2017) and founder name (Nishit Savla) consistent across About, Footer, Navbar, HeroCarousel, `OrganizationJsonLd`, `llms.txt`, and the OG image generator. Commerce facts (free pan-India shipping, no minimum order) match the live DB (`commerce.freeShipThreshold` = 0, no settings overrides currently stored) — no live drift today, but finding #1 above closes a latent risk in the code itself.

---

## Code Bugs

| # | File | Issue | Severity | Status |
|---|---|---|---|---|
| 1 | [app/api/admin/coupons/[id]/route.ts](app/api/admin/coupons/[id]/route.ts) | The zod `.refine()` enforcing "percentage discount must be 1–100" only evaluates `discountType` from the **same request body**. Because the route was deliberately made partial-update (last session's fix so the active-toggle doesn't round-trip and truncate `expiresAt`), a `PUT` that sends only `{discountValue: 500}` against an *existing* percentage coupon skipped the range check entirely, since `discountType` was `undefined` in that request (not `"percentage"`) and the refine trivially passed. Not exploitable through the current admin UI today — `CouponsClient`'s toggle only ever sends `{isActive}`, and `CouponForm` always submits `discountType`+`discountValue` together — but it's a real gap in the API contract itself, admin-only surface. | 🟢 Low (admin-only, not reachable via current UI) | 🟢 **Fixed & deployed** |

**Fix:** re-validate `discountValue` against the *effective* type — the new `discountType` if the request sent one, else the coupon's existing stored `discountType` (fetched via the existing `couponExists` lookup, now also selecting `discountType`). Returns the same 400 the original refine intended.

**Also checked, no issues found:**
- **`npm audit`** — unchanged from the immediately-prior audit: 5 moderate advisories, all confined to dev/build-only tooling (`@prisma/dev`'s bundled `@hono/node-server`, `next`'s vendored `postcss`). No fix available except a semver-major downgrade of `prisma`/`next`, which would be a regression — not applied, informational only, no production request path affected.
- **Newest API routes' auth** — `app/api/leads/route.ts` (GET), `app/api/leads/coupon/route.ts`, `app/api/admin/coupons/[id]/route.ts` — all correctly gated (`session.user.isAdmin` for admin routes; `timingSafeEqual` shared-secret via `lib/apiKeyAuth.ts` for machine-to-machine routes), rate-limited, zod-validated.
- **`app/api/leads/coupon/route.ts`** — idempotent mint per email (`findUnique` pre-check + `P2002` retry/re-read), unbiased 32-char code alphabet (divides 256 evenly), no issues.
- **`app/api/contact/route.ts`** — writes the DB row before attempting email (a message is never lost if Resend is down), lead-upsert wrapped in its own `try/catch` so a lead-write failure can never break the contact submission, and the notification email template (`lib/email.ts`) HTML-escapes name/email/message via `escapeHtml()` before interpolating — no injection.
- **Theme override CSS** (`app/layout.tsx` → `buildThemeOverrideCss`, rendered via `dangerouslySetInnerHTML` into a `<style>` tag from admin-editable colour settings) — checked specifically for the "XSS via admin CMS field on the storefront" pattern the audit checklist calls out. `lib/queries/theme.ts`'s `isValidColor()` strictly regex-validates every value as hex/rgb/hsla before it's allowed through; free-form CSS/HTML breakout is not possible. False alarm, already safe.
- **All 13 `dangerouslySetInnerHTML` call sites site-wide** — reviewed each: all are either JSON-LD `<script>` blocks (with `<` escaped to `<`) or the theme-CSS case above (regex-sanitized). No unescaped user/admin content reaches raw HTML/script output anywhere.
- **Checkout money path** (`app/api/checkout/create-order/route.ts`) — validates `customerEmail`/address/phone via zod for fail-fast UX but never persists them; no `Order` row is created at this step (the Razorpay order is created, nothing else). The actual `Order` is written later in `verify/route.ts` after payment settles, which **does** lowercase `customerEmail` consistently with the `cod`/`payment-link` routes. Confirmed not a bug — just validation that runs ahead of a step where those fields aren't used yet.

---

## Deploy record

- Commit: `93da77c` — *"fix: FAQ delivery/return-day facts drift, coupon partial-update validation gap"*
- `npx tsc --noEmit` ✅ clean · `npx eslint lib/queries/content.ts "app/api/admin/coupons/[id]/route.ts"` ✅ clean · `DOTENV_CONFIG_PATH=.env.local npm run build` ✅ succeeded (507 routes, no errors)
- Pushed to `main`. Vercel build ran noticeably longer than the usual ~2–3 min this time (single-worker static generation across 507 routes took ~9 min wall clock — no errors, just slow), but completed clean.
- **Verified live on production** via the Vercel deployment API (`dpl_FWAdYCevqVzJnSviZyokoYY53b8K`, state `READY`, aliased to `sirinijewellery.com`/`www.sirinijewellery.com`) and a direct `curl https://sirinijewellery.com/faq` (HTTP 200, `X-Vercel-Id` present, FAQ answers rendering correctly from the new interpolated source).
- No other files were touched or committed. Pre-existing unrelated uncommitted changes in the working tree (`.claude/launch.json`, `.claude/skills/deploy-and-verify/SKILL.md`, untracked scratch folders) were left untouched, as instructed.
