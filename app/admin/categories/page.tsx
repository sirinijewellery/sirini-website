import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TaxonomyCategoriesClient } from "@/components/admin/TaxonomyCategoriesClient";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login?callbackUrl=/admin/categories");

  const taxonomyGroup = await prisma.taxonomyGroup.findFirst({
    where: { slug: "category" },
    select: {
      id: true,
      terms: {
        where: { parentId: null },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          label: true,
          slug: true,
          blurb: true,
          coverImage: true,
          coverFocal: true,
          showInMenu: true,
          sortOrder: true,
          children: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              label: true,
              slug: true,
              blurb: true,
              coverImage: true,
              coverFocal: true,
              showInMenu: true,
              sortOrder: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <TaxonomyCategoriesClient
        groupId={taxonomyGroup?.id ?? ""}
        initialCategories={taxonomyGroup?.terms ?? []}
      />
    </div>
  );
}
