// ─────────────────────────────────────────────────────────────────────────
// Owner-editable site settings — shared types + defaults.
//
// This module is CLIENT-SAFE: it imports nothing server-only (no prisma, no
// zod), so it can be imported from both server components and client admin
// forms. The actual reads live in `lib/queries/site.ts` (server, prisma) and
// the validated writes go through `app/api/admin/settings/route.ts`.
//
// Golden rule: every default below MUST equal the value the site currently
// shows when hardcoded, so shipping a new setting changes nothing visible
// until the owner edits it.
// ─────────────────────────────────────────────────────────────────────────

/* ── Business / contact details (single source of truth) ───────────────── */
// Previously these were duplicated (and drifting) across Footer, ContactPage,
// WhatsAppButton, OrganizationJsonLd, LocalBusinessJsonLd, InstagramStrip.
export interface BusinessDetails {
  /** Public contact email (mailto + order notifications). */
  email: string;
  /** Display + tel phone, e.g. "+91-9322222216". */
  phone: string;
  /** WhatsApp number, digits only (for wa.me links), e.g. "919322222216". */
  whatsapp: string;
  /** Full Instagram profile URL. */
  instagramUrl: string;
  /** Instagram @handle (without the @). */
  instagramHandle: string;
  /** Follower-count label shown under the handle, e.g. "1.9k followers". */
  followerText: string;
  /** Short address line for the footer, e.g. "Mumbai, Maharashtra, India". */
  addressLine: string;
  /** Structured address parts (used in schema.org / contact). */
  city: string;
  region: string;
  postalCode: string;
  /** ISO-3166 alpha-2 country code, e.g. "IN". */
  country: string;
  /** schema.org opening hours, e.g. "Mo-Sa 10:00-19:00". */
  openingHours: string;
  /** Other profile (used in JSON-LD sameAs). */
  justdialUrl: string;
}

export const DEFAULT_BUSINESS: BusinessDetails = {
  email: "sirinijewellery@gmail.com",
  phone: "+91-9322222216",
  whatsapp: "919322222216",
  instagramUrl: "https://www.instagram.com/sirinijewellerymanufacturerss",
  instagramHandle: "sirinijewellerymanufacturerss",
  followerText: "1.9k followers",
  addressLine: "Mumbai, Maharashtra, India",
  city: "Mumbai",
  region: "Maharashtra",
  postalCode: "400001",
  country: "IN",
  openingHours: "Mo-Sa 10:00-19:00",
  justdialUrl: "https://www.justdial.com/Mumbai/Sirini-Jewellery-Manufacturers",
};

/** Setting keys used across the admin settings system. */
export const SETTING_KEYS = {
  business: "business.details",
} as const;
