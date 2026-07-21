# 04 — Site Map & Sections

Every page, every homepage section, and every shared component — what it is and
what it's for.

---

## 1. Global chrome (on every storefront page)

Rendered by `app/layout.tsx`, in this order:

| Element | Component | Notes |
|---|---|---|
| First-load splash | inline in layout + `BrandedLoader` | Server-rendered breathing logo + gold line. Invisible for the first 800ms so fast loads never see it. Dismissed on `DOMContentLoaded` by an inline script that **only toggles a class on `<html>`** — never touches React-managed DOM. Hidden entirely for reduced-motion users. |
| Top progress bar | `nextjs-toploader` | Rose-gold 3px bar on route change |
| Scroll reveal engine | `ScrollReveal` | rAF loop that adds `.active` to `.reveal` elements and drives parallax |
| Reading progress | `ScrollProgressBar` | Thin gold line at the very top |
| Ambient warmth | `.scroll-warmth` div | Gold edge-vignette that deepens as you scroll |
| Announcement ribbon | inside `NavbarWrapper` | Rotating owner-editable messages + EN⇄हिंदी toggle |
| Navigation | `Navbar` / `NavbarWrapper` / `NavbarGate` | Logo, mega-menu, occasion & collection menus, search, wishlist, account, cart badge |
| Page content | `<main>` | |
| Footer | `Footer` / `FooterWrapper` | Links, business details, and an inline contact form (`FooterContactSection`) |
| WhatsApp button | `WhatsAppWrapper` / `WhatsAppButton` | Floating, number from business settings |
| Cart drawer | `CartDrawer` | Slide-over cart with item cascade animation |
| Abandoned-cart nudge | `AbandonedCartNudge` | Renders nothing; fires a toast after ~20s idle with items in cart, once per session |
| Lead popup | `LeadCapturePopup` | Once per browser, ever. 8s delay on first visit. `localStorage` flag set on both subscribe and dismiss |
| Mobile bottom nav | `MobileBottomNav` | Home / Shop / Search / Wishlist / Account. Hidden on admin, auth and checkout routes |
| Toasts | `Toaster` (Sonner) | |
| Structured data | `WebSiteJsonLd`, `LocalBusinessJsonLd` | Plus `OrganizationJsonLd` on the homepage — all linked into one entity graph |
| Analytics | GA4, GTM, Vercel Analytics | GTM only mounts when `NEXT_PUBLIC_GTM_ID` is set |

---

## 2. Homepage (`app/page.tsx`)

The homepage is a **registry + zone system**, not a fixed sequence.

**Always rendered, always first (the opening cream zone):**
1. `PromoBanner` — only when the owner enables it
2. `HeroSection` → `HeroCarousel` — multi-slide crossfade, per-device focal
   points, brightness/contrast/overlay, curtain reveal, word-rise headline,
   Ken Burns drift, glint sweep, sparkle motes, cursor spotlight, magnetic CTA
3. `TrustStrip` — owner-editable trust badges

**Then, in owner-defined order, each section only if enabled:**

| Key | Component | What it shows |
|---|---|---|
| `categories` | `CategoryGrid` | "Shop by Category" — top-level terms of the `category` taxonomy group |
| `shopByOccasion` | `ShopByOccasion` | Occasion tiles (Bridal, Festive, Party, Daily) |
| `shopByCollection` | `ShopByCollection` | Collection tiles from the `collection` group |
| `featuredProducts` | `FeaturedProducts` | Products flagged `isFeatured` |
| `bestsellers` | `BestsellersRail` | Auto-scrolling rail with manual arrows |
| `pullQuote` | `PullQuote` | Editorial customer quote — an intentional reading break |
| `testimonials` | `TestimonialsSection` | Real published reviews (curated order optional), 15-item fallback |
| `brandStory` | `BrandStory` | Heading + body + CTA + artisan image, all editable |
| `instagram` | `InstagramStrip` | Handle, follower count, profile link |
| `newsletter` | `NewsletterSignup` | Email capture |
| `worldPortal` | `WorldPortal` | Dark-velvet break inviting into the 3D world at `/world` |
| `askAI` | `AskAISection` | ChatGPT / Claude / Gemini buttons with a preloaded brand prompt |

### The zone system

Each section key maps to one of two background colours — cream `#FFF8F5` or
warm blush `#FAF0EC`. Consecutive same-background sections merge into one zone;
a 48px gradient bridge is inserted **only** where the background changes. The
default order reproduces the original hand-tuned cream → blush → cream → blush
rhythm exactly, and any reorder still produces a coherent alternating look.
This is pure derivation during render — no mutation.

---

## 3. Shop

### `/shop` — listing

Filterable, sortable, paginated. Query parameters:

`page` · `category` · `material` · `priceMin` · `priceMax` · `sort` · `search` ·
`occasion` · `style` · `collection` · `look` · `stone` · `colour` ·
`minRating` · `inStock`

- **Sidebar filters** (`ProductFilters`) built from the live taxonomy tree, so a
  new admin-created dimension appears automatically.
- **Sort** (`SortSelect`): newest, price ↑, price ↓, name A–Z. The default is an
  owner setting.
- A main category slug **expands to include its sub-categories**.
- `SubcategoryGrid` shows child categories when browsing a hierarchical main.
- **SEO discipline:** a page is canonical-worthy only when it carries at most
  one primary facet and no secondary refinements or pagination. Multi-facet and
  paged combinations are not canonicalised.
- Skeleton loading state matches the real grid exactly (shared class constant).

### `/shop/[slug]` — product detail

- `ImageGallery` — thumbnails, lightbox zoom
- Price + compare-at strike-through (`PriceDisplay`)
- Badge pill, material, category breadcrumb
- Stock state, low-stock urgency line (threshold is an owner setting)
- `AddToCartButton`, `WishlistButton`
- `PincodeEstimator` — enter a pincode, get an estimated delivery date
- Full description
- `ProductReviews` — ratings, review bodies, review images
- `CompleteTheSet` — "Complete the Look" bundle suggestion with a display-only
  10% bundle figure
- `RelatedProducts`
- `RecentlyViewedStrip` — from a client-side Zustand store
- JSON-LD: `ProductJsonLd` + `BreadcrumbJsonLd`

---

## 4. Other public pages

| Route | Contents |
|---|---|
| `/about` | Hero infographic poster (shown whole, never cropped), founder story, artisan image + "Materials & Intention" with a three-point list, values strip, closing CTA. All copy owner-editable. |
| `/faq` | Accordion of owner-editable Q&As, with `FAQJsonLd`. Last entry credits the site's builder. |
| `/contact` | Contact form (persisted to DB **first**, email best-effort), business details, map/address, WhatsApp. |
| `/shipping` | Shipping policy, return policy, refunds. Delivery/return/refund day counts are interpolated from one shared setting. |
| `/privacy`, `/terms` | Legal copy, owner-editable, with a "last updated" field. |
| `/blog`, `/blog/[slug]` | The Journal. Structured body (heading + paragraphs), cover image, read time, related links, RSS at `/blog/rss.xml`. |
| `/occasions` | Occasion landing page. |
| `/cart` | Full cart page (the drawer is the quick path). |
| `/checkout` | Address, contact, gift-wrap option, coupon field, payment method choice. |
| `/order-confirmation` | Post-purchase confirmation. |
| `/account` | Tabs: orders, addresses, profile. Order cancellation. |
| `/wishlist` | Saved items. |
| `/login`, `/register` | Email/username + password. |
| `/world` | Immersive self-contained 3D brand experience (rewrite to `public/world.html`). |

---

## 5. Machine-readable routes

| Route | Purpose |
|---|---|
| `/image-sitemap.xml` | Image sitemap for Google Images — all entities XML-escaped through one shared `esc()` helper |
| `/product-feed.xml` | Google Merchant Center product feed |
| `/llms.txt` | Plain-text brand + catalogue summary for AI crawlers (AEO/GEO) |
| `/blog/rss.xml` | Journal RSS |

---

## 6. Component index

### Navigation & chrome
`Navbar` · `NavbarWrapper` · `NavbarGate` · `MegaMenu` · `CollectionMenu` ·
`OccasionMenu` · `MobileBottomNav` · `Footer` · `FooterWrapper` ·
`FooterContactSection` · `LanguageToggle` (EN⇄हिंदी via the `googtrans` cookie,
which translates UI *and* all 160+ DB-driven product names in one shot)

### Homepage sections
`HeroSection` · `HeroCarousel` · `HeroSparkles` · `TrustStrip` · `TrustSignals` ·
`PromoBanner` · `CategoryGrid` · `SubcategoryGrid` · `ShopByOccasion` ·
`ShopByCollection` · `ShopByMaterial` · `ShopByPrice` · `FeaturedProducts` ·
`BestsellersRail` · `MovingProductRail` · `PullQuote` · `BrandStory` ·
`TestimonialsSection` · `InstagramStrip` · `NewsletterSignup` · `WorldPortal` ·
`AskAISection`

### Product
`ProductGrid` (exports `PRODUCT_GRID_CLASSES`) · `ProductCard` ·
`ProductFilters` · `SortSelect` · `ImageGallery` · `PriceDisplay` ·
`AddToCartButton` · `WishlistButton` · `WishlistItemCard` · `QuickViewModal` ·
`ProductReviews` · `RelatedProducts` · `CompleteTheSet` · `RecentlyViewedStrip` ·
`PincodeEstimator`

### Commerce
`CartDrawer` · `CartItem` · `CartBadge` · `CheckoutForm` · `CouponField` ·
`AddressManager` · `CityCombobox` · `CancelOrderButton` · `AccountTabs` ·
`AbandonedCartNudge` · `LeadCapturePopup` · `ContactForm`

### Structured data
`OrganizationJsonLd` · `LocalBusinessJsonLd` · `WebSiteJsonLd` ·
`ProductJsonLd` · `BreadcrumbJsonLd` · `FAQJsonLd`

### Motion & effects
`ScrollReveal` · `ScrollProgressBar` · `Magnetic` · `BrandedLoader`

### Infrastructure
`AuthProvider` · `WhatsAppButton` / `WhatsAppWrapper` · `ShippingLocationBar`
(built, currently unused — it calls `navigator.geolocation`, which is why the
`Permissions-Policy` header allows `geolocation=(self)` rather than blocking it)

---

*Next: [05 — Design System](05-design-system.md)*
