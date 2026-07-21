# 05 — Design System

Colours, typography, spacing, shape, and the complete motion library. All tokens
live in `app/globals.css` inside a Tailwind v4 `@theme inline` block, which is
what makes owner theme overrides a single injected `:root` rule.

The design language is **"Stitch Heritage Opulence"** — a warm cream page, deep
maroon brand colour, muted gold accents, serif display type, generous spacing,
and slow, editorial motion. Nothing bounces or shouts.

---

## 1. Colour palette

### Brand / primary

| Token | Hex | Use |
|---|---|---|
| `--color-primary` | `#8a4853` | **The brand maroon.** Buttons, links, accents |
| `--color-on-primary` | `#ffffff` | Text on primary |
| `--color-primary-container` | `#a6606b` | Lighter maroon — hovers, fills |
| `--color-on-primary-container` | `#fffbff` | |
| `--color-on-primary-fixed-variant` | `#70343e` | Darkest maroon — button hover |
| `--color-primary-fixed` | `#ffd9dd` | Pale blush |
| `--color-primary-fixed-dim` | `#ffb2bc` | Blush |
| `--color-inverse-primary` | `#ffb2bc` | |
| `--color-surface-tint` | `#8c4b55` | |

### Secondary & tertiary

| Token | Hex | Use |
|---|---|---|
| `--color-secondary` | `#396752` | Deep green |
| `--color-secondary-container` | `#bbeed3` | Mint |
| `--color-on-secondary-container` | `#3f6d58` | |
| `--color-success-emerald` | `#043927` | Success states |
| `--color-tertiary` | `#735c00` | Deep gold |
| `--color-tertiary-container` | `#cba72f` | **The gold accent** — rules, dividers, highlights |
| `--color-tertiary-fixed` | `#ffe088` | Light gold |
| `--color-tertiary-fixed-dim` | `#e9c349` | |

### Surfaces & text

| Token | Hex | Use |
|---|---|---|
| `--color-background` / `--color-surface` | `#fff8f5` | **The cream page background** |
| `--color-on-background` / `--color-on-surface` | `#221a15` | **Body text** (warm near-black) |
| `--color-on-surface-variant` | `#524345` | Secondary text |
| `--color-surface-container-lowest` | `#ffffff` | Cards |
| `--color-surface-container-low` | `#fff1ea` | |
| `--color-surface-container` | `#fbebe3` | Warm blush zone |
| `--color-surface-container-high` | `#f5e5dd` | |
| `--color-surface-container-highest` / `--color-surface-variant` | `#efdfd8` | |
| `--color-surface-dim` | `#e6d7cf` | |
| `--color-inverse-surface` | `#382f29` | |
| `--color-inverse-on-surface` | `#feeee6` | |
| `--color-outline` | `#857374` | Strong borders |
| `--color-outline-variant` | `#d7c1c3` | **Default borders / inputs** |
| `--color-destructive` | `#ba1a1a` | Errors, delete |

### Homepage zone colours (hardcoded in `app/page.tsx`)

| Name | Hex |
|---|---|
| `CREAM` | `#FFF8F5` |
| `BLUSH` | `#FAF0EC` |

### Ad-hoc accents used in components

| Hex | Where |
|---|---|
| `#C9A96E` | Nav accent underline default, branded loader gold line |
| `#B76E79` | Top progress bar (rose gold) |
| `#5C1A24` | `theme-color` meta (browser UI tint), email headings |
| `#140a0d` | World portal velvet background |
| `#d9b263` | World portal gold |

### Admin sidebar (deliberately dark, to feel like a different surface)

`--color-sidebar` `#1e293b` · `--color-sidebar-foreground` `#f8fafc` ·
`--color-sidebar-accent` `#334155` · `--color-sidebar-primary` `#8a4853`

### Legacy aliases (kept so older components keep working)

`--color-rose-gold` `#8a4853` · `--color-rose-gold-light` `#a6606b` ·
`--color-rose-gold-dark` `#70343e` · `--color-blush` `#ffd9dd` ·
`--color-blush-dark` `#ffb2bc` · `--color-cream` `#fff8f5` ·
`--color-cream-dark` `#fbebe3` · `--color-charcoal-text` `#221a15` ·
`--color-muted-gray` `#524345`

> These are why the theme editor writes *several* variables per field —
> changing "primary" must also update `--color-rose-gold` or the site would
> half-change.

### Dark mode

A `.dark` class block exists with oklch values (background `oklch(0.14 0.01 30)`,
primary `oklch(0.68 0.09 10)`, etc.). The storefront ships light-only; the
tokens are there for future use.

---

## 2. The five owner-editable colours

Only these are exposed in `/admin/settings/theme`. Everything else stays in
`globals.css`.

| Field | Label | Default | Variables written |
|---|---|---|---|
| `primary` | Primary (brand maroon) | `#8a4853` | `--color-primary`, `--color-rose-gold`, `--color-surface-tint`, `--color-ring`, `--color-sidebar-primary`, `--color-sidebar-ring` |
| `primaryContainer` | Primary (light variant) | `#a6606b` | `--color-primary-container`, `--color-rose-gold-light` |
| `gold` | Gold accent | `#cba72f` | `--color-tertiary-container` |
| `background` | Page background (cream) | `#fff8f5` | `--color-background`, `--color-surface`, `--color-surface-bright`, `--color-cream` |
| `foreground` | Text colour | `#221a15` | `--color-foreground`, `--color-on-background`, `--color-on-surface`, `--color-charcoal-text`, `--color-card-foreground`, `--color-popover-foreground`, `--color-accent-foreground` |

Validation: hex (3/6/8 digit), `rgb()`/`rgba()`, or `hsl()`/`hsla()` only —
anything else is rejected before it can reach the injected `<style>`. A value
equal to the default is dropped, so an untouched theme emits nothing at all.

---

## 3. Typography

### Font families

- **Display / headings:** EB Garamond (serif) → `--font-display`
- **Body / UI:** DM Sans (sans) → `--font-sans`

Every font token in the system bottoms out at `--font-eb-garamond` /
`--font-dm-sans`, which is why remapping those two swaps fonts site-wide.

### The five owner-selectable pairings

| Key | Display + Body |
|---|---|
| `garamond-dmsans` | **EB Garamond + DM Sans** (default) |
| `playfair-inter` | Playfair Display + Inter |
| `cormorant-jost` | Cormorant Garamond + Jost |
| `fraunces-nunito` | Fraunces + Nunito Sans |
| `marcellus-poppins` | Marcellus + Poppins |

All ten families are declared at build time in `app/layout.tsx` (a `next/font`
requirement), but the eight belonging to non-default pairings carry
`preload: false` — otherwise every visitor downloads 15 font files for fonts
that aren't rendering. All use `display: "swap"`.

### Type scale

| Token | Size | Line height | Tracking |
|---|---|---|---|
| `display-lg` | 48px (→56px on md) | 1.1 | −0.02em |
| `headline-lg` | 32px | 1.2 | — |
| `headline-lg-mobile` | 28px | 1.2 | — |
| `headline-md` | 24px | 1.3 | — |
| `body-lg` | 18px | 1.6 | — |
| `body-md` | 16px | 1.5 | — |
| `label-caps` | 12px | 1 | 0.1em |
| `price-display` | 18px | 1 | — |

`.label-caps` helper: `font-weight: 600`, `letter-spacing: 0.1em`,
`text-transform: uppercase`. Used for eyebrows, tags, and buttons — it's the
single most brand-defining typographic move on the site.

---

## 4. Spacing & shape

| Token | Value |
|---|---|
| `--spacing-gutter` | 24px |
| `--spacing-section-gap` | 120px |
| `--spacing-margin-mobile` | 16px |
| `--spacing-margin-desktop` | 64px |
| `--radius-DEFAULT` | 0.125rem (2px) |
| `--radius-lg` | 0.25rem (4px) |
| `--radius-xl` | 0.5rem (8px) |

Corners are almost square. Rounded corners read as "app"; sharp corners read as
"boutique". Container width is `max-w-screen-2xl` with `px-6 md:px-16`.

---

## 5. Motion library

Every class below lives in `app/globals.css`.

### Scroll reveal
| Class | Effect |
|---|---|
| `.reveal` | Fade + 30px rise, 800ms `cubic-bezier(0.16,1,0.3,1)`. Gets `.active` from `ScrollReveal` |
| `.reveal-left` / `.reveal-right` | Enters from ±44px horizontally |
| `.reveal-zoom` | Scales from 0.94 |
| `.reveal-clip` | Clip-path wipe |
| `.reveal-tilt` | Settles from a slight rotation |
| `.stagger-grid` | Children reveal 60ms apart (capped at 480ms from the 9th) |
| `.stagger-tilt` | Stagger + rotation |
| `.parallax-*` | Driven by ScrollReveal's rAF loop |

### Hero choreography
`.hero-curtain` (unveils centre-outward) · `.word-rise` (headline word by word) ·
`.hero-stagger` (children at 80/220/360/500ms) · `.hero-unveil` (right-to-left
wipe) · `.animate-ken-burns` (ultra-slow drift) · `.hero-breathe` (gentle scale
loop) · `.hero-glint` (diagonal light band sweep) · `.hero-spotlight` (warm glow
following the cursor) · `.hero-sparkles` (gold dust motes drifting up)

### Product & card
`.card-lift` / `.card-lift-group` (rise + layered warm shadow) · `.card-tilt`
(3D lean toward cursor) · `.img-zoom` (slow editorial zoom) · `.crossfade-top`
(second product image on hover) · `.vignette-overlay` (warm darkening at edges)

### Micro-interactions
`.animate-heart-pop` (wishlist) · `.animate-badge-pop` (cart count) ·
`.press-scale` (tactile click) · `.link-sweep` (gold underline enters left,
exits right) · `.btn-sheen` (light band crosses the button) ·
`.animate-shimmer-btn` (continuous maroon shimmer) · `.hamburger` (animated → X)

### Structural
`.page-enter` (fade-up on every route change) · `.drawer-cascade` (drawer
children slide in 40/100/160/220ms) · `.animate-fade-in-scale` (overlays,
modals, quick-view) · `.marquee-track` (continuous product ribbon) ·
`.scroll-progress` (gold reading bar) · `.scroll-warmth` (gold edge-vignette
deepening on scroll)

### Loading
`.skeleton-shimmer` (warm cream sweep, brand-matched — not the usual grey) ·
`.loader-fade-in` (route loader, 400ms fade after a 300ms anti-flash delay) ·
`.splash-fade-in` (first-load splash, same fade after an **800ms** delay) ·
`.loader-breathe` (logo scale/opacity loop, 2.8s) · `.loader-line` (gold line
sweep, 2.4s)

### Decorative
`.section-gold-rule` (40px gold line above section headings, draws itself in
when the section reveals) · `.gradient-title-bg` (gradient underline on hover) ·
`.noise-texture` (subtle grain so flat cream sections feel editorial) ·
`.nav-accent-link` (nav underline using the owner's accent colour)

---

## 6. The reduced-motion guard

One `@media (prefers-reduced-motion: reduce)` block at the end of
`app/globals.css` covers **every** custom animation. Any new animation must be
added to it. It:

- Forces `.reveal`, staggers, `.page-enter`, `.hero-curtain`, `.word-rise` and
  `.drawer-cascade` to `opacity: 1; transform: none; transition: none;
  animation: none` and clears their clip-paths.
- Removes transitions from hover effects (`.img-zoom`, `.card-lift`,
  `.card-tilt`, `.press-scale`, `.link-sweep::after`, `.btn-sheen::before`,
  `.crossfade-top`, `.hamburger`).
- `display: none`s the purely ambient effects — `.scroll-warmth`,
  `.hero-spotlight`, `.hero-sparkles`.
- Disables all `animation:` loops (pops, shimmer, Ken Burns, skeleton, loader).
- **Forces `.loader-fade-in` back to `visibility: visible`** — it hides via
  visibility until its animation reveals it, so with the animation disabled it
  would otherwise never appear.
- **`display: none`s `#sirini-splash` entirely** — with its reveal animation
  disabled the splash would either never show or flash statically on every
  visit. Reduced-motion users skip it.

### The accessibility rule behind the loaders

`opacity: 0` does **not** remove content from the accessibility tree and does
not stop a live region being announced. Loading states therefore pair
`opacity: 0` with `visibility: hidden`, so screen-reader users don't hear
"Loading…" on a navigation that resolved instantly.

---

## 7. Third-party chrome suppression

Google Translate injects its own banner and tooltips. Since translation is
driven from the site's own ribbon toggle, `globals.css` hides
`.goog-te-banner-frame`, `.goog-te-gadget-icon`, `.goog-te-balloon-frame`, the
`.skiptranslate` iframe, and the yellow `.goog-text-highlight`.

---

*Next: [06 — Admin Panel](06-admin-panel.md)*
