import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getBusinessDetails } from "@/lib/queries/site";
import { BusinessDetailsManager } from "@/components/admin/BusinessDetailsManager";

export const metadata = { title: "Business details" };

export default async function AdminBusinessSettingsPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login?callbackUrl=/admin/settings/business");

  const business = await getBusinessDetails();

  return (
    <div className="p-4 md:p-10 max-w-3xl">
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-4"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Settings
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Business details</h1>
        <p className="text-sm text-slate-500 mt-1">
          One place for your contact info, socials and address. Everything on the site reads from here.
        </p>
      </div>
      <BusinessDetailsManager initial={business} />
    </div>
  );
}
