import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getNavbarConfig } from "@/lib/queries/navbar";
import { NavbarSettingsManager } from "@/components/admin/NavbarSettingsManager";

export const metadata = { title: "Navbar" };

export default async function AdminNavbarSettingsPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login?callbackUrl=/admin/settings/navbar");

  const config = await getNavbarConfig();

  return (
    <div className="p-4 md:p-10 max-w-3xl">
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-4"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Settings
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Navbar</h1>
        <p className="text-sm text-slate-500 mt-1">
          Customise the navigation bar colours, and choose which links appear and in what order.
        </p>
      </div>
      <NavbarSettingsManager initialConfig={config} />
    </div>
  );
}
