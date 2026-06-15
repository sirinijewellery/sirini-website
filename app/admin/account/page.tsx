import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AccountForm } from "@/components/admin/AccountForm";

export const metadata = { title: "My Account" };

export default async function AdminAccountPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login?callbackUrl=/admin/account");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, createdAt: true, isAdmin: true },
  });
  if (!user) redirect("/login");

  return (
    <div className="p-4 md:p-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">My Account</h1>
        <p className="text-sm text-slate-500 mt-1">
          View your sign-in credentials and update your username, email or password.
        </p>
      </div>

      {/* Read-only summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">Username</dt>
            <dd className="text-slate-900 font-medium">{user.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Login email</dt>
            <dd className="text-slate-900 font-medium break-all">{user.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Role</dt>
            <dd className="text-slate-900 font-medium">{user.isAdmin ? "Administrator" : "Customer"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Member since</dt>
            <dd className="text-slate-900 font-medium">
              {new Date(user.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </dd>
          </div>
        </dl>
      </div>

      <AccountForm initialName={user.name ?? ""} initialEmail={user.email} />
    </div>
  );
}
