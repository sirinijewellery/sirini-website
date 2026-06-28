import { cache } from "react";
import { getSetting } from "@/lib/queries/site";

export interface NavLink {
  id: string;
  label: string;
  href: string;
  visible: boolean;
  /** "link" = plain anchor, others = special dropdown component */
  type: "link" | "megamenu" | "occasion" | "collection";
}

export interface NavbarConfig {
  announcementBg?: string;
  announcementText?: string;
  headerBg?: string;
  accentColor?: string;
  links: NavLink[];
}

export const DEFAULT_NAV_LINKS: NavLink[] = [
  { id: "home", label: "Home", href: "/", visible: true, type: "link" },
  { id: "shop", label: "Shop", href: "/shop", visible: true, type: "megamenu" },
  { id: "occasion", label: "Shop by Occasion", href: "/occasions", visible: true, type: "occasion" },
  { id: "collection", label: "Shop by Collection", href: "", visible: true, type: "collection" },
  { id: "faq", label: "FAQ", href: "/faq", visible: true, type: "link" },
  { id: "about", label: "Our Story", href: "/about", visible: true, type: "link" },
  { id: "blog", label: "Journal", href: "/blog", visible: true, type: "link" },
  { id: "shipping", label: "Shipping", href: "/shipping", visible: true, type: "link" },
  { id: "contact", label: "Contact", href: "/contact", visible: true, type: "link" },
];

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function sanitizeColor(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  if (!s) return undefined;
  if (HEX_RE.test(s) || /^rgba?\(/i.test(s) || /^hsla?\(/i.test(s)) return s;
  return undefined;
}

function sanitizeLinks(v: unknown): NavLink[] | null {
  if (!Array.isArray(v)) return null;
  const VALID_TYPES = new Set(["link", "megamenu", "occasion", "collection"]);
  const out: NavLink[] = [];
  for (const item of v) {
    if (!item || typeof item !== "object") continue;
    const { id, label, href, visible, type } = item as Record<string, unknown>;
    if (typeof id !== "string" || !id.trim()) continue;
    if (typeof label !== "string" || !label.trim()) continue;
    if (typeof type !== "string" || !VALID_TYPES.has(type)) continue;
    out.push({
      id: id.trim(),
      label: label.trim(),
      href: typeof href === "string" ? href.trim() : "",
      visible: typeof visible === "boolean" ? visible : true,
      type: type as NavLink["type"],
    });
  }
  return out.length > 0 ? out : null;
}

export const getNavbarConfig = cache(async (): Promise<NavbarConfig> => {
  const raw = await getSetting<unknown>("navbar.config", null);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { links: DEFAULT_NAV_LINKS };
  }
  const obj = raw as Record<string, unknown>;
  return {
    announcementBg: sanitizeColor(obj.announcementBg),
    announcementText: sanitizeColor(obj.announcementText),
    headerBg: sanitizeColor(obj.headerBg),
    accentColor: sanitizeColor(obj.accentColor),
    links: sanitizeLinks(obj.links) ?? DEFAULT_NAV_LINKS,
  };
});
