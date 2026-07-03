# Sirini Jewellery — Security & Code Review Findings

**Date:** 2026-07-02 · **Reviewer:** Claude (Fable 5) · **Scope:** full codebase at `main` (13c9c2f)

---

## 1. Executive Summary

Overall security posture: **good — noticeably above typical for a first ecommerce build.**
All 20 admin API route files check `auth()` + `isAdmin` on **every** exported method (verified individually). The Razorpay flow verifies signatures, cross-checks the amount actually charged against a server-recalculated total, and uses a Serializable transaction for idempotency. Every JSON-LD injection is `<`-escaped, theme CSS injection is strictly sanitized, uploads are allowlisted (SVG excluded), and no secrets reach client bundles. Zod validation exists on essentially every mutating route. `npx tsc --noEmit` is clean.

**Top 3 concerns:**

1. **Latent payment-breaking bug** — `checkout/verify` hardcodes 3% GST / ₹49 gift-wrap and omits shipping instead of using `computeTotals()`. The moment the owner edits any commerce setting, every online payment will be **charged by Razorpay and then rejected** by the site.
2. **Admin login brute-force surface** — no rate limiting anywhere in the app, combined with a 4-character minimum admin password policy and no lockout/2FA.
3. **Unauthenticated/abusable endpoints** — the cron digest endpoint is open until `CRON_SECRET` is set (and the intended secret value is committed to git in HANDOFF.md); anonymous reviews publish instantly and directly drive the "Bestsellers" ranking.

---

## 2. Critical / High Findings

### H-1: `checkout/verify` does not use `computeTotals()` — online payments break when commerce settings change
- **File:** [app/api/checkout/verify/route.ts:141-152](app/api/checkout/verify/route.ts#L141)
- **Severity:** High (financial/functional; latent)
- **Description:** `create-order` (which sets the amount Razorpay charges) computes the total via `getCommerceSettings()` + `computeTotals()` — owner-configurable GST rate, gift-wrap fee, shipping fee/threshold. But `verify` recomputes with **hardcoded** `gst = Math.round(discountedSubtotal * 0.03)`, `giftWrapFee = 49`, and **no shipping term at all**, then requires exact paise equality against both the client total and the Razorpay order amount (line 152). Today defaults match, so it works. The moment the owner changes GST, gift-wrap fee, or enables a shipping fee at `/admin/settings/commerce`, the customer is **charged the settings-based amount by Razorpay, then verify returns "Order amount mismatch"** — money taken, no order created, for every online order.
- **Fix:** In `verify/route.ts`, replace the hardcoded block with the same `getCommerceSettings()` + `computeTotals()` call used in `create-order` and `cod`. (The file `lib/commerce/pricing.ts` literally documents itself as the "SINGLE SOURCE OF TRUTH" — this route predates that refactor and was missed.)

### H-2: Same hardcoded-total defect in the admin payment-link route
- **File:** [app/api/checkout/payment-link/route.ts:127-142](app/api/checkout/payment-link/route.ts#L127)
- **Severity:** Medium-High (admin-only caller, same failure mode)
- **Description:** Hardcodes `GIFT_WRAP_FEE = 49` and 3% GST, no shipping. If the admin UI computes totals via `computeTotals()` with non-default settings, payment-link creation will reject with "Order amount mismatch".
- **Fix:** Same as H-1 — use `computeTotals()`.

### H-3: No rate limiting + weak admin password policy on credentials login
- **Files:** [lib/auth.ts](lib/auth.ts), [app/api/admin/admins/route.ts:18](app/api/admin/admins/route.ts#L18), [app/api/admin/account/route.ts:30](app/api/admin/account/route.ts#L30)
- **Severity:** High
- **Description:** There is no rate limiting, account lockout, CAPTCHA, or 2FA anywhere in the app (verified: no ratelimit/upstash/captcha references). The login endpoint can be hammered indefinitely. Admin creation and admin password change both allow passwords as short as **4 characters** (`z.string().min(4)`). An admin account with a short password is realistically brute-forceable online, and admin = full control of products, prices, settings, and order PII.
- **Fix:** (1) Raise admin password minimum to 12 characters. (2) Add rate limiting on `/api/auth/*` (Upstash Ratelimit free tier works on Vercel; this is the owner's known pending decision #2 — it should be treated as required for login, not optional). Positive note: the timing-equalized dummy-hash compare in `authorize()` is already good practice.

---

## 3. Medium / Low Findings

### Authentication & Authorization
- **M-1: Cron endpoint open when `CRON_SECRET` unset, and the secret value is committed to git.**
  [app/api/cron/daily-digest/route.ts:21-23](app/api/cron/daily-digest/route.ts#L21) deliberately allows unauthenticated calls when the env var is missing — and per HANDOFF.md's pending-tasks table, setting `CRON_SECRET` in Vercel is still an open owner task, so **the endpoint is likely publicly callable in production right now**. Each hit scans the orders table and sends the owner a digest email (burns Resend quota; revenue data goes only to the owner's inbox, so no data leak to the caller — the JSON response does return `orders` count and `revenue` total to the caller, which IS a minor leak). Worse, the intended secret value is written in plaintext in [HANDOFF.md:258](HANDOFF.md#L258), which is committed to the repo.
  **Fix:** Generate a *fresh* secret (do not use the one in HANDOFF.md), set it in Vercel, remove the value from HANDOFF.md, and make the route return 401 when the secret is unset in production. Also drop `revenue` from the JSON response.
- **L-1: Order-confirmation page has no ownership check.** [app/order-confirmation/page.tsx:33](app/order-confirmation/page.tsx#L33) renders customer name, full shipping address, items, and totals for any valid `?orderId=`. IDs are cuids (unguessable), so this is a capability-URL pattern — acceptable for guest checkout — but the URL leaks via browser history, analytics, and shared links. Consider requiring the session user to match `order.userId` when the order belongs to an account, and showing a slimmed view otherwise.
- **L-2: Registration allows email enumeration** via the 409 "account already exists" response ([app/api/auth/register/route.ts:50](app/api/auth/register/route.ts#L50)). Standard UX trade-off; fine to keep, just noting it.

### Input Validation
- No raw SQL anywhere (verified — all access via Prisma client).
- Upload endpoint ([app/api/admin/products/upload/route.ts](app/api/admin/products/upload/route.ts)) is solid: MIME allowlist excluding SVG, 5 MB cap, server-generated public_id (no path traversal / filename injection).
- **L-3: Blog `relatedLinks.href` accepts any string** ([app/api/admin/blog/route.ts:13](app/api/admin/blog/route.ts#L13)) and is rendered as `<Link href=...>` on the public blog. Admin-only input and React blocks `javascript:` URLs, so impact is minimal — but validating `^(/|https?://)` would be cheap defense-in-depth.

### XSS / Injection
- All 12 `dangerouslySetInnerHTML` usages verified: 11 are JSON-LD with `.replace(/</g, "\\u003c")`; the 12th is the theme `<style>` whose input is strictly whitelist-sanitized in [lib/queries/theme.ts](lib/queries/theme.ts) (colour regexes + font-pairing enum). ✅
- CMS content (blog body paragraphs, reviews, settings text) renders as React text nodes — auto-escaped. ✅
- Admin notification emails escape all customer-controlled fields via `escapeHtml` ([lib/email.ts:48](lib/email.ts#L48)). ✅

### Data Exposure
- No server secrets referenced from client components (verified: `process.env.<secret>` appears only in `lib/`, `app/api/`, `scripts/`, `prisma/`). `.env.local` and `dev.db` are not tracked in git. ✅
- Reviews GET strips `userId` before responding. Public product API returns only catalog fields. ✅
- **M-2 (see M-1):** cron response leaks order count + revenue to unauthenticated callers while the secret is unset.

### Abuse / Rate Limiting (no rate limiting exists anywhere)
- **M-3: Reviews are anonymous, unmoderated, and instantly published** ([app/api/reviews/[productId]/route.ts:47](app/api/reviews/[productId]/route.ts#L47); `Review.isPublished` defaults `true` in the schema). Beyond storefront spam/defacement (competitor 1-star bombing, fake 5-stars), review count **directly drives `getBestsellers()`** ([lib/queries/products.ts:360](lib/queries/products.ts#L360)) — anyone can script a product onto the homepage Bestsellers rail. This is the owner's pending decision #1; recommend flipping the default to unpublished + an admin approval queue, plus rate limiting.
- **M-4: COD checkout is unauthenticated and unlimited** ([app/api/checkout/cod/route.ts](app/api/checkout/cod/route.ts)). A bot can create fake COD orders, reserving (decrementing) stock and burning email quota. Stock is restored only by manual cancellation. Rate limiting + (optionally) OTP-verified phone for COD would mitigate.
- **L-4:** `contact`, `newsletter`, `register`, and `coupon/validate` also lack rate limiting (coupon codes are brute-forceable; newsletter table can be filled with junk).

### Razorpay
- Signature verification: HMAC + `timingSafeEqual`, raw-body webhook verification, amount cross-check via `fetchRazorpayOrder`, exact paise equality, Serializable idempotency transaction, conditional stock decrements — **all correct**. ✅ (Except H-1 above.)
- **L-5: `Order.paymentId` has no `@unique` constraint** ([prisma/schema.prisma:109](prisma/schema.prisma#L109)). The verify route compensates with a Serializable transaction (correctly reasoned in its comment), but a DB-level unique constraint would make double-processing structurally impossible and let the transaction drop to a cheaper isolation level.
- Webhook secret unset → acknowledges and ignores (documented, reasonable pre-launch; the webhook is also still pending owner setup per HANDOFF.md).

### Cloudinary
- Upload validates type/size; public_id server-generated. ✅
- No SSRF: the pincode lookup calls a fixed host with a regex-validated 6-digit code; `next.config.ts` `remotePatterns` restricts image hosts to Cloudinary/Unsplash/Google. ✅

### Dependencies (`npm audit`: 0 critical, 2 high, 6 moderate, 1 low)
- **High — `form-data` 4.0.0-4.0.5** (CRLF injection, GHSA-hmw2-7cc7-3qxx): transitive; **fix available via plain `npm audit fix`**.
- **High — `hono` ≤4.12.24** (path traversal in serve-static on Windows + 4 others): pulled in by `prisma`'s dev tooling (`@prisma/dev`), not part of the deployed runtime; still, `npm audit fix` covers the direct hono advisory.
- Moderate: `postcss` (bundled inside `next`, fix requires a Next downgrade — ignore; not exploitable in this usage), `js-yaml` (DoS, dev), `@babel/core` (dev), `@hono/node-server` (dev).
- **Action:** run `npm audit fix` (no `--force`), then `tsc` + build to confirm.

### Functional bugs (not security)
- **M-5: The contact form silently discards messages.** [lib/email.ts:9-19](lib/email.ts#L9) — `sendContactEmail` is a `console.log` stub ("TODO: wire up email provider") while the API returns `{ success: true }` and the UI tells customers their message was sent. Resend is already integrated for order emails; wiring this up is ~10 lines.
- **L-6: Coupon case-sensitivity mismatch.** `coupon/validate` looks up the code as typed ([app/api/coupon/validate/route.ts:20](app/api/coupon/validate/route.ts#L20)) while all three checkout routes `.toUpperCase()` first. A customer typing `test1` is told the coupon doesn't exist even though checkout would accept it. Uppercase in validate too.

---

## 4. Code Quality Issues

- **Type safety:** `npx tsc --noEmit` — **clean, zero errors**. No concerning `any` usage found in reviewed files (narrow `as` casts on Prisma JSON columns are the norm here and are guarded).
- **Duplication caused H-1:** `verify`, `cod`, and `payment-link` each re-implement ~150 lines of coupon revalidation + total computation + transactional order creation. `cod` got migrated to `computeTotals()`; the other two didn't. Extract one shared `createValidatedOrder()` helper in `lib/commerce/` so the three routes cannot drift again.
- **Non-handler exports from route files:** [app/api/admin/blog/route.ts](app/api/admin/blog/route.ts) exports `blogSchema`, `generateSlug`, `ensureUniqueSlug` (imported by the `[id]` sibling). Next.js route modules should export only HTTP handlers; move these to `lib/blog-admin.ts`.
- **In-memory catalog sort:** `getProducts()` with the default "newest" sort fetches the entire product table and paginates in JS ([lib/queries/products.ts:195](lib/queries/products.ts#L195)) — explicitly documented as fine at ~191 products, but it runs on every shop-page render; revisit if the catalog reaches ~1000+. Same pattern in `getShopCategories()`.
- **ISR determinism:** clean. The only `Date.now()`/`Math.random()` uses are in client components, API routes, and admin UI — none in ISR-rendered output (the ProductJsonLd fix from the last session held; nothing regressed).
- **Broad revalidation in settings:** [app/api/admin/settings/route.ts:86](app/api/admin/settings/route.ts#L86) uses `revalidatePath("/", "layout")` — the exact "nuke" HANDOFF.md warns about for ISR-write costs. Acceptable because settings edits are rare owner actions (unlike product saves), but worth remembering if the ISR-writes chart spikes after heavy settings sessions.
- **Error handling:** consistent JSON error bodies + correct status codes throughout; unexpected errors re-throw to Next's 500 handler (no stack traces leak in production). `console.error` diagnostics stay server-side. ✅
- **Client/server boundaries:** no client component imports server-only modules (`server-only` markers present in `lib/catalog.ts`, `lib/commerce/pricing.ts` is deliberately isomorphic, `lib/settings.ts`); build passing confirms. ✅

---

## 5. Positive Observations

- **Method-level admin auth is 100%:** every exported handler in all 20 `/api/admin/*` route files does the `auth()` + `isAdmin` check — no gaps found.
- **The payment pipeline is genuinely well-engineered:** signature verify → Razorpay amount cross-check → server-side price refetch → full coupon revalidation → exact paise equality → Serializable idempotency guard → conditional (`stock: { gte: qty }`) decrements that make overselling impossible → conditional coupon-use increments. The inline comments show the failure modes were actually thought through.
- **Timing-attack hygiene everywhere:** dummy-hash compare on login, `timingSafeEqual` on webhook signature and cron bearer token.
- **XSS discipline:** every JSON-LD block escaped, theme CSS whitelist-sanitized, emails HTML-escaped, user content rendered only as React text.
- **CSRF posture:** Auth.js v5 SameSite=Lax JWT cookies + JSON-body APIs mean cross-site request forgery is effectively mitigated without extra tokens.
- **proxy.ts** lowercases paths before matching to close the Windows/macOS case-aliasing bypass — a subtle catch.
- Secrets hygiene in code is right: server-only env usage, `.env.local` untracked, public keys correctly `NEXT_PUBLIC_`.

---

## 6. Recommended Actions (priority order)

1. **Fix H-1 now** — make `checkout/verify` (and `payment-link`) use `getCommerceSettings()` + `computeTotals()`. Until then, treat `/admin/settings/commerce` as *do-not-touch*. (~30 min, prevents charged-but-rejected orders.)
2. **Run `npm audit fix`** (no `--force`), then `npx tsc --noEmit` + production build. Fixes both high advisories. (~10 min.)
3. **Set a fresh `CRON_SECRET` in Vercel** (not the value in HANDOFF.md), delete the value from HANDOFF.md, and change the cron route to 401 when unset in production; drop `revenue` from its response. (~20 min + owner action.)
4. **Wire up `sendContactEmail` via Resend** — customers currently shout into the void. (~30 min.)
5. **Add Upstash rate limiting** to login, register, reviews, contact, newsletter, coupon-validate, and COD checkout (owner's pending decision #2 — recommend "yes"). (~half day.)
6. **Review moderation** — default `isPublished` to `false` + admin approval queue (owner's pending decision #1 — recommend "yes", especially since reviews drive the Bestsellers rail). (~half day.)
7. **Raise admin password minimum to 12 chars** in `admins` + `account` schemas. (~5 min.)
8. **Add `@unique` to `Order.paymentId`** (needs `prisma db push`). (~15 min.)
9. Housekeeping: uppercase coupon codes in `validate`, move blog helpers out of the route file, validate `relatedLinks.href` format, plan a shared order-creation helper to de-duplicate the three checkout routes.

*This review modified no code. All findings verified against source at commit `13c9c2f`; `npx tsc --noEmit` clean; `npm audit` run 2026-07-02.*

---

# Round 2 — Deep review & fixes (2026-07-03)

Second full pass covering everything round 1 didn't read line-by-line: the client
checkout flow (CheckoutForm, CouponField, cart store, cart page), every remaining
admin API route, the queries layer, XML feeds, sitemap, auth pages, blog lib,
image utilities, and shop pages. **All bugs found were fixed in this round.**

## Fixed — new findings

| # | Severity | Bug | Fix |
|---|---|---|---|
| R2-1 | **High** | **Saved-address checkout silently broken** — with a pre-selected saved address, form fields were only populated on *click*; a returning customer who didn't re-click their already-selected address submitted an empty address, validation failed on hidden fields, and the Pay button appeared to do nothing ([CheckoutForm.tsx](components/CheckoutForm.tsx)). | Populate the form for the pre-selected address on mount. |
| R2-2 | **High** | **Stale coupon discount blocks checkout** — the discount was frozen at apply-time (and persisted in localStorage); changing the cart afterwards made client and server totals diverge → "Order amount mismatch" with no way for the customer to understand why. Percentage coupons also used *rounded* math client-side vs *unrounded* server-side (odd subtotals → paise mismatch). | New shared `computeCouponDiscount()` in [lib/commerce/pricing.ts](lib/commerce/pricing.ts) recomputes the discount live with exactly the server's math; used by checkout + cart page. `coupon/validate` now returns `minOrderAmount` so the client mirrors the server's minimum-order rule, with a visible note when the cart falls below it. |
| R2-3 | **High** | **Coupon controls submitted the checkout form** — the remove-coupon `✕` was a bare `<button>` (default `type=submit`), and Enter in the coupon input triggered implicit form submission; either could fire the payment flow ([CouponField.tsx](components/CouponField.tsx)). | `type="button"` + `preventDefault()` on Enter. |
| R2-4 | **High** | **Admin order-status changes leaked inventory** — cancelling an order via the admin dropdown never restored stock (the customer cancel route does); reactivating a cancelled order didn't re-reserve it ([status route](app/api/admin/orders/[id]/status/route.ts)). | Transactional stock restore/re-reserve when a status change crosses the cancelled boundary, race-safe via conditional update. |
| R2-5 | **Medium** | **Open redirect on login** — `/login?callbackUrl=https://evil.com` bounced a freshly signed-in user to any external site (phishing vector) ([login/page.tsx](app/(auth)/login/page.tsx)). | Only same-site relative paths (`/…`, not `//…` or `/\…`) are honoured. |
| R2-6 | Low | `getUnreadMessageCount` could throw into the admin layout render (violating the never-throw convention of sidebar queries). | try/catch → 0. |

## Fixed — carried over from round 1

- **M-5:** `sendContactEmail` was a console.log stub — contact messages were silently discarded. Now: every submission is **persisted to a new `ContactMessage` table first**, then emailed to the owner via Resend (best-effort, reply-to = customer). New owner surface: **/admin/messages** (list, unread badge in sidebar, mark read/unread, delete), registered in the admin quick-nav and help guide. Works today even without `RESEND_API_KEY`; email starts flowing the moment Resend is configured.
- **L-5:** `Order.paymentId` is now `@unique` in the DB (verified zero duplicate/existing rows before applying).
- **L-6:** `coupon/validate` now uppercases the code like the checkout routes (codes are always stored uppercase).
- **Blog route hygiene:** non-handler exports moved to [lib/blogAdmin.ts](lib/blogAdmin.ts); `relatedLinks.href` now validated (`/…` or `http(s)://…` only).
- **L-1:** order-confirmation now requires the owning session (or admin) for account-placed orders; guest orders remain reachable via their unguessable link.

## Verified clean in round 2 (no action needed)

- XML feeds (`product-feed.xml`, `image-sitemap.xml`, `blog/rss.xml`): all output properly XML-escaped.
- `sitemap.ts`: deterministic lastmod, deduped; shop page: all URL params parsed defensively (no NaN reaches Prisma).
- Cart store: quantities clamped (1–99), coupon/drawer state partitioned correctly.
- Taxonomy admin routes: hierarchy rules enforced (1-level nesting, same-group parent, slug uniqueness).
- Admin products/categories/hero/coupons routes: zod-validated, consistent auth.
- `lib/blog.ts`: resilient DB→seed fallback on every path.
- Login/register: NextAuth CSRF + timing-equalized compare (register enumeration noted in round 1, accepted).

## Known remaining (accepted / owner decisions)

- Admin-login rate limiting & password policy — **owner declined 2026-07-02**.
- Review moderation queue + public-form rate limiting — pending owner decision.
- 5 moderate `npm audit` advisories inside `next`/`prisma` dev tooling — fix requires major-version downgrades; not applicable at runtime.
- Pre-existing `react-hooks/set-state-in-effect` lint errors in cart hydration guard and StateCombobox sync (benign, intentional patterns; production build passes).
- If a Razorpay payment captures but order creation then fails (e.g. stock sold out mid-payment), the payment is orphaned in the Razorpay dashboard — needs the "refund owed" flag feature (owner pending decision #3).
