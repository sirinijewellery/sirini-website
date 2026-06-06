import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/seo";
import { OCCASIONS, STYLES, NAV_CATEGORIES } from "@/lib/taxonomy";
import { getAllArticles } from "@/lib/blog";

const BASE_URL = siteConfig.url;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const products = await prisma.product.findMany({
    select: { slug: true, createdAt: true },
  });

  // ── Static pages (only routes that exist) ────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/occasions`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  // ── Blog articles ────────────────────────────────────────────────
  const blogRoutes: MetadataRoute.Sitemap = getAllArticles().map((article) => ({
    url: `${BASE_URL}/blog/${article.slug}`,
    lastModified: new Date(`${article.date}T00:00:00`),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // ── Occasion facet URLs ──────────────────────────────────────────
  const occasionRoutes: MetadataRoute.Sitemap = OCCASIONS.map((o) => ({
    url: `${BASE_URL}/shop?occasion=${encodeURIComponent(o.slug)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // ── Style facet URLs ─────────────────────────────────────────────
  const styleRoutes: MetadataRoute.Sitemap = STYLES.map((s) => ({
    url: `${BASE_URL}/shop?style=${encodeURIComponent(s.slug)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // ── Category facet URLs ──────────────────────────────────────────
  const categoryRoutes: MetadataRoute.Sitemap = NAV_CATEGORIES.map((c) => ({
    url: `${BASE_URL}/shop?category=${encodeURIComponent(c.slug)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // ── Product detail pages ─────────────────────────────────────────
  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/shop/${p.slug}`,
    lastModified: p.createdAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Combine and dedupe by URL (first occurrence wins).
  const all = [
    ...staticRoutes,
    ...occasionRoutes,
    ...styleRoutes,
    ...categoryRoutes,
    ...blogRoutes,
    ...productRoutes,
  ];

  const seen = new Set<string>();
  return all.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
