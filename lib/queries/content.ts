import { cache } from "react";
import { getSetting } from "@/lib/queries/site";

// ─────────────────────────────────────────────────────────────────────────────
// Owner-editable content for the static/legal pages and the FAQ.
//
// GOLDEN RULE: every default below is the EXACT current page copy, so nothing
// on the storefront changes until the owner edits a value in the admin.
//
// All content is rendered as STRUCTURED fields only (headings + paragraph
// strings). Never render this as raw HTML.
// ─────────────────────────────────────────────────────────────────────────────

export interface ContentSection {
  heading: string;
  body: string;
}

export interface PageContent {
  title: string;
  intro?: string;
  sections: ContentSection[];
  updated?: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

// Single source of truth for shipping/refund timing. Previously the delivery
// window was written as "5–7" on the Shipping page but "3–7" on the FAQ — the
// owner now sets it ONCE here and every page reads the same value.
export interface ShippingTime {
  /** Standard delivery window, e.g. "3–7". Combined with "business days". */
  deliveryDays: string;
  /** Refund processing window, e.g. "5–7". Combined with "business days". */
  refundDays: string;
  /** Return / exchange window in days, e.g. "7". */
  returnDays: string;
}

export const DEFAULT_SHIPPING_TIME: ShippingTime = {
  // Preserves the prior live Shipping/Terms copy ("5–7 business days"). The FAQ
  // historically said "3–7"; the owner can unify both via /admin/settings/content.
  deliveryDays: "5–7",
  refundDays: "5–7",
  returnDays: "7",
};

export const getShippingTime = cache(async (): Promise<ShippingTime> => {
  const v = await getSetting<Partial<ShippingTime> | null>("content.shippingTime", null);
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return { ...DEFAULT_SHIPPING_TIME, ...v };
  }
  return DEFAULT_SHIPPING_TIME;
});

// ── About ────────────────────────────────────────────────────────────────────
export const DEFAULT_ABOUT: PageContent = {
  title: "The Mumbai Workshop",
  intro:
    "Sirini Jewellery was born in the bustling lanes of Mumbai in 2015 — not in a factory, but at a family workbench. What started as a passion for preserving traditional goldsmithing techniques grew into a brand worn by women across India.\n\nEvery piece we create carries the fingerprints of artisans who have inherited their craft across generations. We do not cut corners — we cut metal, shape wire, and set stones the way it has always been done: with patience, skill, and love.",
  sections: [
    {
      heading: "Crafted to Last",
      body: "Sirini uses only ethically sourced materials — from gleaming 22kt gold plating and intricate Kundan stonework to hand-painted Meenakari enamel and premium oxidised silver. Every material is chosen for how it wears, not just how it looks.",
    },
    {
      heading: "Quality First",
      body: "Every piece passes hands-on quality inspection before it reaches you.",
    },
    {
      heading: "Heritage Craft",
      body: "Techniques passed down through generations of Mumbai artisans.",
    },
    {
      heading: "Thoughtful Gifting",
      body: "Beautiful packaging — every order is gift-ready from the box.",
    },
  ],
};

export const getAbout = cache(async (): Promise<PageContent> => {
  return resolvePage("content.about", DEFAULT_ABOUT);
});

// ── Shipping & Returns ───────────────────────────────────────────────────────
// Note: the live delivery / refund / return windows come from getShippingTime()
// and are interpolated into the storefront page — they are NOT baked into these
// section bodies, so the owner sets timing in one place.
export const DEFAULT_SHIPPING: PageContent = {
  title: "Shipping & Returns",
  sections: [
    {
      heading: "Shipping Policy",
      body: "Once your order is shipped, you will receive a tracking number via email. We ship across all major cities and towns in India through trusted courier partners.",
    },
    {
      heading: "Return Policy",
      body: "We accept returns within the return window of delivery for items that are unused, in original condition, and in original packaging.\n\nEligible for return: wrong product delivered; defective or damaged product; product significantly different from description.\n\nNot eligible for return: items damaged due to misuse; items returned after the return window; customised or made-to-order items.\n\nTo initiate a return, email us at sirinijewellery@gmail.com with your order ID and photos of the product. We'll arrange a pickup within 2 business days.",
    },
    {
      heading: "Refunds",
      body: "Once your return is received and inspected, we will process your refund. Refunds are credited to your original payment method.",
    },
  ],
};

export const getShipping = cache(async (): Promise<PageContent> => {
  return resolvePage("content.shipping", DEFAULT_SHIPPING);
});

// ── Privacy ──────────────────────────────────────────────────────────────────
export const DEFAULT_PRIVACY: PageContent = {
  title: "Privacy Policy",
  updated: "January 2025",
  sections: [
    {
      heading: "Information We Collect",
      body: "We collect information you provide directly — such as your name, email address, phone number, and shipping address — when you create an account, place an order, or contact us.\n\nWe also collect usage data automatically, including your device type, browser, pages visited, and interactions on our site, to improve your experience.",
    },
    {
      heading: "How We Use Your Information",
      body: "To process and fulfil your orders.\nTo communicate about your purchases and account.\nTo send promotional emails (with your consent).\nTo improve our website and product offerings.\nTo comply with legal obligations.",
    },
    {
      heading: "Payment Security",
      body: "All payments are processed securely through Razorpay. We do not store your card details. Razorpay is PCI-DSS compliant and encrypts all payment data.",
    },
    {
      heading: "Data Sharing",
      body: "We do not sell your personal information. We may share it with trusted service providers (shipping partners, payment processors) strictly to fulfil your orders.",
    },
    {
      heading: "Your Rights",
      body: "You may request access to, correction of, or deletion of your personal data at any time by emailing us at sirinijewellery@gmail.com.",
    },
    {
      heading: "Contact",
      body: "For privacy-related queries, please reach out to us at sirinijewellery@gmail.com.",
    },
  ],
};

export const getPrivacy = cache(async (): Promise<PageContent> => {
  return resolvePage("content.privacy", DEFAULT_PRIVACY);
});

// ── Terms ────────────────────────────────────────────────────────────────────
// Shipping section intentionally omits the delivery window number — it is
// interpolated from getShippingTime() on the page so it can never drift.
export const DEFAULT_TERMS: PageContent = {
  title: "Terms of Service",
  updated: "January 2025",
  sections: [
    {
      heading: "Acceptance of Terms",
      body: "By using this website and placing orders with Sirini Jewellery, you agree to these Terms of Service. If you disagree with any part, please do not use our services.",
    },
    {
      heading: "Products & Pricing",
      body: "All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes. We reserve the right to modify prices without prior notice. Product images are representative; actual colour may vary slightly due to photography and screen settings.",
    },
    {
      heading: "Orders & Payment",
      body: "Orders are confirmed only after successful payment. We accept payments via Razorpay (credit/debit cards, UPI, net banking, and wallets). In case of payment failure, your order will not be processed.",
    },
    {
      heading: "Shipping",
      body: "We offer free shipping across India. See our Shipping & Returns page for full details.",
    },
    {
      heading: "Intellectual Property",
      body: "All content on this website — including images, text, logos, and designs — is the property of Sirini Jewellery. You may not reproduce or distribute it without our explicit written permission.",
    },
    {
      heading: "Limitation of Liability",
      body: "Sirini Jewellery shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services.",
    },
    {
      heading: "Governing Law",
      body: "These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Mumbai, Maharashtra.",
    },
    {
      heading: "Contact",
      body: "Questions about these terms? Email us at sirinijewellery@gmail.com.",
    },
  ],
};

export const getTerms = cache(async (): Promise<PageContent> => {
  return resolvePage("content.terms", DEFAULT_TERMS);
});

// ── FAQ ──────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for the FAQ. Both app/faq/page.tsx and
// components/FAQJsonLd.tsx read getFaq() so the on-page list and the
// structured-data list can never drift apart again.
export const DEFAULT_FAQ: FaqItem[] = [
  {
    q: "Is Sirini jewellery made of real gold?",
    a: "No — Sirini pieces are high-quality gold-plated fashion jewellery. The base metal is brass or copper, coated with 18–22K gold plating. They are not solid gold, but are crafted to look and feel luxurious at an accessible price.",
  },
  {
    q: "How long does the gold plating last?",
    a: "With proper care, the gold plating on Sirini jewellery typically lasts 1–3 years with regular wear, and considerably longer for pieces worn occasionally. Avoid contact with water, perfume, sweat and harsh chemicals to maximise the life of the plating.",
  },
  {
    q: "How do I care for my Sirini jewellery?",
    a: "Put your jewellery on last — after makeup, perfume and lotion have dried — and take it off first when you return home. Keep pieces away from water, sweat and chemicals. After wearing, gently wipe each piece with a soft dry microfibre cloth. Store in the pouch or box provided, separately from other jewellery to avoid scratches.",
  },
  {
    q: "Do you offer free shipping across India?",
    a: "Yes. Sirini offers free pan-India shipping on every order, with no minimum order value. We ship to all serviceable pin codes across India.",
  },
  {
    q: "How long does delivery take?",
    a: "Delivery typically takes 3–7 business days depending on your location. Metro cities usually receive orders within 3–4 days; smaller towns and remote pin codes may take up to 7 days. A tracking link is shared via WhatsApp once your order is dispatched.",
  },
  {
    q: "What is the return and exchange policy?",
    a: "We accept exchanges within 7 days of delivery for manufacturing defects or wrong items received. Please contact us via WhatsApp with photos of the issue within 7 days of receiving your order. We do not accept returns for change of mind or incorrect size selection.",
  },
  {
    q: "Can I place bulk or wholesale orders?",
    a: "Yes, we welcome bulk and wholesale enquiries — for weddings, gifting, resellers and corporate orders. Please reach out to us directly on WhatsApp or email with your requirements and we will share a custom quote.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major payment methods via Razorpay — including UPI (GPay, PhonePe, Paytm), credit and debit cards, net banking, and EMI. Cash on Delivery (COD) is available at select pin codes.",
  },
  {
    q: "How do I find the right ring or bangle size?",
    a: "Each product page includes a size guide. For rings, wrap a thin strip of paper around your finger, mark where it overlaps, and measure the length in millimetres — that is your circumference. For bangles, measure around the widest part of your hand (knuckles) when folded. If you are between sizes, size up for bangles.",
  },
  {
    q: "How can I contact Sirini Jewellery?",
    a: "The fastest way to reach us is via WhatsApp — click the chat button on any page or message us directly at +91 93222 22216. We typically respond within a few hours during business hours (10 am – 7 pm IST, Monday to Saturday).",
  },
  {
    q: "Are Kundan and Meenakari pieces suitable for daily wear?",
    a: "Kundan and Meenakari pieces, with their intricate stone settings and enamel work, are best reserved for festive and occasional wear to keep them looking their best. Our simpler gold-plated bangles, rings and stud earrings are better suited to daily wear.",
  },
  {
    q: "Do the jewellery pieces look exactly like the photos?",
    a: "We photograph every piece under natural light to show the most accurate colour and detail. Slight variations in stone shade or finish may occur, as these are handcrafted pieces — this is what makes each one unique. If you have any concerns after receiving your order, contact us and we will make it right.",
  },
];

export const getFaq = cache(async (): Promise<FaqItem[]> => {
  const v = await getSetting<unknown>("content.faq", null);
  const clean = sanitizeFaq(v);
  return clean.length ? clean : DEFAULT_FAQ;
});

// ── Internal helpers ─────────────────────────────────────────────────────────

// Merge a stored partial page over its defaults and sanitise section shape, so
// a malformed or partial save can never break the storefront render.
async function resolvePage(key: string, fallback: PageContent): Promise<PageContent> {
  const v = await getSetting<unknown>(key, null);
  if (!v || typeof v !== "object" || Array.isArray(v)) return fallback;

  const obj = v as Partial<PageContent>;
  const sections = sanitizeSections(obj.sections);

  return {
    title: typeof obj.title === "string" && obj.title.trim() ? obj.title : fallback.title,
    intro:
      typeof obj.intro === "string"
        ? obj.intro
        : fallback.intro,
    sections: sections.length ? sections : fallback.sections,
    updated:
      typeof obj.updated === "string"
        ? obj.updated
        : fallback.updated,
  };
}

function sanitizeSections(input: unknown): ContentSection[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(
      (s): s is ContentSection =>
        !!s &&
        typeof s === "object" &&
        typeof (s as ContentSection).heading === "string" &&
        typeof (s as ContentSection).body === "string",
    )
    .map((s) => ({ heading: s.heading, body: s.body }))
    .filter((s) => s.heading.trim() || s.body.trim());
}

function sanitizeFaq(input: unknown): FaqItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(
      (f): f is FaqItem =>
        !!f &&
        typeof f === "object" &&
        typeof (f as FaqItem).q === "string" &&
        typeof (f as FaqItem).a === "string",
    )
    .map((f) => ({ q: f.q, a: f.a }))
    .filter((f) => f.q.trim() && f.a.trim());
}
