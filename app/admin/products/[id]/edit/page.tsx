import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { getCategories } from "@/lib/queries/products";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata: Metadata = { title: "Edit Product" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    }),
    getCategories(),
  ]);

  if (!product) notFound();

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold text-slate-900 font-sans mb-6">
        Edit Product
      </h1>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
