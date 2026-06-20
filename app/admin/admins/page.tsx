import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminsManager } from "@/components/admin/AdminsManager";

export const metadata = { title: "Admins" };

export default async function AdminsPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login?callbackUrl=/admin/admins");

  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true, username: true, email: true, name: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="p-4 md:p-10 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Admins</h1>
        <p className="text-sm text-slate-500 mt-1">
          Everyone who can sign in to this admin panel. Create new admins, or change a username or password.
        </p>
      </div>
      <AdminsManager initialAdmins={admins} currentUserId={session.user.id} />
    </div>
  );
}
