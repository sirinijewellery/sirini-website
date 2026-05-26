import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ImageGallery } from "@/components/ImageGallery";
import { RelatedProducts } from "@/components/RelatedProducts";
import { getProductBySlug, parseImages } from "@/lib/queries/products";
import ProductDetailClient from "./ProductDetailClient";
import { ProductJsonLd } from "@/components/ProductJsonLd";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };

  const images = parseImages(product.images);
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      title: `${product.name} | Sirini Jewellery`,
      description: product.description.slice(0, 160),
      images: images[0] ? [{ url: images[0] }] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const images = parseImages(product.images);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Breadcrumb */}
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
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[160px]">{product.name}</span>
      </nav>

      {/* Product layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
        {/* Left — Image gallery */}
        <ImageGallery images={images} productName={product.name} />

        {/* Right — Product info (client component for variant state) */}
        <ProductDetailClient
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: product.price,
            category: product.category,
            material: product.material,
            sku: product.sku,
            badge: product.badge,
            variants: product.variants,
          }}
          images={images}
        />
      </div>

      {/* Related products */}
      <Suspense fallback={null}>
        <RelatedProducts category={product.category} excludeId={product.id} />
      </Suspense>

      <ProductJsonLd
        product={{
          name: product.name,
          description: product.description,
          images: parseImages(product.images),
          price: product.price,
          sku: product.sku,
          slug: product.slug,
        }}
      />
    </div>
  );
}
