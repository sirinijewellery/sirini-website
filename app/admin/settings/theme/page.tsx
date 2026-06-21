import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getThemeSettings } from "@/lib/queries/theme";
import { ThemeSettingsManager } from "@/components/admin/ThemeSettingsManager";

export const metadata = { title: "Theme — colours & fonts" };

export default async function AdminThemeSettingsPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login?callbackUrl=/admin/settings/theme");

  const { colors, fontKey } = await getThemeSettings();

  return (
    <div className="p-4 md:p-10 max-w-3xl">
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-4"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Settings
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Theme — colours &amp; fonts</h1>
        <p className="text-sm text-slate-500 mt-1">
          Adjust the brand colours and choose a font pairing for the whole site.
          Leave anything untouched to keep the current look.
        </p>
      </div>
      <ThemeSettingsManager initialColors={colors} initialFontKey={fontKey} />
    </div>
  );
}
