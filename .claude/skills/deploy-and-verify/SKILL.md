---
name: deploy-and-verify
description: Use when shipping ANY change to the Sirini Jewellery site — the full loop of make-change → verify-locally → push-to-main → verify-on-production-with-evidence, plus the project's deploy gotchas (Cloudinary image cache-busting, ISR-write cost/determinism, on-demand revalidation, free-tier limits). Trigger whenever asked to deploy, ship, push, update the hero/an image, fix the site, or confirm a change is live.
---

# Deploy & verify (Sirini Jewellery)

Deploy = `git push` to `main`; Vercel auto-builds (~2-3 min). Nothing is "done"
until it is **verified live on production with evidence** — never assume.

## The loop

1. **Read first.** Next.js 16 here is *modified* — read the relevant guide in
   `node_modules/next/dist/docs/` before writing Next code (per AGENTS.md). Middleware
   is `proxy.ts`; `next/image` uses `preload` not `priority`; internal links use `next/link`.
2. **Make the change.** Match surrounding code. Put custom animations in
   `app/globals.css` behind the single `prefers-reduced-motion` guard.
3. **Verify locally** before pushing:
   - `npx tsc --noEmit` and `npx eslint <changed files>` — both must be clean.
     `next build` lints and fails the deploy on errors (e.g. raw `<a>` to an internal route).
   - For previewable UI, use the preview tools (`preview_start`, `preview_eval`,
     `preview_screenshot`). The dev server has a slow filesystem — the first compile of
     each route is slow; warm it and wait.
4. **Commit + push to `main`.** Clear message; co-author trailer per repo convention.
5. **Verify on production:**
   - Poll for the deploy: `curl -s "https://sirinijewellery.com/?cb=$RANDOM" | grep <marker>`
     (a class name or string unique to your change). Loop until it appears.
   - Behaviour/visual: drive prod with Claude-in-Chrome.
   - Report the evidence, not an assumption.

## Automation-context traps (when verifying)

- **`:focus` styles and native scroll events do NOT fire in headless automation.**
  A scripted `.focus()` sets `document.activeElement` but CSS `:focus` won't match (no window
  focus); `window.scrollTo()` may not dispatch the `scroll` listener. Verify those via CSSOM
  inspection or a manually `dispatchEvent(new Event('scroll'))`, not scripted focus/scroll.
- Preview `screenshot`/`eval` can time out on the slow FS — retry; warm the route first.

## Gotcha: make a Cloudinary image actually change for users

Symptom: you "updated" an image but users still see the old one.

- Overwriting the same `public_id` does **not** reliably bump the version, and Cloudinary sets
  `Cache-Control: max-age=2592000` (30 days) on derived images. A **versionless** URL never busts —
  the browser serves its cached copy.
- **Fix: upload under a NEW `public_id`** (`hero-editorial-2` → `-3` …) and point the code at the
  new *versioned* secure_url. That is the only reliable cache-bust.
- Tooling: `scripts/upload-hero.ts` (env `HERO_SRC`, `HERO_PUBLIC_ID`). Hero source of truth:
  `lib/queries/site.ts` `DEFAULT_HERO_IMAGE` (used when the `HeroSlide` DB table is empty).
- **Confirm you uploaded the RIGHT file** — `Read` the image, don't trust the filename. Then prove
  delivery by hashing: `curl -s "<prod transformed url>" | md5sum` must equal the local source's md5.

## Gotcha: ISR write cost (Vercel free tier = 200k writes)

- Vercel writes ISR cache **only when content changes** between revalidations. Any
  non-deterministic output in an ISR page — `Date.now()`, `Math.random()`, per-render timestamps —
  makes **every** revalidation a write and silently burns the quota (this is what maxed it once).
  Keep ISR render output deterministic.
- For data that changes on admin edits, prefer **on-demand `revalidatePath`** on the mutating API
  route over short time windows. Use **targeted paths** (`/shop/<slug>`, `/shop`, `/`) — never
  `revalidatePath("/", "layout")`, which nukes the whole site and spikes writes.

## Gotcha: Cloudinary credits (free tier = 25/mo)

- 1 credit ≈ 1,000 transformations **or** 1 GB storage **or** 1 GB bandwidth.
- The custom loader (`lib/cloudinaryLoader.ts`) makes one derived transformation per srcset width,
  so keep `next.config.ts` `deviceSizes`/`imageSizes` lean and image `quality` modest.
- If usage is over, check the dashboard breakdown first (transforms vs storage vs bandwidth) before
  recommending an upgrade — most overages are fixable in code.
- **Never expose a raw stored URL to crawlers.** Bot-facing surfaces (JSON-LD, image sitemap,
  OG/Twitter meta, Merchant feed) must wrap URLs in `botImageUrl()` from `lib/cdnImage.ts` —
  raw originals are up to 10 MB and bots downloading them burned 9+ bandwidth credits in
  one cycle (fixed 2026-07-04). Admin uploads are capped at 2400px via incoming
  transformation in `lib/cloudinary.ts`.

## After shipping

Watch the Vercel ISR-writes and Cloudinary credit charts for a day or two to confirm the change
didn't regress usage. State outcomes plainly, with the evidence.
