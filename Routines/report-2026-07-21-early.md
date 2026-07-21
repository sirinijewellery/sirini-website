# Sirini Jewellery — Daily Audit Report (Early Morning)
**2026-07-21**

Repo location note: `D:\Owner\Desktop\Claude\Sirini_Website` does not exist yet — the repo is still at `D:\Owner\Desktop\Sirini_Website`, so this audit (and report) ran there.

## Summary

| Section | Findings | Auto-fixed & deployed | Needs manual action |
|---|---|---|---|
| SEO / AEO / GEO | 6 | 0 | 0 (5 recurring, unchanged) |
| Code Bugs | 3 | 1 | 1 (1 recurring) |

**Headline:** No commits landed between yesterday's midday audit and this run — `93da77c` was still `HEAD` at the start. The one thing that had genuinely changed was `npm audit`: two **new high-severity** advisories appeared overnight (axios — DoS/prototype-pollution family; brace-expansion — ReDoS), both with **safe, non-breaking fixes** available for the first time (prior runs' moderate-only advisories all required a breaking downgrade and were correctly left alone). axios matters here because it's not dev-tooling — it's a transitive dependency of the `razorpay` SDK used on the live payment path. Applied `npm audit fix` (no `--force`), verified `npx tsc --noEmit` clean and a full production build succeeds (452 routes, no errors), committed, and **deployed to production with verified evidence**. Everything else audited this run (blog article pages, `/shop`, admin-route auth coverage, XSS surface, secret exposure, font-loading strategy, internal linking, sitemap correctness) was re-confirmed healthy with no new issues. No critical bugs found.

---

## SEO / AEO / GEO

| # | File / Area | Finding | Severity | Status |
|---|---|---|---|---|
| 1 | `app/blog/[slug]/page.tsx` (fresh check this run) | Blog articles already have a "Shop the Story" related-links block plus a closing "Shop the collection" CTA (`href="/shop"`) — internal linking from content to catalog is already solid, no gap found. | — | 🟢 Verified OK, no issue |
| 2 | `https://sirinijewellery.com/blog/meenakari-kundan-polki-guide` (fresh check this run) | Spot-checked a sample article live: clean `BlogPosting` + `BreadcrumbList` JSON-LD, answer-first prose structure ("Kundan is, strictly speaking, a setting technique rather than a stone...") that reads as directly citable by AI answer engines — good AEO shape. Zero console errors, zero failed requests. | — | 🟢 Verified OK, no issue |
| 3 | `app/layout.tsx` (fresh check this run) | Font-loading strategy re-confirmed sound: only the default pairing (EB Garamond + DM Sans) preloads; the other 8 theme-pairing font families are `preload: false` so they don't block first paint for visitors who never see them. No Core Web Vitals regression risk found. | — | 🟢 Verified OK, no issue |
| 4 | `lib/queries/content.ts` (FAQ) vs `app/shipping/page.tsx` | Recurring, unchanged: FAQ frames the return window as a defects/wrong-item "exchange"; Shipping frames the same window as a general "return" with a different eligibility list. Day-counts match (fixed `93da77c`), but the semantic framing still differs. | 🟡 Medium | 🟡 Needs owner decision (unchanged from prior runs) |
| 5 | `lib/queries/content.ts` (FAQ) | Recurring, unchanged: a developer-credit "Who made this website?" Q&A still sits inside the customer-facing `FAQPage` schema. | 🟢 Low | 🟡 Needs owner decision (unchanged) |
| 6 | `prisma/schema.prisma` (`HeroSlide`) | Recurring, unchanged: no per-slide alt/caption field — hero `alt` text is still hardcoded regardless of what's actually pictured. Needs a schema migration + admin UI field, out of scope for an unattended fix. | 🟢 Low | 🟡 Needs schema migration (unchanged) |

**Also re-verified live, no regressions:** `robots.txt` (correct disallow list, both sitemaps referenced), `sitemap.ts` (look/stone/colour facet routes from `90ca84c` still present and deduped correctly), the `?look=western` facet page (unique title still rendering, per `90ca84c`), admin-route auth gating unaffected by the dependency bump.

---

## Code Bugs

| # | File / Area | Issue | Severity | Status |
|---|---|---|---|---|
| 1 | `npm audit` — `axios` (transitive via `razorpay@2.9.6`) | **New since yesterday.** 10 advisories rolled into one entry: excessive-recursion DoS in `formDataToJSON`/`formToJSON`, prototype-pollution in auth subfields and request construction, `NO_PROXY` bypass, proxy-config leak across interceptor cloning, `maxBodyLength` bypass on two upload paths. Unlike prior runs' findings, axios sits on the **live payment path** (every Razorpay API call from `app/api/checkout/*` and the webhook handler goes through it), not just dev tooling. A non-breaking fix was available (`npm audit fix`, no `--force`) — applied, `axios` 1.16.1 → 1.18.1. | 🔴 **High** | 🟢 **Fixed & deployed** |
| 2 | `npm audit` — `brace-expansion` (transitive via `eslint`/`typescript-eslint`) | **New since yesterday.** ReDoS via exponential-time expansion of `{}` groups. Dev/lint-tooling only, never runs in the production request path, but had a non-breaking fix available — bundled into the same `npm audit fix` run. | 🔴 High (dev-tooling, no runtime exposure) | 🟢 **Fixed & deployed** |
| 3 | `npm audit` — `postcss` (bundled inside `next`'s vendored copy) | Unchanged from every prior run: CSS-stringify XSS (CWE-79), build-time only. Only `fixAvailable` path is `npm audit fix --force`, which would downgrade `next` to a 9.x canary — a regression, not a fix, on this Next 16 codebase. | 🟡 Medium (informational) | ⚪ **Needs manual action** — monitor for a proper patch release; do not downgrade (unchanged) |

**Also re-verified this run, no issues found:**
- `npx tsc --noEmit` — clean, both before and after the dependency bump.
- `npx eslint app` — 0 errors, 1 pre-existing unused-variable warning in `app/api/reviews/[productId]/route.ts` (unrelated to this run, not new).
- Admin API auth coverage — recounted: **21/21** files under `app/api/admin/**` have an `isAdmin` check, matching yesterday's manual audit.
- `dangerouslySetInnerHTML` usage — recounted: still exactly 12 files, all JSON-LD `<script>` blocks with `<` escaping (no new raw-HTML sinks introduced).
- Secret exposure — grepped every `.tsx` file for `Bearer`, `apiKey`, `RAZORPAY_KEY_SECRET`, `RESEND_API_KEY`, `CRON_SECRET` — zero matches.
- Full production build (`DOTENV_CONFIG_PATH=.env.local npm run build`) succeeded after the dependency bump — 452 routes, no errors, no new warnings.
- Live browser pass (not `curl`) on `/blog` and a blog article page — zero console errors, zero failed network requests.

---

## Deploy record

- Commit: `205fe70` — *"fix: patch high-severity axios and brace-expansion advisories"*
- `npx tsc --noEmit` ✅ clean · `npx eslint app` ✅ clean (1 pre-existing unrelated warning) · `DOTENV_CONFIG_PATH=.env.local npm run build` ✅ succeeded (452 routes, no errors)
- Pushed to `main` → Vercel deployment `dpl_C37PYZvtQSUD8a1Ge85FBTD74Mna` (`sirinijewellery.com` alias) reached `READY`/production ~4.8 min after push.
- Verified live: `curl` against `https://sirinijewellery.com/` and `/shop` both return `200`; `X-Matched-Path`/`X-Vercel-Id` headers confirm the request served from the new deployment.
- Only `package-lock.json` changed (606 insertions / 137 deletions from the dependency bump). `package.json` itself was untouched — versions moved within existing semver ranges (`razorpay`'s `axios` and `eslint`'s `brace-expansion`), no manual version pin needed.
- Pre-existing unrelated uncommitted changes in the working tree (`.claude/launch.json`, `.claude/skills/deploy-and-verify/SKILL.md`, untracked scratch folders) were left untouched, as instructed.

**Recurring open items (unchanged, not re-litigated):** FAQ "exchange" vs Shipping "return" semantic framing; developer-credit Q&A inside customer `FAQPage`; `HeroSlide` per-slide alt-text schema gap; `postcss` moderate transitive advisory (no safe fix); `sirini-world`/`sfj-world` source-vs-shipped stale facts; login brute-force throttle (declined by owner 2026-07-02).

**Note — unrelated uncommitted work found in the tree (not touched by this run):** `git status` at the start of this run (and still, after this run's commit) shows `components/LeadCapturePopup.tsx` and `eslint.config.mjs` modified with real, functional changes that this run did not make — a state-during-render refactor of the popup's dialog-close logic (moves a `setOpen(false)` out of `useEffect` into a `useRef`-guarded render-time check, with a comment citing React's recommended pattern for avoiding a cascading render) and new lint-ignore globs for `sirini-world/**`, `sfj-world/**`, `scripts/**`. These look like real work-in-progress from an earlier session, not junk — left exactly as found, not committed, not discarded. Flagging so it isn't lost or mistaken for this run's output.
