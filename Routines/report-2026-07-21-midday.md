# Sirini Jewellery — Daily Audit Report (Midday)
**2026-07-21, ~12:30 PM**

Repo location note: `D:\Owner\Desktop\Claude\Sirini_Website` does not exist yet — the repo is still at `D:\Owner\Desktop\Sirini_Website`, so this audit (and report) ran there.

## Summary

| | SEO/AEO/GEO | Code Bugs |
|---|---|---|
| Areas checked | 6 | 7 |
| 🟢 Fixed & deployed this run | 0 (already live, re-verified) | 1 new finding — already fixed & deployed by a concurrent session, confirmed live |
| 🟡 Needs manual/owner action | 0 new (5 recurring, unchanged) | 0 new (1 recurring, unchanged) |
| Verified OK, no issue | 6 | 6 |

**Headline:** No new commits had landed in application code since the last full audit (`93da77c`, verified in [report-2026-07-20-midday.md](report-2026-07-20-midday.md)) — so this run's SEO/AEO/GEO pass was a re-verification, and it held up clean (deterministic JSON-LD, correct sitemap/robots, single-H1 pages, no secret leaks, no console errors on a live browser pass). The one substantive finding was on the dependency side: `npm audit` surfaced **2 new high-severity CVEs** that weren't present in yesterday's run — `axios` (DoS/prototype-pollution family, pulled in transitively by the `razorpay` SDK, which sits on the live payment path) and `brace-expansion` (ReDoS, transitive via `eslint` tooling). **Note on concurrency:** while this run was mid-audit, a concurrent automated session independently found and fixed the same issue — commit `205fe70` ("fix: patch high-severity axios and brace-expansion advisories") landed and was pushed to `main` a few minutes into this run. Rather than duplicate it, this run independently re-verified the fix end-to-end: confirmed it's a non-breaking `npm audit fix` (no `package.json` change, `axios` 1.16.1 → 1.18.1 within the existing `^1.6.8` semver range razorpay already allows), re-ran `npx tsc --noEmit` (clean) and a full production build (452 routes, succeeded), tracked the resulting Vercel deployment through `BUILDING` → `READY` via the Vercel API, and confirmed it's live: `sirinijewellery.com` now resolves to deployment `dpl_C37PYZvtQSUD8a1Ge85FBTD74Mna` (commit `205fe70`), with a live browser pass on the homepage, `/shop`, and `/faq` showing zero console errors and all three returning `200`.

---

## SEO, AEO & GEO

| File / Area | Finding | Severity | Status |
|---|---|---|---|
| `components/ProductJsonLd.tsx` | Re-verified: `priceValidUntil` still anchored to `${year+1}-12-31` (no `Date.now()`/`Math.random()` in render output), `<` still escaped in the `dangerouslySetInnerHTML` output for stored-XSS safety. Deterministic and ISR-safe, unchanged. | — | 🟢 Verified OK, no issue |
| `app/sitemap.ts` | Re-read the full file: `look`/`stone`/`colour` facet routes (fixed in `90ca84c`) are still present alongside `category`/`occasion`/`style`/`collection`, deduped by URL, real `lastModified` dates (no `Date.now()`). | — | 🟢 Verified OK, no issue |
| `app/robots.ts` | Unchanged and correct: disallows `/admin/`, `/api/`, `/cart`, `/checkout`, `/account`, `/wishlist`, `/order-confirmation`, `/login`, `/register`; references both `sitemap.xml` and `image-sitemap.xml`. | — | 🟢 Verified OK, no issue |
| `app/about/page.tsx`, `app/contact/page.tsx`, `app/faq/page.tsx` | Spot re-checked heading hierarchy: exactly one `<h1>` per page, all confirmed. | — | 🟢 Verified OK, no issue |
| Live browser pass — homepage, `/shop`, `/faq` (production, post-deploy) | Zero console errors; all three pages returned HTTP `200`. | — | 🟢 Verified OK, no issue |
| `lib/queries/content.ts` (FAQ) vs `app/shipping/page.tsx` framing; developer-credit Q&A in `FAQPage` schema; `HeroSlide` no per-slide alt field; `npm audit` informational items; `sirini-world`/`sfj-world` source-vs-shipped facts | Recurring, unchanged from every prior run — all need an owner decision or a schema/design change, not a drop-in code fix. Not re-litigated in detail here; see [report-2026-07-20-midday.md](report-2026-07-20-midday.md) for the full description of each. | 🟡 Mixed (medium/low) | 🟡 Needs owner decision (unchanged) |

---

## Code Bugs & Security

| File / Area | Issue | Severity | Status |
|---|---|---|---|
| `node_modules/razorpay` → `axios` (transitive) | `npm audit` flagged `axios@1.16.1` (in use on the live payment path via the Razorpay SDK) for a family of high-severity CVEs: excessive-recursion DoS in `formDataToJSON`/`formToJSON`, prototype-pollution letting crafted input inject Basic-auth or alter request construction, `maxBodyLength` bypass on streamed/HTTP-2 uploads, and a `NO_PROXY` bypass for `0.0.0.0`. Fixed by a concurrent session (commit `205fe70`) via `npm audit fix` — `axios` now resolves to `1.18.1`, still within `razorpay`'s own `^1.6.8` allowed range, so `package.json` didn't need to change. Independently re-verified this run: `npm ls axios` confirms `1.18.1`, `npx tsc --noEmit` clean, full production build succeeds (452 routes), and the fix is live on production (Vercel deployment `dpl_C37PYZvtQSUD8a1Ge85FBTD74Mna`, state `READY`, aliased to `sirinijewellery.com`). | 🔴 **High** | 🟢 **Fixed & deployed** (by concurrent session; independently re-verified live this run) |
| `node_modules/@typescript-eslint/typescript-estree` → `minimatch` → `brace-expansion` (dev tooling only) | ReDoS via exponential-time expansion of consecutive non-expanding `{}` groups. Dev/lint-tooling only, never in the production runtime — but had a free non-breaking fix, so it went in with the axios fix above (same commit). | 🔴 High (dev-tooling only, no runtime exposure) | 🟢 **Fixed & deployed** |
| `@prisma/dev`'s bundled `@hono/node-server` | Middleware bypass via repeated slashes in `serveStatic` — dev-CLI only. Also resolved incidentally by the same `npm audit fix` pass. | 🟡 Moderate (dev-only) | 🟢 **Fixed & deployed** |
| `next`'s vendored `postcss` (`<8.5.10`) | XSS via unescaped `</style>` in CSS stringify output. Same as every prior run: the only fix path is `npm audit fix --force`, which would downgrade `next` to a `9.3.3` canary — a severe regression on this Next 16 codebase. Correctly left alone. | 🟡 Moderate (informational) | 🟡 Needs owner decision — unchanged from every prior run |
| `app/api/admin/**` (21 route files checked) | Re-counted and spot-checked: every admin API route file still references `session?.user?.isAdmin` with a `403` on failure. No gaps found (file count is 21, not last run's approximate 20 — no new routes added since `93da77c`, just a more precise count this pass). | — | 🟢 **OK, verified** |
| Client bundle secret exposure | Re-grepped `RAZORPAY_KEY_SECRET`, `RESEND_API_KEY`, `CRON_SECRET`, `DATABASE_URL`, `MARKETING_METRICS_API_KEY`, `RAZORPAY_WEBHOOK_SECRET` across every `.tsx` in `app/` and `components/` — zero matches, nothing leaking into the client bundle. | — | 🟢 **OK, verified** |
| `npx tsc --noEmit` | Clean, both before and after the dependency update. | — | 🟢 OK |

---

## What shipped this run

**Nothing new was committed by this run** — the one real fix needed (`axios`/`brace-expansion` high-severity advisories) was already committed and pushed by a concurrent session moments after this run started (commit `205fe70`, timestamped 13:59 IST today). This run's job on that finding became independent verification rather than authorship:

- Confirmed the fix is non-breaking: `git diff` shows only `package-lock.json` changed, no `package.json` bump, `axios` stayed within `razorpay`'s existing `^1.6.8` semver range.
- `npx tsc --noEmit` → clean.
- `DOTENV_CONFIG_PATH=.env.local npm run build` → succeeded, 452 routes, no errors.
- `npm audit` → down to 2 moderate (both the same unfixable-without-a-breaking-downgrade `postcss`/`next` finding as every prior run); the 2 new high-severity findings and the `@hono/node-server` moderate finding are gone.
- Tracked the Vercel deployment for `205fe70` via the Vercel API from `BUILDING` through a genuine ~4-minute build to `READY`, aliased to `sirinijewellery.com`, `www.sirinijewellery.com`.
- Live browser + `curl` pass against production post-deploy: homepage, `/shop`, `/faq` all `200`, zero console errors.

**Recurring open items (unchanged, not re-litigated):** FAQ "exchange" vs Shipping "return" semantic framing; developer-credit Q&A inside customer `FAQPage`; `HeroSlide` per-slide alt-text schema gap; `postcss`/`next` moderate advisory (needs a proper Next patch release, not a downgrade); `sirini-world`/`sfj-world` source-vs-shipped stale facts; login brute-force throttle (proposed and declined by the owner on 2026-07-02).
