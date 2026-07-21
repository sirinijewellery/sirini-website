# SIRINI — The Promise
One continuous interactive 3D world for Sirini Jewellery — the B2C sister of `sfj-world/`.

## Open it (no server needed)
Double-click **`dist/Sirini_World.html`** — everything (Three.js, fonts, all 19 images, the whole
experience) is inlined into that one file. It makes **zero network requests**, so it works
identically from a double-click (`file://`), a local server, or any static host.

## Local preview server (optional)
```
node server.mjs        →  http://localhost:4174
```
(Also registered as the `sirini-world` config in `.claude/launch.json`.)

## The journey
Scroll (wheel, touch, arrows, space, or the chapter dots on the right edge) to follow the promise:

Threshold → Prologue → I Our Story → II At a Glance → III The Craft → IV Collections (12 categories)
→ V The Trousseau (12 real catalogue pieces, head to toe — click any piece)
→ VI To Your Door (free pan-India shipping) → VII Six Promises → The Ascent → The Ring ("Say Yes").

- Hover a framed piece → glow + tooltip; click → lightbox with price and a **link to the live
  product page** on sirinijewellery.com (← → to browse, Esc / × / backdrop to close)
- `Shop` button (top right) → sirinijewellery.com/shop · `Sound` toggle → procedural ambience
- Deep links: `#gallery`, `#ring`, etc.
- `prefers-reduced-motion` respected; no WebGL → automatic editorial fallback page
- Debug helpers in the console: `__SIRINI.seek(0..1)`, `__SIRINI.zones`, `__SIRINI.probe(x,y)`

## Editing content
All copy lives in `src/template.html` (DOM overlay) and the constant tables at the top of
`src/main.js` (trousseau pieces + prices + product links, categories, promises, stats — used for
both the 3D engravings and the fallback page). Images: `assets/web/*.jpg` — real product /
campaign photos fetched from the site's Cloudinary by `fetch-assets.mjs` (do not replace with
generated imagery). After any edit:

```
node build.mjs         →  regenerates dist/Sirini_World.html
```

To refresh imagery from the live catalogue (picks are listed in `fetch-assets.mjs`):
```
node fetch-assets.mjs && node build.mjs
```

## Deploying later
The file is static — drop `dist/Sirini_World.html` on any static host, or into the Next.js
`public/` folder (e.g. served at `/world`). Nothing else to configure.

## Project layout
```
PLAN.md               creative + technical implementation plan (the design document)
assets/web            18 photographs + logo from the site's Cloudinary
vendor/               pinned three.js r147 UMD + EB Garamond/DM Sans woff2 subsets
src/                  template.html · style.css · main.js (the whole experience)
fetch-assets.mjs      Cloudinary image fetcher (rerunnable)
fetch-fonts.mjs       font vendoring
build.mjs             single-file inliner
server.mjs            zero-dependency preview server (:4174)
dist/Sirini_World.html  ★ the deliverable
```
