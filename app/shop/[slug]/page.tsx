import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ImageGallery } from "@/components/ImageGallery";
import { RelatedProducts } from "@/components/RelatedProducts";
import { getProductBySlug, getPairingProducts, parseImages } from "@/lib/queries/products";
import { CompleteTheSet } from "@/components/CompleteTheSet";
import { sortAllImages, selectCardImages } from "@/lib/parseImages";
import { productMetadata, siteConfig } from "@/lib/seo";
import ProductDetailClient from "./ProductDetailClient";
import { ProductJsonLd } from "@/components/ProductJsonLd";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { FAQJsonLd } from "@/components/FAQJsonLd";
import { ProductReviews } from "@/components/ProductReviews";
import { categoryLabel } from "@/lib/taxonomy";
import { RecentlyViewedStrip } from "@/components/RecentlyViewedStrip";
import { prisma } from "@/lib/prisma";
import { getBadges, getLowStockThreshold } from "@/lib/queries/catalog";

// ISR — product pages are cached and served instantly, re-rendered at most
// every 10 minutes. Stock is re-verified server-side at checkout, and
// reviews/wishlist load client-side, so staleness here is safe.
export const revalidate = 600;

// Pre-render every product page at build time so first visits are instant;
// new products (created after a deploy) still render on demand and cache.
export async function generateStaticParams() {
  const products = await prisma.product.findMany({ select: { slug: true } });
  return products.map((p) => ({ slug: p.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };

  const images = sortAllImages(parseImages(product.images));
  const base = productMetadata({
    name: product.name,
    description: product.description,
    images,
    price: product.price,
    category: product.category,
    slug: product.slug,
  });

  // Per-product SEO overrides: use the owner-entered title/description when set,
  // otherwise fall back to the auto-generated values from productMetadata().
  const metaTitle = product.metaTitle?.trim() || undefined;
  const metaDescription = product.metaDescription?.trim() || undefined;

  return {
    ...base,
    ...(metaTitle ? { title: metaTitle } : {}),
    ...(metaDescription ? { description: metaDescription } : {}),
    openGraph: {
      ...base.openGraph,
      ...(metaTitle ? { title: metaTitle } : {}),
      ...(metaDescription ? { description: metaDescription } : {}),
    },
    twitter: {
      ...base.twitter,
      ...(metaTitle ? { title: metaTitle } : {}),
      ...(metaDescription ? { description: metaDescription } : {}),
    },
    keywords: [
      product.name,
      ...(product.category ? [product.category, `buy ${product.category} online`] : []),
      ...(product.material ? [product.material, `${product.material} jewellery`] : []),
      "Sirini Jewellery",
      "handcrafted jewellery",
      "Indian jewellery online",
      "free shipping India",
    ],
    alternates: {
      canonical: `${siteConfig.url}/shop/${product.slug}`,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const reviewStats = await prisma.review.aggregate({
    where: { productId: product.id, isPublished: true },
    _avg: { rating: true },
    _count: { id: true },
  });

  const reviews = await prisma.review.findMany({
    where: { productId: product.id, isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { authorName: true, rating: true, body: true, createdAt: true },
  });

  // Sort: model first → full set → detail close-ups
  const images = sortAllImages(parseImages(product.images));

  // Owner-editable catalog settings (badges + low-stock threshold) for the PDP.
  const [badges, lowStockThreshold] = await Promise.all([
    getBadges(),
    getLowStockThreshold(),
  ]);

  // "Complete the Look" bundle — first 2 complementary pieces from other categories
  const pairing = await getPairingProducts(product.category, product.id);
  const completeTheSet = pairing.slice(0, 2).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    image: selectCardImages(parseImages(p.images)).primary,
  }));

  const siteUrl = siteConfig.url;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Breadcrumb — visible nav */}
      <nav className="flex items-center gap-2 text-xs font-sans text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-primary transition-colors">
          Shop
        </Link>
        <span>/</span>
        <Link
          href={`/shop?category=${encodeURIComponent(product.category)}`}
          className="hover:text-primary transition-colors"
        >
          {categoryLabel(product.category)}
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[160px]">{product.name}</span>
      </nav>

      {/* Product layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
        {/* Left — Image gallery */}
        <ImageGallery images={images} productName={product.name} />

        {/* Right — Product info (client component for add-to-cart state) */}
        <ProductDetailClient
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            category: product.category,
            material: product.material,
            sku: product.sku,
            badge: product.badge,
            stock: product.stock,
          }}
          images={images}
          badges={badges}
          lowStockThreshold={lowStockThreshold}
        />
      </div>

      {/* Complete the Set — display-only bundle suggestion */}
      <CompleteTheSet
        products={completeTheSet}
        mainPrice={product.price}
        mainCompareAt={product.compareAtPrice ?? undefined}
      />

      {/* Related / pairing products */}
      <Suspense fallback={null}>
        <RelatedProducts category={product.category} excludeId={product.id} />
      </Suspense>

      {/* Product reviews */}
      <Suspense fallback={null}>
        <ProductReviews productId={product.id} />
      </Suspense>

      {/* Recently viewed */}
      <RecentlyViewedStrip currentProductId={product.id} />

      {/* Structured data */}
      <ProductJsonLd
        product={{
          name: product.name,
          description: product.description,
          images: parseImages(product.images),
          price: product.price,
          sku: product.sku,
          slug: product.slug,
          material: product.material,
          category: product.category,
          stock: product.stock,
        }}
        reviewSummary={
          reviewStats._count.id > 0
            ? { ratingValue: reviewStats._avg.rating ?? 0, reviewCount: reviewStats._count.id }
            : undefined
        }
        reviews={reviews}
      />
      <FAQJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: siteUrl },
          { name: "Shop", url: `${siteUrl}/shop` },
          { name: product.category, url: `${siteUrl}/shop?category=${encodeURIComponent(product.category)}` },
          { name: product.name, url: `${siteUrl}/shop/${product.slug}` },
        ]}
      />
    </div>
  );
}
