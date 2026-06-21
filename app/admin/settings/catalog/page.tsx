import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  getBadges,
  getLowStockThreshold,
  getHideOutOfStock,
  getDefaultSort,
} from "@/lib/queries/catalog";
import { CatalogSettingsManager } from "@/components/admin/CatalogSettingsManager";

export const metadata = { title: "Catalog & products" };

export default async function AdminCatalogSettingsPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login?callbackUrl=/admin/settings/catalog");

  const [badges, lowStockThreshold, hideOutOfStock, defaultSort] = await Promise.all([
    getBadges(),
    getLowStockThreshold(),
    getHideOutOfStock(),
    getDefaultSort(),
  ]);

  return (
    <div className="p-4 md:p-10 max-w-3xl">
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-4"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Settings
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Catalog & products</h1>
        <p className="text-sm text-slate-500 mt-1">
          Stock display, shop listing behaviour and the product badges available in
          the editor. Defaults match the current site, so nothing changes until you
          edit a value.
        </p>
      </div>
      <CatalogSettingsManager
        initial={{ badges, lowStockThreshold, hideOutOfStock, defaultSort }}
      />
    </div>
  );
}
