import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  getPromoBanner,
  getTrustBadges,
  getHomeSections,
  getBrandStory,
  getPullQuote,
} from "@/lib/queries/home";
import { HomepageSettingsManager } from "@/components/admin/HomepageSettingsManager";

export const metadata = { title: "Homepage" };

export default async function AdminHomepageSettingsPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login?callbackUrl=/admin/settings/homepage");

  const [promo, trustBadges, sections, brandStory, pullQuote] = await Promise.all([
    getPromoBanner(),
    getTrustBadges(),
    getHomeSections(),
    getBrandStory(),
    getPullQuote(),
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
        <h1 className="text-2xl font-semibold text-slate-900">Homepage</h1>
        <p className="text-sm text-slate-500 mt-1">
          Customise the homepage: promo banner, trust badges, section order, brand story and pull
          quote. Defaults match the current site, so nothing changes until you edit.
        </p>
      </div>
      <HomepageSettingsManager
        initial={{ promo, trustBadges, sections, brandStory, pullQuote }}
      />
    </div>
  );
}
