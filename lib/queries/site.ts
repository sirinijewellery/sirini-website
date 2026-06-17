import { prisma } from "@/lib/prisma";

export interface HeroSlideData {
  id: string;
  imageUrl: string;
  mobileImageUrl: string | null;
  focalDesktop: string;
  focalMobile: string;
}

// Falls back to the current editorial hero so the home page never breaks,
// even before the owner adds any slides.
export const DEFAULT_HERO_IMAGE =
  "https://res.cloudinary.com/dp8a2lvxg/image/upload/v1781352135/sirini-jewellery/brand/hero-editorial.png";
export const DEFAULT_HERO_DURATION_MS = 6000;
export const DEFAULT_RIBBON_MESSAGES = [
  "Free Pan-India Shipping on All Orders",
  "Handcrafted Since 2015 · Genuine Kundan & Meenakari",
  "Cash on Delivery Available · First Order: Flat 10% OFF",
];

export async function getHeroSlides(): Promise<HeroSlideData[]> {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: {
        id: true, imageUrl: true, mobileImageUrl: true,
        focalDesktop: true, focalMobile: true,
      },
    });
    if (slides.length) return slides;
  } catch {
    // table missing / DB hiccup — fall through to default
  }
  return [{
    id: "default",
    imageUrl: DEFAULT_HERO_IMAGE,
    mobileImageUrl: null,
    focalDesktop: "62% 50%",
    focalMobile: "62% 50%",
  }];
}

async function getSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const row = await prisma.setting.findUnique({ where: { key } });
    if (row && row.value != null) return row.value as T;
  } catch {
    /* ignore */
  }
  return fallback;
}

export async function getHeroDuration(): Promise<number> {
  const v = await getSetting<number>("hero.durationMs", DEFAULT_HERO_DURATION_MS);
  return typeof v === "number" && v >= 1500 && v <= 30000 ? v : DEFAULT_HERO_DURATION_MS;
}

export async function getRibbonMessages(): Promise<string[]> {
  const v = await getSetting<string[]>("ribbon.messages", DEFAULT_RIBBON_MESSAGES);
  const clean = Array.isArray(v) ? v.filter((s) => typeof s === "string" && s.trim()) : [];
  return clean.length ? clean : DEFAULT_RIBBON_MESSAGES;
}
