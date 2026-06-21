import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  getAbout,
  getShipping,
  getPrivacy,
  getTerms,
  getFaq,
  getShippingTime,
} from "@/lib/queries/content";
import { ContentSettingsManager } from "@/components/admin/ContentSettingsManager";

export const metadata = { title: "Pages & FAQ" };

export default async function AdminContentSettingsPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login?callbackUrl=/admin/settings/content");

  const [about, shipping, privacy, terms, faq, shippingTime] = await Promise.all([
    getAbout(),
    getShipping(),
    getPrivacy(),
    getTerms(),
    getFaq(),
    getShippingTime(),
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
        <h1 className="text-2xl font-semibold text-slate-900">Pages & FAQ</h1>
        <p className="text-sm text-slate-500 mt-1">
          Edit the wording on your About, Shipping &amp; Returns, Privacy, Terms and
          FAQ pages. Defaults match the current site, so nothing changes until you
          edit a value.
        </p>
      </div>
      <ContentSettingsManager
        initial={{ about, shipping, privacy, terms, faq, shippingTime }}
      />
    </div>
  );
}
