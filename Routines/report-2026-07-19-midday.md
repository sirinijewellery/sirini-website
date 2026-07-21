# Sirini Jewellery — Daily Audit Report (Midday)
**2026-07-19, ~12:30 PM**

## Summary

| | SEO/AEO/GEO | Code Bugs |
|---|---|---|
| Areas checked | 11 | 10 |
| 🟢 Auto-fixed this run | 0 | 0 |
| 🟡 Needs manual/owner action | 0 new (5 recurring, unchanged) | 0 new (2 recurring, unchanged) |
| Verified OK, no issue | 11 | 10 |

**Headline:** No code changes shipped this run — nothing new needed fixing. Two thorough passes already ran on the site *today*: an automated early-morning run (`report-2026-07-19-early.md`, 3 commits: rate limiting, SEO/GEO fact-consistency + structured-data fixes, checkout race-condition fix) and a manual one-off SEO/GEO deep-dive (`report-2026-07-19-manual-seo.md`, JSON-LD entity-graph consolidation). Since those, **5 more feature/fix commits landed** on `main` (shared email schema, checkout money-path hardening, the new lead-capture pipeline, admin coupon fixes, and the entity-graph commit itself) — all already pushed and live. This run's job was to (a) verify none of that regressed anything, and (b) specifically audit the newly-shipped lead pipeline and coupon-admin code since neither had been reviewed by a prior audit. Everything checked out clean: `tsc` passes, `npm audit` is unchanged, the entity-graph `@id`s are confirmed live on production, and the new `/api/leads*` and `/api/admin/coupons/*` routes all have correct auth, input validation, and rate limiting. No commits, no deploy needed this run.

---

## SEO, AEO & GEO

| File / Area | Finding | Severity | Status |
|---|---|---|---|
| Homepage JSON-LD (`components/OrganizationJsonLd.tsx`, `WebSiteJsonLd.tsx`, `LocalBusinessJsonLd.tsx`) | Verified live on production: `curl https://sirinijewellery.com/` now returns `"@id":".../#organization"` and `"@id":".../#website"` — the entity-graph fix from the manual SEO run (commit `309a5ea`) is confirmed deployed and working, not just committed. | — | 🟢 Verified live, OK |
| `robots.txt` (production) | Re-fetched live: correctly disallows `/admin/`, `/api/`, `/cart`, `/checkout`, `/account`, `/wishlist`, `/order-confirmation`, `/login`, `/register`; both sitemaps listed. | — | 🟢 Verified OK |
| `llms.txt` (production) | Re-fetched live: accurate, consistent brand facts (Mumbai, est. 2017, Kundan/Meenakari/Polki/gold-plated, 7-day exchange, COD) matching the site-wide GEO fact set from prior runs. | — | 🟢 Verified OK |
| `sitemap.xml` (production) | Re-fetched live: valid XML, homepage/shop/occasions entries present with correct priority/changefreq. | — | 🟢 Verified OK |
| `components/LeadCapturePopup.tsx` (new since last audit) | New client-only dialog, mounts nothing until an 8s timer fires and only renders via a portal — no layout-shift risk (CLS), no effect on SSR/crawled HTML, `aria-label` present on the email input. Not a page-level component so it carries no metadata/indexing surface. | — | 🟢 Verified OK, no CWV/AEO impact |
| `app/api/leads/route.ts`, `app/api/leads/coupon/route.ts` (new) | Neither route renders to any page (leads are exported machine-to-machine, not shown in an admin UI page) — no stored-XSS or indexing surface from free-text `source`/`email` fields. | — | 🟢 Verified OK |
| GEO fact consistency (96-row "22kt"→"18–22K" DB fix, shipping/return JSON-LD) | Re-spot-checked one product page live — description still clean, JSON-LD `transitTime`/`merchantReturnDays` still reading live settings, not hardcoded. No drift since this morning's fix. | — | 🟢 Verified OK, unchanged |
| `lib/queries/content.ts` (FAQ) vs `app/shipping/page.tsx` | Recurring, unchanged: FAQ frames the 7-day window as a defects/wrong-item "exchange"; Shipping frames the same window as a general "return" with a different eligibility list. | 🟡 Medium | 🟡 Needs owner decision (unchanged from prior runs) |
| `lib/queries/content.ts` (FAQ) | Recurring, unchanged: a developer-credit "Who made this website?" Q&A still sits inside the customer-facing FAQPage schema. | 🟢 Low | 🟡 Needs owner decision (unchanged) |
| `prisma/schema.prisma` (`HeroSlide`) | Recurring, unchanged: no per-slide alt/caption field. | 🟢 Low | 🟡 Needs schema migration (unchanged, out of scope for an unattended fix) |
| `sirini-world/`, `sfj-world/` source projects | Recurring, unchanged: same "22kt"/stale-fact class of issue lives in the *source* of the separate 3D `/world` experience; the compiled, served output (`public/world.html`) was already fixed. Zero live-site exposure. | 🟢 Low | 🟡 Flagged for next rebuild of that experience (unchanged) |

---

## Code Bugs & Security

| File / Area | Issue | Severity | Status |
|---|---|---|---|
| `app/api/leads/route.ts` (POST, new) | Input validated via shared `emailSchema` (trim+lowercase+email+max 254); rate-limited 30/10min (CGNAT-aware, matches checkout routes' reasoning); upsert is idempotent per email. | — | 🟢 Verified OK, no gaps |
| `app/api/leads/route.ts` (GET, new) | Key-authed via `isAuthorizedByApiKey` (fail-closed, `timingSafeEqual`); no rate limit on the GET, but this matches the existing accepted pattern for other key-authed machine routes (`marketing-metrics`) which also carry no rate limit — a leaked key is the real exposure there, not brute-force, since the comparison is timing-safe and fails closed. | — | 🟢 Verified OK, consistent with existing pattern |
| `app/api/leads/coupon/route.ts` (new) | Key-authed + rate-limited (10/10min, mutates real Coupon rows); idempotent per email (unique constraint + pre-check + P2002 re-read); code generation uses `crypto.randomBytes` with an unbiased 32-char alphabet. | — | 🟢 Verified OK |
| `app/api/contact/route.ts` (modified) | New lead-upsert side-effect wrapped in its own try/catch so a lead-write failure can never break the actual contact submission (which persists to DB first, before any best-effort email). Correct fail-safe ordering. | — | 🟢 Verified OK |
| `app/api/admin/coupons/route.ts`, `[id]/route.ts` (modified) | Both admin-gated (`session?.user?.isAdmin` first statement in every handler); PUT now does a proper partial-update (only writes keys present in body) fixing the prior expiry-truncation bug; code-conflict and not-found checks precede any mutating Prisma call to avoid unhandled `P2025`/`P2002` 500s. | — | 🟢 Verified OK |
| `app/api/checkout/verify/route.ts` (modified) | Re-reviewed the orphaned-payment hardening: the new "amount mismatch after capture" path now calls `recordOrphanedPayment()` before returning 400 (previously captured money could go unflagged on this path) — correct, closes a real gap. Zod `customerEmail` now normalizes to lowercase at the boundary, matching lead-email lookups. | — | 🟢 Verified OK, fix is sound |
| `app/api/checkout/cod/route.ts`, `payment-link/route.ts` (modified) | Same lowercase-email normalization applied consistently. | — | 🟢 Verified OK |
| `lib/apiKeyAuth.ts`, `lib/validation.ts` (new shared helpers) | `isAuthorizedByApiKey` correctly fail-closed (returns `false` if env var unset) and timing-safe (length check before `timingSafeEqual`, which throws on mismatched lengths). `emailSchema` now shared across newsletter/register/admin-account/leads/contact — eliminates the prior three hand-rolled variants; newsletter route picked up lowercasing it didn't have before (intentional behavior note in the commit, not a regression). | — | 🟢 Verified OK |
| `npx tsc --noEmit` | Clean — no errors, including across all 5 new commits since the early-morning run. | — | 🟢 OK |
| `npm audit` | Same 5 moderate advisories as every prior run, unchanged: Next's bundled `postcss` (CSS-stringify XSS, CWE-79) and Prisma's dev-CLI `@hono/node-server` (path bypass, CWE-22) — both transitive, build-time/dev-tooling only, never shipped to the browser or production runtime. | 🟡 Medium | 🟡 Needs owner decision — unattended `npm audit fix --force` would downgrade Next to a 9.x canary or Prisma to 6.x on this Next 16/Prisma 7 codebase; not safe to apply automatically (unchanged from prior runs) |
| `lib/auth.ts` — brute-force login throttle | Still absent. | 🟢 Low | Noted only — explicitly proposed and declined by the owner on 2026-07-02; not re-flagged as new |

---

## What shipped this run

**Nothing.** No code changes were made — this run's audit of the 5 new commits since the early-morning report found them all sound (correct auth, validation, rate limiting, and idempotency), and re-verification of the entity-graph JSON-LD fix confirmed it's already live on production. No deploy was necessary.

**Verification performed:**
- `npx tsc --noEmit` → clean.
- `npm audit` → unchanged (5 moderate, all transitive/dev-only, matches prior runs).
- `curl https://sirinijewellery.com/` → `200`, JSON-LD contains `@id":".../#organization"` and `@id":".../#website"` (entity-graph fix confirmed live).
- `curl https://sirinijewellery.com/robots.txt`, `/llms.txt`, `/sitemap.xml` → all correct and unchanged from prior audits.
- Read and reviewed all files touched by the 5 commits since the last audit (`lib/apiKeyAuth.ts`, `lib/validation.ts`, `app/api/leads/route.ts`, `app/api/leads/coupon/route.ts`, `app/api/contact/route.ts`, `app/api/checkout/verify|cod|payment-link/route.ts`, `app/api/admin/coupons/route.ts` + `[id]/route.ts`, `components/LeadCapturePopup.tsx`, `prisma/schema.prisma`) — no bugs or security gaps found.

**Recurring open items (unchanged, not re-litigated):** FAQ "7-day exchange" vs Shipping "7-day return" framing; developer-credit Q&A inside customer FAQPage; `HeroSlide` per-slide alt-text schema gap; `npm audit` moderate transitive advisories; `sirini-world`/`sfj-world` source-vs-shipped stale facts; login brute-force throttle (declined by owner).
