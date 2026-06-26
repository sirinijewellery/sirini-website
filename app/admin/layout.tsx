import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getPendingCount } from "@/lib/queries/pending";

export const metadata: Metadata = {
  title: {
    template: "%s | Sirini Admin",
    default: "Sirini Admin",
  },
  robots: { index: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login?callbackUrl=/admin");

  const pendingCount = await getPendingCount();

  return (
    <div className="flex h-dvh bg-gray-50 overflow-hidden">
      <AdminSidebar pendingCount={pendingCount} />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
    </div>
  );
}
