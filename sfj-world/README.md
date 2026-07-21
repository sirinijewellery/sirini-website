# SALONI — The Golden Thread
One continuous interactive 3D world for Saloni Fashion Jewellery (SFJ).

## Open it (no server needed)
Double-click **`dist/SFJ_World.html`** — everything (Three.js, fonts, all 13 images, the whole experience)
is inlined into that one ~1.6 MB file. It makes **zero network requests**, so it works identically from
a double-click (`file://`), a local server, or any static host.

## Local preview server (optional)
```
node server.mjs        →  http://localhost:4173
```
(Also registered as the `sfj-world` config in `.claude/launch.json`.)

## The journey
Scroll (wheel, touch, arrows, space, or the chapter dots on the right edge) to travel the thread:

Threshold → Prologue → I The House (About) → II At a Glance → III The Atelier (manufacturing/QC)
→ IV The Catalogue (12 categories) → V The Gallery (12 photographed specialisations — click any piece)
→ VI The Reach (wholesale + export) → VII Six Pillars (strengths) → The Ascent → The Ring (contact).

- Hover a gallery frame → glow + tooltip; click → lightbox (← → to browse, Esc / × / backdrop to close)
- `Sound` toggle (top right) enables a procedural ambient soundscape — off by default, no audio files
- Deep links: `#gallery`, `#ring`, etc.
- `prefers-reduced-motion` respected; no WebGL → automatic editorial fallback page
- Debug helpers in the console: `__SFJ.seek(0..1)`, `__SFJ.zones`, `__SFJ.probe(x,y)`

## Editing content
All copy lives in `src/template.html` (DOM overlay) and the constant tables at the top of
`src/main.js` (gallery captions, categories, pillars, stats — used for both the 3D engravings
and the fallback page). Images: `assets/web/*.jpg` (extracted losslessly from the company
profile PDF — do not replace with generated imagery). After any edit:

```
node build.mjs         →  regenerates dist/SFJ_World.html
```

## Deploying later
The file is static — drop `dist/SFJ_World.html` on any static host (or into a Next.js `public/`
folder, e.g. served at `/world`). Nothing else to configure.

## Project layout
```
PLAN.md               creative + technical implementation plan (the design document)
assets/raw|web        images extracted from SFJ_Company_Profile.pdf
vendor/               pinned three.js r147 UMD + latin woff2 font subsets
src/                  template.html · style.css · main.js (the whole experience)
build.mjs             single-file inliner
server.mjs            zero-dependency preview server (:4173)
extract-images.mjs    PDF → JPEG extractor (rerunnable)
fetch-fonts.mjs       font vendoring
dist/SFJ_World.html   ★ the deliverable
```
