import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";
import { getBadges } from "@/lib/queries/catalog";

export const metadata: Metadata = { title: "New Product" };

export default async function NewProductPage() {
  const [categories, badges] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, image: true },
    }),
    getBadges(),
  ]);

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold text-slate-900 font-sans mb-6">
        Add New Product
      </h1>
      <ProductForm categories={categories} badges={badges} />
    </div>
  );
}
