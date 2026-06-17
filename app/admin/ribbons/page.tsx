import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRibbonMessages } from "@/lib/queries/site";
import { RibbonManager } from "@/components/admin/RibbonManager";

export const metadata = { title: "Header Ribbon" };

export default async function AdminRibbonsPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login?callbackUrl=/admin/ribbons");

  const messages = await getRibbonMessages();

  return (
    <div className="p-4 md:p-10 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Header Ribbon</h1>
        <p className="text-sm text-slate-500 mt-1">
          Edit the rotating announcement messages shown on the top bar of the store.
        </p>
      </div>
      <RibbonManager initialMessages={messages} />
    </div>
  );
}
