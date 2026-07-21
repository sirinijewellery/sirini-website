# 07 — Feature Catalogue

Exhaustive list of what the site does. Use this as a checklist when scoping a
comparable build.

---

## A. Browsing & discovery

- [x] Homepage with owner-orderable sections and alternating colour zones
- [x] Multi-slide hero slideshow with per-device focal points and image adjustments
- [x] Rotating announcement ribbon
- [x] Mega-menu driven by the live taxonomy (categories + sub-categories)
- [x] Separate "Shop by Occasion" and "Shop by Collection" dropdowns
- [x] Shop listing with sidebar filters, sort and pagination
- [x] Filter dimensions: category, sub-category, material, occasion, style,
      collection, look, stone, colour, price range, minimum rating, in-stock only
- [x] Price-bucket shortcuts (Under ₹999 / ₹1,000–2,499 / ₹2,500–4,999 / ₹5,000+)
- [x] Sort: newest, price low→high, price high→low, name A–Z (default is a setting)
- [x] Full-text search with **synonym mapping** — "jhumka" finds earrings,
      "payal" finds anklets, "kada" finds bangles, with word-boundary patterns so
      "earring" doesn't match "ring"
- [x] Sub-category grid when browsing a main category
- [x] Quick-view modal from product cards
- [x] Recently-viewed strip (client-side, persisted)
- [x] Related products
- [x] "Complete the Look" bundle suggestion
- [x] Auto-scrolling bestsellers rail with manual arrows, hover-pause and
      auto-resume
- [x] EN ⇄ हिंदी toggle — drives Google Translate via the `googtrans` cookie, so
      it translates the UI *and* all 160+ DB-driven product names/descriptions
      with no per-product translation data

## B. Product detail

- [x] Image gallery with thumbnails and lightbox zoom
- [x] Price with struck-through compare-at price
- [x] Badge pill (owner-defined labels and colours)
- [x] Stock state and "only N left" urgency (threshold is a setting)
- [x] Pincode-based delivery-date estimator
- [x] Add to cart, add to wishlist
- [x] Customer reviews with ratings, bodies and images; verified-purchase flag
- [x] Aggregate rating in structured data
- [x] Breadcrumb navigation
- [x] Per-product SEO overrides (meta title / description) with auto-generated
      fallbacks

## C. Cart & checkout

- [x] Slide-over cart drawer + full cart page
- [x] Persistent cart (Zustand + localStorage) — survives refresh
- [x] Cart badge with pop animation on change
- [x] Quantity controls with stock guards
- [x] Coupon field with live validation
- [x] Gift-wrap option
- [x] Saved addresses with a default-address flag
- [x] City autocomplete/correction combobox
- [x] Pincode validation
- [x] **Online payment** via Razorpay hosted Checkout
- [x] **Cash on Delivery**, with an enable toggle and a max-order cap
- [x] GST, shipping fee and free-shipping threshold, all configurable
- [x] Server-side total recomputation with exact-paise verification
- [x] Razorpay HMAC signature verification (timing-safe)
- [x] Payment amount re-fetched from Razorpay and confirmed against the total
- [x] Webhook as an independent second order-creation path
- [x] Idempotency enforced at the database level (unique `paymentId`)
- [x] Orphaned-payment capture — a captured payment that can't become an order
      is recorded and the owner is emailed
- [x] Payment-link fallback route
- [x] Order confirmation page
- [x] Sequential human-readable order numbers

## D. Accounts

- [x] Register / login with email **or** username, case-insensitive
- [x] bcrypt password hashing
- [x] Timing-equalised login (no user enumeration)
- [x] Order history
- [x] Order cancellation
- [x] Address book (add / edit / delete / set default)
- [x] Wishlist (DB-backed, per user)
- [x] Guest checkout (orders can exist without a user)

## E. Content

- [x] About / Our Story page with infographic hero
- [x] FAQ with structured data
- [x] Shipping & Returns
- [x] Privacy Policy, Terms
- [x] Contact page with a persisted contact form
- [x] Journal / blog with structured article bodies and RSS
- [x] Immersive 3D brand world at `/world`
- [x] All of the above owner-editable from the admin

## F. SEO / AEO / GEO

- [x] Per-page canonical URLs, forced to the real production domain
- [x] Unique per-product meta descriptions built from name + category + price
- [x] Open Graph + Twitter cards site-wide
- [x] JSON-LD: Organization, WebSite + SearchAction, LocalBusiness, Product,
      Offer, Review, AggregateRating, BreadcrumbList, FAQPage, ItemList —
      **connected into one entity graph**
- [x] XML sitemap + **image sitemap**
- [x] Google Merchant Center product feed
- [x] `llms.txt` for AI crawlers
- [x] Blog RSS feed
- [x] Indexable facet pages for category / occasion / collection / look / stone /
      colour, each with unique copy, added to the sitemap
- [x] Deliberate non-canonicalisation of multi-facet and paginated combinations
- [x] Google Search Console verification token with env override
- [x] `robots` directives with `max-image-preview: large`
- [x] Fact consistency across pages and schema (delivery/return/refund windows)

## G. Growth & marketing

- [x] Lead-capture popup — once per browser ever, 8s delay on first visit
- [x] Attributed, idempotent single-use coupon minting per captured lead
- [x] Newsletter signup
- [x] Abandoned-cart nudge after ~20s idle, once per session
- [x] Real-review testimonials with curation
- [x] Instagram strip
- [x] Floating WhatsApp button
- [x] Ask-AI section with preloaded brand prompts for ChatGPT / Claude / Gemini
- [x] Promo banner
- [x] Trust badge strip
- [x] Key-authed lead-export API with a "has purchased" flag
- [x] Key-authed read-only marketing-metrics API
- [x] Daily revenue digest cron
- [x] GA4 + Google Tag Manager (so pixels can be added with no code) + Vercel
      Analytics

## H. Owner operations

- [x] Full admin panel — see [06](06-admin-panel.md)
- [x] Cloudinary image upload from the admin (drag-drop, 5 MB cap)
- [x] Pending-work checklist with live counts
- [x] Searchable in-app help with deep links
- [x] Multi-admin management
- [x] Messages inbox
- [x] Order status workflow
- [x] On-demand cache revalidation when products change
- [x] ~70 maintenance scripts for bulk catalogue operations

## I. Performance

- [x] ISR on the homepage (10 min) and product pages
- [x] On-demand, scoped revalidation instead of short-interval polling
- [x] Custom Cloudinary image loader (f_auto/q_auto/w_/c_limit)
- [x] Trimmed srcset width ladder to limit billed derived assets
- [x] Compressed bot-facing image URLs
- [x] CDN preconnect + dns-prefetch
- [x] Fonts: `display: swap`, `preload: false` on unused pairings (15 → 3
      preloaded files)
- [x] Branded route loaders and layout-matched skeletons
- [x] First-load splash covering the initial page load
- [x] Lazy thumbnails, `React.cache()` query deduplication

## J. Accessibility

- [x] Global `prefers-reduced-motion` guard covering every animation
- [x] Loading states hide via `visibility`, not just `opacity`
- [x] `role="status"` + `aria-live="polite"` + screen-reader-only text on loaders
- [x] `aria-hidden` on decorative elements (splash, gradients, sparkles)
- [x] Descriptive alt text, including slide position for carousels
- [x] Labelled icon buttons
- [x] Keyboard-navigable menus and dialogs
- [x] Adequate mobile tap targets

## K. Security

See [11 — Security & Performance](11-security-and-performance.md) for detail.

- [x] Route-level admin/auth protection with case-insensitive path matching
- [x] Rate limiting on every public POST endpoint and the pincode proxy
- [x] Timing-safe signature and API-key comparison
- [x] Security headers (nosniff, frame-deny, referrer policy, permissions
      policy, HSTS preload)
- [x] Input validation with Zod
- [x] Sanitised colour/font injection
- [x] Structured (never raw-HTML) owner content
- [x] JSON-LD escaping
- [x] Server-side price and stock authority
- [x] Cron endpoint fails closed without its secret

---

## Deliberately not built

Recorded so nobody re-litigates them:

- **Content Security Policy** — Razorpay's `checkout.js` loads at runtime and
  JSON-LD relies on inline `<script>` tags, so a strict CSP needs careful
  allowlisting and testing first. Tracked as a manual follow-up. Note: the
  splash-dismissal inline script would need a nonce or hash.
- **Redis/Upstash rate limiting** — the in-memory limiter throttles per
  serverless instance, not globally. It meaningfully blunts a single-source
  flood at zero cost; a hard global guarantee would swap the Map for Upstash
  behind the same interface.
- **Geolocation shipping bar** — `ShippingLocationBar` was built and then
  removed from the pages because the browser permission prompt on arrival felt
  hostile.
- **Google AdSense** — considered for the About page, then dropped: ad RPM on a
  niche Indian jewellery site is a rounding error next to the conversion risk of
  showing competitors' jewellery ads to your own shoppers.
- **Scroll counter** — cut by the owner before it was built.

---

*Next: [08 — Data Model](08-data-model.md)*
