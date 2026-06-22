import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";
import { getBadges } from "@/lib/queries/catalog";
import { getTaxonomyTree, getProductTermsGrouped } from "@/lib/queries/taxonomy";

export const metadata: Metadata = { title: "Edit Product" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  const [product, categories, badges, taxonomy, productTerms] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, image: true },
    }),
    getBadges(),
    getTaxonomyTree(),
    getProductTermsGrouped(id),
  ]);

  if (!product) notFound();

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold text-slate-900 font-sans mb-6">
        Edit Product
      </h1>
      <ProductForm
        product={product}
        categories={categories}
        badges={badges}
        taxonomy={taxonomy}
        productTerms={productTerms}
      />
    </div>
  );
}
