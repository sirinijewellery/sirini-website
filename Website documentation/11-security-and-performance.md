# 11 — Security & Performance

The posture, the reasoning, and the deliberate gaps.

---

# Part 1 — Security

## 1. Authentication & authorisation

| Control | Implementation |
|---|---|
| Password storage | bcrypt hashes, never plaintext |
| Login identifier | Email **or** username, case-insensitive, both stored lowercase |
| User enumeration | Blocked — a dummy bcrypt hash is compared when the user doesn't exist, so a wrong username takes the same time as a wrong password |
| Sessions | JWT; `id` and `isAdmin` carried in the token so route protection needs no DB hit |
| Route protection | `proxy.ts` wraps `auth()`; `/admin/*` requires `isAdmin`, `/account`, `/wishlist`, `/checkout` require login |
| Case-sensitivity bypass | Pathname is **lowercased before matching** — on case-insensitive filesystems `/Admin` resolves to the same route and would otherwise skip the check |
| Failure mode | Non-admins are redirected to `/login?callbackUrl=…` — a prompt, not a silent bounce |
| Machine auth | Separate API-key path (`lib/apiKeyAuth.ts`) with timing-safe comparison, never sessions |
| Admin self-protection | You cannot delete yourself or the last remaining admin. Changing your own credentials requires the current password |

## 2. Payment integrity

The highest-risk surface, so it gets the most controls:

1. **The client never sets the price.** Totals are recomputed server-side from
   database prices on every checkout route.
2. **Exact-paise comparison** between the client's stated total and the server's
   recomputation. Mismatch → reject.
3. **One implementation of the math** (`computeTotals()`), imported by the
   checkout form and both routes, because divergence rejects real orders.
4. **HMAC signature verification** on the Razorpay callback, compared with
   `crypto.timingSafeEqual` after a length check.
5. **Independent amount confirmation** — the verify route re-fetches the order
   from Razorpay and checks what was actually paid.
6. **Stock re-checked** at order creation, not just at add-to-cart.
7. **Database-level idempotency** — `Order.paymentId` is `@unique`, so the
   verify route and the webhook can never both create an order for one payment,
   even under a race.
8. **Orphaned-payment capture** — a captured payment that can't become an order
   is recorded in `OrphanedPayment` (unique `paymentId`, so both writers stay
   idempotent) and the owner is emailed to refund or fulfil manually. Including
   on serialization conflicts.
9. **Coupon recomputation** — the discount is recalculated against the *current*
   subtotal, never a value frozen at apply-time, because the cart can change
   after a coupon is applied.

## 3. Input handling

- **Zod validation** at every route boundary; shared schemas in
  `lib/validation.ts` so the client form and the API agree.
- **Colour injection** — owner colours pass strict regexes (hex 3/6/8, `rgb()`,
  `rgba()`, `hsl()`, `hsla()`) before they can reach the inlined `<style>`.
  Anything else is rejected.
- **Font injection** — pairing keys must match a whitelist.
- **Settings writes** — per-key validation; unknown section keys, invalid shapes
  and out-of-range numbers are dropped or rejected.
- **Owner content is structured, never raw HTML.** Pages are arrays of
  `{ heading, body }` strings; blog bodies are `{ heading?, paragraphs[] }`.
  There is no HTML injection path from the admin.
- **JSON-LD escaping** — structured data is escaped before being embedded in
  `<script type="application/ld+json">` (this was an actual XSS fix).
- **XML escaping** — the image sitemap routes all interpolated values through
  one shared `esc()` helper.

## 4. Rate limiting

`lib/rateLimit.ts` — a zero-dependency in-memory fixed-window limiter.

- Keyed on the **first hop of `x-forwarded-for`**, which is the real client IP on
  Vercel because Vercel **overwrites** rather than appends that header at its
  edge. That's what makes it unspoofable here.
- Scoped per endpoint so one form's usage doesn't consume another's allowance.
- Returns a ready-made `429` with `Retry-After`.
- Buckets swept at most once a minute so the Map can't grow unbounded.

| Endpoint class | Limit / 10 min |
|---|---|
| Contact, newsletter, register, reviews | 5 |
| Coupon mint | 10 |
| Addresses, coupon validate, order cancel | 20 |
| Checkout routes, pincode, leads, wishlist write | 30 |
| Search, product detail, wishlist check | 60 |

Checkout is intentionally generous: Indian mobile traffic is heavily CGNAT'd, so
many unrelated shoppers share one IP. A tight limit would 429 genuine customers
during a promo spike — a worse outcome than the abuse it would prevent.

**Known limitation (documented in the source):** on Vercel this throttles per
serverless instance, not globally. It blunts a single-source flood at zero cost;
a hard guarantee would swap the Map for Upstash behind the same interface.

## 5. Transport & headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(self)
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

`geolocation=(self)` rather than `()` because `ShippingLocationBar` calls
`navigator.geolocation` and would be silently blocked the day it's wired into a
page. `(self)` still denies all third-party frames.

## 6. Secrets

- Only `NEXT_PUBLIC_*` variables reach the browser; the Razorpay **secret**,
  Cloudinary secret, Resend key and cron secret are server-only.
- The cron endpoint **fails closed** if `CRON_SECRET` is unset — no secret, no
  execution.
- API keys and payment signatures are compared timing-safely.

## 7. Dependency hygiene

Several `npm audit fix` rounds: axios, brace-expansion, form-data, hono,
js-yaml, `@babel/core`. Vendored directories are excluded from lint so real
issues aren't buried in noise.

## 8. Known gaps (deliberate, documented)

| Gap | Why | What it would take |
|---|---|---|
| **No CSP** | Razorpay's `checkout.js` loads at runtime and JSON-LD relies on inline `<script>` tags. A strict CSP needs careful allowlisting and testing first | Allowlist Razorpay + GTM/GA hosts, add nonces or hashes for inline scripts (including the splash-dismissal script), test the full checkout flow |
| **Per-instance rate limiting** | Free-tier, zero-dependency | Swap the Map for Upstash Ratelimit behind the same interface |
| **Admin login hardening** (2FA, lockout) | Explicitly declined by the owner as too much friction for a small team | 2FA or an attempt-count lockout |

---

# Part 2 — Performance

## 1. Images — the biggest lever

Product photography dominates the page weight of a jewellery site.

- Cloudinary's CDN does resize + AVIF/WebP conversion (`f_auto,q_auto,w_,c_limit`)
  instead of proxying multi-MB originals.
- Width ladder trimmed to `[640, 828, 1080, 1920]` + `[128, 256, 384]` — fewer
  billed derived assets and a smaller srcset to parse.
- Bot-facing surfaces get one shared compressed transform. Crawlers were
  fetching 8–10 MB originals and draining bandwidth credits.
- `c_limit` preserves native aspect ratio — which is why product OG images carry
  no hardcoded dimensions; any fixed pair would be wrong for most products and
  would distort link-preview cards.
- Lazy thumbnails; `preload` only on true LCP images.
- CDN `preconnect` + `dns-prefetch` in the layout (no `crossOrigin` — `<img>`
  requests to Cloudinary aren't CORS, and a plain preconnect is what actually
  gets reused).

### Measured: the AVIF opportunity (2026-07-21)

Real measurements against production Cloudinary URLs, verified with a genuine
Chrome `User-Agent` and `Accept: image/avif,image/webp,…` (a curl default UA
gives the same result, so this is not a content-negotiation artifact):

| Transform | w_640 | w_1080 | Format served @1080 |
|---|---|---|---|
| Raw stored original | — | — | 443 KB JPEG |
| `f_auto,q_auto` **(current)** | 62.3 KB | 176.9 KB | **jpeg** |
| `f_avif,q_auto` | 47.5 KB | 129.8 KB | avif |
| `f_avif,q_auto:eco` | 37.7 KB | 101.5 KB | avif |

**Finding:** `f_auto` is returning **JPEG** at the two most-used widths (and
WebP only at w_1920). Explicit AVIF is **24–27% smaller at identical quality
settings**, and ~40% smaller at `q_auto:eco`.

**Cause:** AVIF is not in this account's `f_auto` rotation. Cloudinary's
auto-format only considers AVIF when it's enabled in the account's optimization
settings; otherwise it picks the best of JPEG/WebP — and for these images JPEG
genuinely wins at smaller widths.

**The fix is a dashboard toggle, not a code change.** Enabling AVIF for
`f_auto` in Cloudinary keeps content negotiation intact: browsers that support
AVIF get it, everything else transparently falls back.

**Do NOT hardcode `f_avif` in the loader.** AVIF is unsupported on iOS ≤ 15 and
older Android browsers, which still carry real traffic share in India. On a
site where the product *is* the photograph, serving a broken image to those
visitors costs far more than the bytes saved. Content negotiation is exactly
what `f_auto` exists for — fix it at the account level and the code stays safe.

`q_auto:eco` was also considered and rejected: the extra ~15% is not worth the
visible loss of stone sparkle and metal detail on jewellery photography.

## 2. Fonts

**The single biggest measured win.** Ten font families are declared at build
time so the owner can switch pairings — but `next/font` defaults to
`preload: true`, which was emitting `<link rel="preload">` for **15 font files
on every page load**, for fonts that weren't rendering.

`preload: false` on the eight non-default pairings cut that to **3**. They still
work identically when selected, just fetched on demand. All families use
`display: "swap"` so text is never invisible.

## 3. Caching

| Surface | Strategy |
|---|---|
| Homepage | ISR, `revalidate = 600` |
| Product pages | ISR + on-demand revalidation on admin edit |
| Settings reads | `React.cache()` — a value read by five components is one query |
| Cart / recently-viewed | Client-side Zustand + localStorage, no server round-trip |

On-demand revalidation replaced short-interval revalidation, which was
generating constant metered ISR writes even when nothing had changed.

## 4. Perceived performance

Real speed and *felt* speed are different problems; both were addressed.

- `nextjs-toploader` — immediate feedback on every navigation.
- `app/loading.tsx` — branded logo loader with a 300ms anti-flash delay.
- `app/shop/loading.tsx` and `app/shop/[slug]/loading.tsx` — skeletons that match
  the real layouts. The shop skeleton imports `PRODUCT_GRID_CLASSES` from
  `ProductGrid` so the two grids can't drift.
- Branded shimmer in warm cream, not the usual grey — even the loading state is
  on-brand.
- **First-load splash.** This is the one that mattered: `loading.tsx` boundaries
  only cover route *transitions*, and ISR-cached pages resolve instantly, so the
  initial page load — the wait users actually feel — had no coverage at all. A
  server-rendered splash now paints the breathing logo straight from the HTML
  before any JS runs, invisible for the first 800ms so fast loads never see it,
  dismissed on `DOMContentLoaded` with a 6s failsafe.

### The hydration lesson

The first splash implementation removed the splash node from the DOM. In
production, React detected the structural mismatch during hydration, silently
fell back to client rendering, and **re-inserted the splash — without re-running
the inline script** (innerHTML-injected scripts are inert). The overlay faded in
at 800ms and covered the live site permanently.

**The rule that came out of it:** a pre-hydration inline script must never
mutate or remove a React-managed DOM node. Toggle a class on `<html>` instead —
React never reconciles `documentElement`'s classList — and let CSS descendant
selectors do all the hiding. This is the same pattern `next-themes` uses.
`suppressHydrationWarning` on `<html>` silences the expected attribute diff.

## 5. Measurement

Two Vercel products, both mounted in the root layout, doing different jobs:

| Package | Component | Measures |
|---|---|---|
| `@vercel/analytics` | `<Analytics />` | Page views, referrers, top pages |
| `@vercel/speed-insights` | `<SpeedInsights />` | **Core Web Vitals from real visitors** — LCP, CLS, INP, FCP, TTFB |

> Speed Insights was **not installed until 2026-07-21** — the dashboard had
> collected nothing since launch, so every performance decision before that date
> was made from lab measurement and reasoning rather than field data. Field data
> starts accumulating from that deploy; allow a few days of traffic before the
> percentiles mean anything.

**Lab vs field:** lab tools (Lighthouse, curl) tell you what *can* be slow;
Speed Insights tells you what *is* slow for real customers on real Indian mobile
networks. Optimise against the field data — it's the only one that reflects
actual devices and connections.

## 6. Verification technique

Animation timing is verified by driving the clock, not by waiting:

```js
const anim = document.querySelector('#sirini-splash').getAnimations()[0];
anim.currentTime = 1000;
getComputedStyle(el).opacity;   // → 0.68, mid-fade
```

A backgrounded browser pane suspends the CSS animation timeline entirely
(`playState: "idle"`, `currentTime: 0` forever), so real elapsed time is not a
reliable measurement in an automated context.

---

*Next: [12 — New Project Blueprint](12-new-project-blueprint.md)*
