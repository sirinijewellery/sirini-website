import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CategoriesClient } from "@/components/admin/CategoriesClient";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="p-6 lg:p-8">
      <CategoriesClient initialCategories={categories} />
    </div>
  );
}
