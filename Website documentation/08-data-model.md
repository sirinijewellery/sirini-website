# 08 — Data Model

PostgreSQL via Prisma 7. Source of truth: `prisma/schema.prisma` (16 models).

---

## Entity map

```
User ──┬── Address
       ├── Order ── OrderItem ── Product
       ├── WishlistItem ── Product
       └── Review ── Product

Product ── ProductTerm ── TaxonomyTerm ── TaxonomyGroup
                              └── TaxonomyTerm (children, category group only)

Standalone: Category · Coupon · Setting · HeroSlide · BlogPost ·
            NewsletterSubscriber · Lead · ContactMessage · OrphanedPayment
```

---

## Catalogue

### `Product`

| Field | Type | Notes |
|---|---|---|
| `id` | cuid | |
| `name`, `slug` | String | `slug` unique |
| `description` | String | 100–150 words, unique per product (SEO) |
| `price` | Float | |
| `compareAtPrice` | Int? | Struck-through "original" price |
| `category` | String | **Primary** category slug, kept for display/back-compat |
| `categories` | String[] | **All** category slugs — this is what filtering uses |
| `occasions`, `tags`, `styles` | String[] | Additional dimensions |
| `material` | String | |
| `sku` | String | Unique. Drives the admin's category auto-detect |
| `images` | Json | Array of Cloudinary URLs; **index 0 is the cover** |
| `badge` | String? | Matches a label in the owner's badge list |
| `isFeatured` | Boolean | Homepage Featured section |
| `stock` | Int (default 10) | `0` = out of stock |
| `displayOrder` | Int? | Owner-controlled shop front-page pin. `1` = first. Pinned always precede unpinned. Null = unpinned |
| `metaTitle`, `metaDescription` | String? | Optional SEO overrides |
| `createdAt` | DateTime | |

Indexes: `category`, `material`, `isFeatured`.
Relations: `orderItems`, `wishlistItems`, `reviews`, `terms`.

> **Why both `category` and `categories`:** the site started single-category.
> `category` stayed as the display/primary value so nothing broke; `categories`
> was added so a Kundan choker can appear under both "Necklace Sets" and
> "Bridal" without duplicating the record.

### `Category`

The simple homepage-card list, separate from the taxonomy system.

`id` · `name` · `slug` (unique) · `image?` · `sortOrder` · `showOnHome`

Deleting one removes the card; products keep their category tag.

---

## Taxonomy (the multi-dimension system)

### `TaxonomyGroup`
A "Shop by ___" dimension.

| Field | Notes |
|---|---|
| `slug` (unique), `label` | e.g. `category` / "Category" |
| `hierarchical` | Only the Category group is `true` (main → sub) |
| `sortOrder`, `showInMenu` | |
| `isSystem` | Marks the six seeded groups: category, occasion, collection, look, stone, colour |
| `terms` | |

### `TaxonomyTerm`
An option within a group.

| Field | Notes |
|---|---|
| `groupId` → `TaxonomyGroup` | `onDelete: Cascade` |
| `parentId` → self (`TermChildren`) | `onDelete: SetNull` — used only in hierarchical groups |
| `slug`, `label` | **`@@unique([groupId, slug])`** — the same slug can exist in different dimensions |
| `blurb` | Facet-page copy |
| `coverImage`, `coverFocal` | Card image + CSS object-position |
| `hexColor` | For colour terms |
| `sortOrder`, `showInMenu` | |

Indexes: `groupId`, `parentId`.

### `ProductTerm`
Explicit many-to-many join. Composite primary key `[productId, termId]`, both
sides cascade on delete, `termId` indexed for reverse lookups.

> **Why a join table and not just string arrays:** terms need their own
> metadata (image, blurb, colour, ordering) and must be renameable without
> rewriting every product row.

---

## Commerce

### `Order`

| Field | Notes |
|---|---|
| `orderNumber` | `Int @unique @default(autoincrement())` — the human-readable number |
| `userId?` | Nullable → **guest checkout is supported** |
| `customerName`, `customerEmail`, `customerPhone` | |
| `shippingAddress` | Json snapshot — an address edit later must not rewrite history |
| `notes?` | |
| `totalAmount`, `discountAmount`, `couponCode?` | |
| `paymentStatus` | default `pending` |
| `paymentMethod` | default `online` (or `cod`) |
| `paymentId?` | **`@unique`** — the DB-level idempotency guard, so the verify route and the webhook can never both create an order for the same payment |
| `orderStatus` | default `processing` → shipped / delivered / cancelled |

Indexes: `userId`, `orderStatus`, `customerEmail`.

> `customerEmail` is stored **lowercase at every write site**, so the lead
> export's "has this person purchased?" lookup can use a plain index-using `in`
> match instead of a case-insensitive scan.

### `OrderItem`
`orderId` · `productId?` (`SetNull` — deleting a product must not delete order
history) · `variantId?` · `quantity` · `priceAtPurchase` (frozen, never read
live from the product).

### `Coupon`

`code` (unique, uppercased) · `discountType` (`percentage` | `flat`) ·
`discountValue` · `minOrderAmount?` · `maxUses?` · `usedCount` · `expiresAt?` ·
`isActive` · `issuedToEmail?` **unique** · `createdAt`

> `issuedToEmail` is set only for machine-minted lead coupons. Unique means a
> second mint for the same email is idempotent — it returns the existing code
> instead of creating a duplicate. Nullable, and Postgres allows many NULLs, so
> admin-created coupons are unaffected.

---

## Users

### `User`
`email` (unique) · `username?` (unique, lowercase, matched case-insensitively —
admins sign in with it) · `name?` · `phone?` · `passwordHash` · `isAdmin` ·
`createdAt`. Relations: addresses, wishlistItems, orders, reviews.

### `Address`
`userId` (cascade) · `label?` · `line1` · `city` · `state` · `pincode` ·
`isDefault`. Indexed on `userId`.

### `WishlistItem`
`userId` + `productId`, both cascade, `@@unique([userId, productId])`.

### `Review`
`productId` (cascade) · `userId?` (`SetNull`) · `authorName` · `rating` (1–5) ·
`body?` · `images` Json · `isVerified` · `isPublished` · `createdAt`.
Indexed on `productId` and `userId`.

Published reviews with a non-empty body feed the homepage testimonial carousel.

---

## Content & configuration

### `Setting` — the generic key/value store

```prisma
model Setting {
  key   String @id
  value Json
}
```

**This one table backs the entire admin customisation system.** Adding a new
setting requires no migration. Keys in use:

| Namespace | Keys |
|---|---|
| Hero / ribbon | `hero.durationMs`, `ribbon.messages` |
| Business | `business.details` |
| Home | `home.promo`, `home.trustBadges`, `home.sections`, `home.brandStory`, `home.pullQuote`, `home.featuredReviewIds` |
| Commerce | `commerce.gstRate`, `commerce.giftWrapFee`, `commerce.shippingFee`, `commerce.freeShipThreshold`, `commerce.codEnabled`, `commerce.codMaxOrder` |
| Catalog | `catalog.badges`, `catalog.lowStockThreshold`, `catalog.hideOutOfStock`, `catalog.defaultSort` |
| Content | `content.about`, `content.shipping`, `content.privacy`, `content.terms`, `content.faq`, `content.shippingTime` |
| Theme | `theme.colors`, `theme.font` |
| Navbar | `navbar.config` |

Every read merges the stored value over a `DEFAULT_*` constant and falls back to
that default on any error or invalid shape.

### `HeroSlide`
`imageUrl` · `mobileImageUrl?` · `focalDesktop` / `focalMobile` (CSS
`object-position` strings, default `"50% 50%"`) · `brightness` · `contrast` ·
`overlayOpacity` · `order` · `isActive` · `createdAt`.
Indexed on `[isActive, order]`.

> The two focal fields are how the owner "crops" one photo differently for
> phone and desktop without ever editing the image file.

### `BlogPost`
`slug` (unique) · `title` · `excerpt` · `coverImage` · `body` Json (array of
`{ heading?, paragraphs[] }`) · `relatedLinks` Json (array of `{label, href}`) ·
`readMins` · `isPublished` · `metaTitle?` · `metaDescription?` · `publishedAt` ·
`createdAt` · `updatedAt`. Indexed on `[isPublished, publishedAt]`.

---

## Growth & operations

### `Lead`
`email` (unique) · `source` (default `popup`) · `createdAt`.

### `NewsletterSubscriber`
`email` (unique) · `createdAt`.

### `ContactMessage`
`name` · `email` · `message` · `isRead` · `createdAt`.
Indexed on `[isRead, createdAt]`.

> Always persisted — this table is the source of truth, read at
> `/admin/messages`. The notification email is best-effort on top, so no message
> is lost while email is unconfigured or down.

### `OrphanedPayment`
`paymentId` **unique** · `razorpayOrderId?` · `amountPaise?` · `reason` ·
`customerEmail?` · `customerPhone?` · `resolved` · `createdAt`.
Indexed on `[resolved, createdAt]`.

> A Razorpay payment that was **captured** but for which no Order could be
> created — the customer's confirmation request dropped, or the last unit sold
> out mid-payment. Written by both the verify route and the webhook (unique
> `paymentId` keeps both idempotent), and the owner is emailed to refund or
> fulfil from the Razorpay dashboard. **Real money is never silently lost.**

---

## Design principles in this schema

1. **Order history is immutable.** Addresses are Json snapshots; prices are
   frozen in `priceAtPurchase`; `productId` uses `SetNull`, never `Cascade`.
2. **Idempotency at the database level, not just in code.** Unique `paymentId`
   and unique `issuedToEmail` make double-writes impossible even under a race.
3. **One generic settings table** so configurability never needs a migration.
4. **Cascade deliberately.** Cascade where the child is meaningless without the
   parent (taxonomy terms, wishlist items, addresses); `SetNull` where history
   must survive (order items, review authors).
5. **Index what you actually query** — including `customerEmail`, which exists
   purely to make the lead-export purchase lookup cheap.

---

*Next: [09 — API Reference](09-api-reference.md)*
