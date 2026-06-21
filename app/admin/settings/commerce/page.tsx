import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCommerceSettings } from "@/lib/queries/commerce";
import { CommerceSettingsManager } from "@/components/admin/CommerceSettingsManager";

export const metadata = { title: "Pricing & shipping" };

export default async function AdminCommerceSettingsPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login?callbackUrl=/admin/settings/commerce");

  const commerce = await getCommerceSettings();

  return (
    <div className="p-4 md:p-10 max-w-3xl">
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-4"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Settings
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Pricing & shipping</h1>
        <p className="text-sm text-slate-500 mt-1">
          GST, gift wrapping, shipping and Cash-on-Delivery rules. Defaults match the
          current site, so nothing changes until you edit a value.
        </p>
      </div>
      <CommerceSettingsManager initial={commerce} />
    </div>
  );
}
