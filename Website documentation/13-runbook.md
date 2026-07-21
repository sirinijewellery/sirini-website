# 13 — Runbook

Practical procedures. "How do I actually do X" and "it's broken, now what".

The owner's day-to-day tasks live inside the product itself at `/admin/help`
(searchable, with deep links). This file is for the things that need a
developer or a terminal.

---

## 1. Run it locally

```bash
npm install
npm run dev            # http://localhost:3000
```

Needs a `.env` with at least `DATABASE_URL`. Without Razorpay keys the checkout
flow won't complete, but everything else works.

Useful checks before committing:

```bash
npx tsc --noEmit       # typecheck — must be clean
npm run lint
npx prisma studio      # browse the database in a GUI
```

---

## 2. Ship a change

```bash
# 1. edit
# 2. verify locally
npx tsc --noEmit

# 3. commit  (on Windows, use -F for multi-line messages — see §7)
git add -A
git commit -F commit-msg.txt

# 4. push — this is what deploys
git push origin main

# 5. wait ~2-3 min, then VERIFY ON PRODUCTION
curl -s https://sirinijewellery.com | grep -o "<the thing you changed>"
```

Step 5 is not optional. See §6 for why.

---

## 3. Roll back a bad deploy

**Fastest (no code change):** Vercel dashboard → Deployments → find the last
good one → ⋯ → **Promote to Production**. Live in seconds.

**Proper fix (keeps git honest):**

```bash
git revert <bad-commit-sha>     # creates an inverse commit
git push origin main
```

Prefer `revert` over `reset --hard` on `main` — reset rewrites shared history.

---

## 4. Common development tasks

### Add a new owner-editable setting

1. Add the type + `DEFAULT_*` constant to the right client-safe module
   (`lib/settings.ts`, `lib/catalog.ts`, `lib/commerce/pricing.ts`) or to the
   domain reader in `lib/queries/`.
   **The default must equal what the site currently shows hardcoded.**
2. Add a `cache()`-wrapped getter that merges the stored value over the default
   and falls back on error.
3. Add validation for the new key in `app/api/admin/settings/route.ts`.
4. Add the field to the relevant admin form in `components/admin/`.
5. Read it in the server component that renders it.
6. Add a how-to topic to `lib/adminHelp.ts` — **this is the owner's manual; if
   it's not there, the feature effectively doesn't exist for them.**

No migration needed — it's a new key in the `Setting` table.

### Add a new homepage section

1. Add the key to `HomeSectionKey` and `DEFAULT_SECTIONS` in
   `lib/queries/home.ts` (enabled: true).
2. Add a background colour for it to `SECTION_BG` in `app/page.tsx`.
3. Add the component to the `REGISTRY` object in `app/page.tsx`.

Existing stored orders automatically get the new key appended, enabled, so it
appears without the owner touching anything.

### Add a new browse dimension (e.g. "Shop by Metal")

Nothing to code. `/admin/shop` → create a group → add terms. It flows into the
mega-menu, sidebar filters, homepage rows and facet URLs automatically.

### Add a field to Product

1. `prisma/schema.prisma` → add the field (**make it optional or give it a
   default**, so existing rows stay valid).
2. `npx prisma migrate dev --name <description>`
3. Add it to the admin `ProductForm` and the `PUT`/`POST` validation.
4. Render it wherever it belongs.

### Add a new animation

Add the keyframes + class to `app/globals.css`, **then add the class to the
`@media (prefers-reduced-motion: reduce)` block at the bottom.** An animation
that isn't in that block is a bug.

---

## 5. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| **New image doesn't appear** | Cloudinary caches by public_id for 30 days | Re-upload under a **new public_id**. Re-uploading the same id will not work |
| **CSS changes not showing in dev** | Turbopack served stale CSS after an edit made while the server was stopped | `Remove-Item -Recurse -Force .next` then restart. Touching the mtime is not enough |
| **"Order amount mismatch" on real orders** | Client and server total math diverged | Every party must import `computeTotals()` from `lib/commerce/pricing.ts`. Never inline the math |
| **Customers getting 429** | Rate limit too tight for CGNAT'd mobile traffic | Raise the limit in the route's `enforceRateLimit` call. Checkout routes should stay ≥30 |
| **Payment taken but no order** | Verify request dropped, or stock ran out mid-payment | Check the `OrphanedPayment` table and `/admin` alerts. Refund or fulfil from the Razorpay dashboard |
| **Admin page redirects to login while logged in** | The account lacks `isAdmin` | Set `isAdmin: true` on the User row |
| **Build fails on Vercel but works locally** | Env var missing in Vercel, or a type error only strict mode catches | Check the build log; run `npx tsc --noEmit` locally |
| **Site renders with default content after an edit** | A settings read threw and fell back | Check the database connection — reads fail soft by design |
| **Animation not running in an automated browser check** | Backgrounded pane suspends the CSS animation timeline | Drive it manually: `anim.currentTime = 1000` then read `getComputedStyle` |
| **Something covers the whole page after load** | A pre-hydration script mutated React-managed DOM | The script may only toggle a class on `<html>`; CSS does the hiding. See §6 |

---

## 6. The two production lessons worth re-reading

**1. Local success proves nothing.**
The first-load splash worked perfectly in development and then covered the
entire live site permanently. In production React hydrated, found the DOM
mismatch caused by the script removing a node, silently re-rendered
client-side, and re-inserted the splash *without* re-running the inline script.
Only production verification caught it.

**2. Never let a pre-hydration script touch React-managed DOM.**
Toggle a class on `<html>` (React never reconciles `documentElement`) and let
CSS descendant selectors do the work. Same pattern `next-themes` uses.

---

## 7. Windows / PowerShell gotchas

| Task | Command |
|---|---|
| Multi-line commit message | Write it to a file, then `git commit -F msg.txt`. Inline heredocs misparse and produce `error: pathspec … did not match` |
| Working-tree diff | `git diff HEAD` (`git diff origin/HEAD...` errors with "ambiguous argument") |
| Delete build cache | `Remove-Item -Recurse -Force .next` |
| Check a port | `Get-NetTCPConnection -LocalPort 3000` |

---

## 8. Emergency: the site is down

1. **Check Vercel Deployments** — is the latest build red? If so, promote the
   last green deployment to production immediately (§3), then debug.
2. **Check the database** — the storefront fails soft on settings reads, but a
   dead database will break product pages. Check the provider's status.
3. **Check the domain/DNS** if the build is green and the database is up.
4. **Payments specifically** — verify the Razorpay keys are still set in Vercel
   env vars. A cleared env var breaks checkout while the rest of the site looks
   completely fine.

---

## 9. Regular maintenance

| Cadence | Task |
|---|---|
| Weekly | Check `/admin/pending` for incomplete catalogue data |
| Weekly | Read `/admin/messages` |
| Monthly | `npm audit` and patch high/critical advisories |
| Monthly | Check Cloudinary credit usage (transformations + bandwidth) |
| Monthly | Review Speed Insights for Core Web Vitals regressions |
| Quarterly | Verify the delivery/return/refund windows still match reality |
| Quarterly | Test the full checkout flow end to end with a real ₹1 payment |

---

*Back to the [index](README.md)*
