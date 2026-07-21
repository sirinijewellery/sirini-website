# 09 — API Reference

44 route handlers under `app/api/`. Rate limits are `(limit, window)` per IP per
scope; the window is 10 minutes everywhere.

**Auth legend:** 🌐 public · 👤 logged-in user · 🔑 admin session · 🗝️ API key ·
🤖 signature/secret

---

## Checkout & payments

| Route | Method | Auth | Rate limit | Purpose |
|---|---|---|---|---|
| `/api/checkout/create-order` | POST | 🌐 | 30 | Recomputes the cart total server-side from DB prices, compares to the client total at exact paise, creates a Razorpay order |
| `/api/checkout/verify` | POST | 🌐 | 30 | Verifies the Razorpay HMAC signature (timing-safe), re-fetches the order from Razorpay to confirm the amount paid, checks stock, creates the `Order`. On failure writes an `OrphanedPayment` and emails the owner |
| `/api/checkout/cod` | POST | 🌐 | 30 | Cash-on-delivery path. Same server-side recomputation, plus COD-enabled and `codMaxOrder` checks |
| `/api/checkout/failed` | POST | 🌐 | 30 | Records a failed/abandoned payment attempt |
| `/api/checkout/payment-link` | POST | 🌐 | — | Razorpay payment-link fallback |
| `/api/webhooks/razorpay` | POST | 🤖 | — | Independent second order-creation path. Webhook-secret verified. Shares the unique-`paymentId` idempotency guard with `/verify` |

> The rate limits here are deliberately **high (30)**. Indian mobile traffic is
> heavily CGNAT'd — many unrelated shoppers share one IP — so a low ceiling
> would 429 real customers during a promo spike.

---

## Catalogue (public reads)

| Route | Method | Auth | Rate limit | Purpose |
|---|---|---|---|---|
| `/api/products/[slug]` | GET | 🌐 | 60 | Single product |
| `/api/search` | GET | 🌐 | 60 | Search with category synonym mapping |
| `/api/reviews/[productId]` | GET / POST | 🌐 | 5 | Read reviews / submit a review |
| `/api/pincode` | GET | 🌐 | 30 | Proxies an external pincode lookup. Rate-limited specifically because it's an unthrottled third-party proxy |
| `/api/coupon/validate` | POST | 🌐 | 20 | Validates a coupon against a subtotal |

---

## Customer

| Route | Method | Auth | Rate limit | Purpose |
|---|---|---|---|---|
| `/api/auth/[...nextauth]` | — | 🌐 | — | NextAuth handlers |
| `/api/auth/register` | POST | 🌐 | 5 | Account creation |
| `/api/addresses` | GET / POST | 👤 | 20 | List / create address |
| `/api/addresses/[id]` | PUT / DELETE | 👤 | 20 | Update / delete address |
| `/api/wishlist` | POST / DELETE | 👤 | 30 | Add / remove |
| `/api/wishlist/check` | GET | 👤 | 60 | Is this product wishlisted |
| `/api/orders/[id]/cancel` | POST | 👤 | 20 | Customer-initiated cancellation |

---

## Growth

| Route | Method | Auth | Rate limit | Purpose |
|---|---|---|---|---|
| `/api/contact` | POST | 🌐 | 5 | **Writes `ContactMessage` first**, then best-effort email via Resend |
| `/api/newsletter` | POST | 🌐 | 5 | Newsletter subscription |
| `/api/leads` | POST | 🌐 | 30 | Capture a lead (popup / contact) |
| `/api/leads` | GET | 🗝️ | 30 | Key-authed export, with a `purchased` flag per lead |
| `/api/leads/coupon` | POST | 🗝️ | 10 | Mints a single-use coupon attributed to a lead's email. Idempotent — a repeat mint returns the existing code |
| `/api/marketing-metrics` | GET | 🗝️ | — | Read-only metrics for an external marketing agent. Timing-safe key comparison |
| `/api/cron/daily-digest` | GET | 🤖 | — | Daily revenue digest. **Fails closed** if `CRON_SECRET` is unset |

---

## Admin (all 🔑 admin session required)

### Products
| Route | Methods |
|---|---|
| `/api/admin/products` | GET, POST |
| `/api/admin/products/[id]` | GET, PUT, DELETE |
| `/api/admin/products/upload` | POST — Cloudinary upload, 5 MB cap |

Writes trigger on-demand revalidation of the affected storefront paths.

### Taxonomy
| Route | Methods |
|---|---|
| `/api/admin/taxonomy` | GET, POST — the tree / create a group |
| `/api/admin/taxonomy/groups/[id]` | PATCH, DELETE |
| `/api/admin/taxonomy/terms` | POST |
| `/api/admin/taxonomy/terms/[id]` | PATCH, DELETE |

### Content & merchandising
| Route | Methods |
|---|---|
| `/api/admin/categories` | GET, POST |
| `/api/admin/categories/[id]` | PUT, DELETE |
| `/api/admin/hero` | GET, POST |
| `/api/admin/hero/[id]` | PATCH, DELETE |
| `/api/admin/blog` | GET, POST |
| `/api/admin/blog/[id]` | PUT, DELETE |
| `/api/admin/coupons` | GET, POST |
| `/api/admin/coupons/[id]` | PUT, DELETE |

### Operations
| Route | Methods |
|---|---|
| `/api/admin/orders/[id]/status` | PATCH |
| `/api/admin/messages/[id]` | PATCH (mark read), DELETE |

### Configuration
| Route | Methods |
|---|---|
| `/api/admin/settings` | GET, PATCH — the single write path for **every** `Setting` key |
| `/api/admin/account` | GET, PATCH — own username / name / password (current password required) |
| `/api/admin/admins` | GET, POST |
| `/api/admin/admins/[id]` | PATCH, DELETE — cannot delete yourself or the last admin |

---

## Conventions

**Validation.** Zod schemas at the route boundary. Shared schemas (e.g. email)
live in `lib/validation.ts` so client forms and routes agree.

**Settings writes.** `PATCH /api/admin/settings` takes `{ key, value }` and
validates per key: colours pass a strict regex, font keys a whitelist, section
keys an enum set, numbers a range. Unknown keys and invalid shapes are rejected
or dropped — a malformed stored value must never be able to break the
storefront.

**Rate limiting.** `lib/rateLimit.ts` — a zero-dependency fixed-window limiter
keyed on the first hop of `x-forwarded-for` (the real client IP on Vercel,
which **overwrites** rather than appends that header at its edge, so it can't
be spoofed). Scope namespaces the bucket so a contact submission doesn't consume
a newsletter allowance. Returns a ready-made `429` with a `Retry-After` header.
Buckets are swept at most once a minute so the Map can't grow unbounded.

> Caveat, documented in the source: on Vercel this throttles **per serverless
> instance**, not globally. It blunts a single-source flood for free; a hard
> global guarantee would swap the Map for Upstash behind the same interface.

**API-key auth.** `lib/apiKeyAuth.ts`, compared timing-safely. Used only for the
machine-to-machine endpoints (leads, coupon mint, marketing metrics).

**Error shape.** JSON `{ error: "human-readable message" }` with an appropriate
status. Customer-facing messages never leak internals.

**Idempotency.** Anything that can be retried by an external system (payment
verification, webhook delivery, coupon minting) is idempotent, enforced by a
unique database constraint rather than an application-level check alone.

---

*Next: [10 — Integrations & Environment](10-integrations-and-env.md)*
