import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/seo";
import { OCCASIONS, STYLES, NAV_CATEGORIES } from "@/lib/taxonomy";
import { getTaxonomyTree } from "@/lib/queries/taxonomy";
import { getAllArticles } from "@/lib/blog";

const BASE_URL = siteConfig.url;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    select: { slug: true, createdAt: true },
  });
  const articles = await getAllArticles();

  // Admin-managed "collection" taxonomy terms — promoted in the nav and on the
  // homepage, so their filtered shop URLs belong in the sitemap too.
  const taxonomyTree = await getTaxonomyTree().catch(() => []);
  const collectionTerms =
    taxonomyTree.find((g) => g.slug === "collection")?.terms ?? [];
  // look/stone/colour facet URLs are indexable single-facet shop pages too
  // (see app/shop/page.tsx generateMetadata) — belong in the sitemap for the
  // same reason collection does.
  const lookTerms = taxonomyTree.find((g) => g.slug === "look")?.terms ?? [];
  const stoneTerms = taxonomyTree.find((g) => g.slug === "stone")?.terms ?? [];
  const colourTerms = taxonomyTree.find((g) => g.slug === "colour")?.terms ?? [];

  // Real, stable lastmod dates. Google ignores lastmod that changes on every
  // crawl, so catalog pages track the newest product, the blog index tracks the
  // newest article, and the static info pages use a fixed content date.
  const catalogUpdated = products.reduce(
    (max, p) => (p.createdAt > max ? p.createdAt : max),
    new Date(0),
  );
  const safeCatalog = catalogUpdated.getTime() > 0 ? catalogUpdated : new Date("2026-06-01T00:00:00");
  const newestArticle = articles.reduce((max, a) => {
    const d = new Date(`${a.date}T00:00:00`);
    return d > max ? d : max;
  }, new Date(0));
  const blogUpdated = newestArticle.getTime() > 0 ? newestArticle : safeCatalog;
  const STATIC_UPDATED = new Date("2026-06-01T00:00:00");

  // ── Static pages (only routes that exist) ────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: safeCatalog, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/shop`, lastModified: safeCatalog, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/occasions`, lastModified: safeCatalog, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: blogUpdated, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/world`, lastModified: STATIC_UPDATED, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/about`, lastModified: STATIC_UPDATED, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: STATIC_UPDATED, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/faq`, lastModified: STATIC_UPDATED, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/shipping`, lastModified: STATIC_UPDATED, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/privacy`, lastModified: STATIC_UPDATED, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: STATIC_UPDATED, changeFrequency: "yearly", priority: 0.3 },
  ];

  // ── Blog articles ────────────────────────────────────────────────
  const blogRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/blog/${article.slug}`,
    lastModified: new Date(`${article.date}T00:00:00`),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // ── Occasion facet URLs ──────────────────────────────────────────
  const occasionRoutes: MetadataRoute.Sitemap = OCCASIONS.map((o) => ({
    url: `${BASE_URL}/shop?occasion=${encodeURIComponent(o.slug)}`,
    lastModified: safeCatalog,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // ── Style facet URLs ─────────────────────────────────────────────
  const styleRoutes: MetadataRoute.Sitemap = STYLES.map((s) => ({
    url: `${BASE_URL}/shop?style=${encodeURIComponent(s.slug)}`,
    lastModified: safeCatalog,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // ── Category facet URLs ──────────────────────────────────────────
  const categoryRoutes: MetadataRoute.Sitemap = NAV_CATEGORIES.map((c) => ({
    url: `${BASE_URL}/shop?category=${encodeURIComponent(c.slug)}`,
    lastModified: safeCatalog,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // ── Collection facet URLs ────────────────────────────────────────
  const collectionRoutes: MetadataRoute.Sitemap = collectionTerms.map((c) => ({
    url: `${BASE_URL}/shop?collection=${encodeURIComponent(c.slug)}`,
    lastModified: safeCatalog,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // ── Look/Stone/Colour facet URLs ─────────────────────────────────
  const lookRoutes: MetadataRoute.Sitemap = lookTerms.map((t) => ({
    url: `${BASE_URL}/shop?look=${encodeURIComponent(t.slug)}`,
    lastModified: safeCatalog,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
  const stoneRoutes: MetadataRoute.Sitemap = stoneTerms.map((t) => ({
    url: `${BASE_URL}/shop?stone=${encodeURIComponent(t.slug)}`,
    lastModified: safeCatalog,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
  const colourRoutes: MetadataRoute.Sitemap = colourTerms.map((t) => ({
    url: `${BASE_URL}/shop?colour=${encodeURIComponent(t.slug)}`,
    lastModified: safeCatalog,
    changeFrequency: "weekly" as const,
    priority: 0.6,
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
    ...collectionRoutes,
    ...lookRoutes,
    ...stoneRoutes,
    ...colourRoutes,
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
