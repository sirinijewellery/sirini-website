import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";
import { getBadges } from "@/lib/queries/catalog";

export const metadata: Metadata = { title: "Edit Product" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  const [product, categories, badges] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, image: true },
    }),
    getBadges(),
  ]);

  if (!product) notFound();

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold text-slate-900 font-sans mb-6">
        Edit Product
      </h1>
      <ProductForm product={product} categories={categories} badges={badges} />
    </div>
  );
}
