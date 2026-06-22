import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTaxonomyTree } from "@/lib/queries/taxonomy";
import { ShopTaxonomyManager } from "@/components/admin/ShopTaxonomyManager";

export const metadata = { title: "Shop & taxonomy" };

export default async function AdminShopPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login?callbackUrl=/admin/shop");

  const groups = await getTaxonomyTree();

  return (
    <div className="p-4 md:p-10 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Shop &amp; taxonomy</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage the dimensions products are organised by — categories &amp;
          sub-categories, occasions, collections and more. These power your shop
          filters and the Shop menu.
        </p>
      </div>
      <ShopTaxonomyManager initialGroups={groups} />
    </div>
  );
}
