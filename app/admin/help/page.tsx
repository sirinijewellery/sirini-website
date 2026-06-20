import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminHelp } from "@/components/admin/AdminHelp";
import { HELP_TOPICS } from "@/lib/adminHelp";

export const metadata = { title: "Help" };

export default async function AdminHelpPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login?callbackUrl=/admin/help");

  return (
    <div className="p-4 md:p-10 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Help &amp; How-to</h1>
        <p className="text-sm text-slate-500 mt-1">
          Search any admin task and get the exact steps — adding products, categories, coupons, hero images and more.
        </p>
      </div>
      <AdminHelp topics={HELP_TOPICS} />
    </div>
  );
}
