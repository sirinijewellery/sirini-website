# 10 — Integrations & Environment

Third-party services, every environment variable, and the deploy loop.

---

## 1. Environment variables

Set in Vercel (Project → Settings → Environment Variables) and in a local
`.env` for development. Anything prefixed `NEXT_PUBLIC_` is exposed to the
browser — never put a secret behind that prefix.

### Required

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Prisma) |
| `RAZORPAY_KEY_ID` | Razorpay key (server) |
| `RAZORPAY_KEY_SECRET` | Razorpay secret — signs and verifies payments |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same key id, needed by the browser Checkout script |

NextAuth's own secret/URL variables are also required per its standard setup.

### Recommended

| Variable | Purpose | Fallback if unset |
|---|---|---|
| `RAZORPAY_WEBHOOK_SECRET` | Verifies webhook payloads | Webhook path unusable |
| `RESEND_API_KEY` | Transactional email | Emails skipped with a console warning; contact messages still saved to the DB |
| `ORDER_FROM_EMAIL` | Sender identity | `Sirini Jewellery <onboarding@resend.dev>` |
| `CONTACT_EMAIL` | Where contact-form mail goes | `sirinijewellery@gmail.com` |
| `ADMIN_ORDER_EMAIL` | Where order notifications go | — |
| `CRON_SECRET` | Authorises the daily digest cron | **Endpoint fails closed** |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin | `https://sirinijewellery.com`. **Any `*.vercel.app` value is deliberately ignored** |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud | — |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Admin image uploads | Upload disabled |

### Optional

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | GA4. Component only mounts when set |
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager. Only mounts when set |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Overrides the hardcoded Search Console token |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Overrides the business-settings WhatsApp number |
| `NODE_ENV` | Set by the platform |

> **Why `*.vercel.app` is ignored:** preview deploys (and at one point a
> misconfigured production alias) set `NEXT_PUBLIC_SITE_URL` to a Vercel host,
> which leaked into canonicals, OG tags, sitemaps and structured data. The code
> in `lib/seo.ts` filters those out so every bot-facing URL resolves to the real
> domain regardless. A non-Vercel value (localhost in dev, or a future custom
> domain) still wins.

---

## 2. Cloudinary — images

**Cloud:** `dp8a2lvxg`. All product, brand and hero imagery lives here.

### Delivery
- **Browser:** `lib/cloudinaryLoader.ts` is registered as `next/image`'s custom
  loader in `next.config.ts`. It injects `f_auto,q_auto,w_<needed>,c_limit` and
  **chains after any existing transform** (so `e_trim` on the logo is applied
  before the resize).
- **Crawlers:** `lib/cdnImage.ts` → `botImageUrl()` injects
  `w_1200,h_1200,c_limit,q_auto:good`.

### Cost controls (these are the whole reason for the setup)
1. Cloudinary's CDN resizes and converts, instead of proxying multi-MB originals
   through Vercel's optimizer.
2. `deviceSizes: [640, 828, 1080, 1920]` and `imageSizes: [128, 256, 384]` —
   trimmed from Next's 8+8 defaults, because **every distinct width becomes its
   own billed derived asset**.
3. One shared bot transform string everywhere = one derived asset, ever.
4. `botImageUrl()` is deliberately **not** `f_auto` — Merchant Center and some
   link-preview scrapers reject AVIF.
5. A script exists to compress oversized stored originals in place.

### Cache-busting rule
Cloudinary caches by public_id for **30 days**. Swapping an image means
uploading under a **new public_id** — re-uploading the same id will not appear
for up to a month. This has bitten the project more than once.

### Allowed remote hosts
`res.cloudinary.com`, `images.unsplash.com`, `lh3.googleusercontent.com`.

---

## 3. Razorpay — payments

- Lazy singleton client (`lib/payment.ts`) so a missing key doesn't break the
  build.
- `createRazorpayOrder(amountInPaise, receiptId)` — INR.
- `fetchRazorpayOrder(orderId)` — used by verify to confirm what was actually
  paid, rather than trusting the client.
- `verifyRazorpaySignature()` — HMAC-SHA256 over `orderId|paymentId`, compared
  with `crypto.timingSafeEqual` after a length check. A plain `===` leaks timing.
- Hosted Checkout (`checkout.js`) loads at runtime in the browser.
- Webhook endpoint provides an independent second path to order creation.

**The money invariant:** the client's total is never trusted. It's recomputed
server-side from database prices and compared at exact paise; Razorpay is then
asked what was actually paid.

---

## 4. Resend — email

`lib/email.ts`. Used for contact-form notifications, order confirmations, owner
order alerts, orphaned-payment alerts and the daily digest.

**Design rule:** email is always best-effort. No `RESEND_API_KEY` → warn to the
console and return `false`. Errors are logged, never thrown. The customer-facing
result never depends on email succeeding, because the database write already
happened.

All interpolated values are HTML-escaped in the templates.

---

## 5. Google — analytics, tags, search

| Service | Integration | Notes |
|---|---|---|
| GA4 | `@next/third-parties/google` `<GoogleAnalytics>` | Only mounts when the measurement ID is set |
| Tag Manager | `<GoogleTagManager>` | **The extension point** — lets the owner add Meta Pixel, Google Ads conversion tags, etc. from the GTM dashboard with zero code |
| Search Console | `metadata.verification.google` | Env override, hardcoded fallback token |
| Merchant Center | `/product-feed.xml` | Product feed with compressed image URLs |
| Translate | `googtrans` cookie, driven by the ribbon toggle | Google's own banner/chrome is hidden in `globals.css` |

Vercel Analytics (`@vercel/analytics`) and Vercel Speed Insights
(`@vercel/speed-insights`) also run alongside GA4 — the first counts page views,
the second reports Core Web Vitals from real visitors. Both are mounted in
`app/layout.tsx` and need no environment variables; they authenticate by
deployment.

---

## 6. Vercel — hosting

- `main` branch → production. Push triggers a build (~2–3 min).
- ISR revalidation and on-demand revalidation both run here.
- `x-forwarded-for` is **overwritten** (not appended to) at Vercel's edge, which
  is what makes the IP-keyed rate limiter safe against header spoofing.
- Serverless instances are ephemeral — hence the in-memory rate limiter's
  per-instance caveat.
- `vercel.json` holds cron configuration.

### Security headers (`next.config.ts`, site-wide)

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(self)
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

No CSP yet — see [11](11-security-and-performance.md) for why.

### Rewrites
`/world` → `/world.html` (the self-contained 3D experience in `public/`).

---

## 7. The deploy loop

```
1. Make the change
2. Verify locally  (npm run dev, npx tsc --noEmit, npm run lint)
3. git commit  (message via -F file on Windows — see gotchas)
4. git push origin main
5. Wait ~2–3 min
6. VERIFY ON PRODUCTION with evidence:
     - curl the live URL and check the actual rendered output
     - inspect the live DOM for the specific change
     - screenshot if it's visual
7. Only now is it done
```

Step 6 is not optional. Local success proves nothing about production — the
splash bug that covered the entire live site *worked perfectly in development*.

---

## 8. Environment gotchas

Recorded in `.claude/skills/deploy-and-verify/SKILL.md` and repeated here
because they cost real time.

| Gotcha | Symptom | Fix |
|---|---|---|
| **Cloudinary 30-day cache** | New image doesn't appear | Upload under a new public_id |
| **Turbopack stale CSS** | Edits to `globals.css` made while the dev server was stopped are still missing after restart, even after touching the mtime | `Remove-Item -Recurse -Force .next`, then restart |
| **Hidden browser pane freezes animations** | `getAnimations()` reports `playState: "idle"`, `currentTime: 0` forever | The pane is backgrounded; the CSS animation timeline is suspended. Verify by setting `anim.currentTime = <ms>` manually and reading `getComputedStyle` at sampled timestamps |
| **PowerShell multi-line commit messages** | `error: pathspec '…' did not match any file(s)` | Write the message to a file and use `git commit -F <path>` |
| **`git diff origin/HEAD...`** | `fatal: ambiguous argument` | Use `git diff HEAD` for working-tree changes |
| **ISR write cost** | Metered writes accumulating with no content change | On-demand, scoped revalidation instead of short intervals |

---

*Next: [11 — Security & Performance](11-security-and-performance.md)*
