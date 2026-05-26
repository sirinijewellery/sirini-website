import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserOrders } from "@/lib/queries/orders";
import { prisma } from "@/lib/prisma";
import AccountTabs from "@/components/AccountTabs";
import { UserCircleIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "My Account | Sirini Jewellery",
  robots: { index: false },
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account");
  }

  const [orders, addresses] = await Promise.all([
    getUserOrders(session.user.id),
    prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { isDefault: "desc" },
    }),
  ]);

  const userName = session.user.name ?? null;
  const userEmail = session.user.email ?? "";

  return (
    <div className="min-h-screen bg-cream">
      {/* Page header — warm cream strip with generous vertical padding */}
      <div className="border-b border-border bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <UserCircleIcon className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-primary mb-1">
                My Account
              </p>
              <h1 className="font-display text-3xl md:text-4xl font-light text-foreground leading-tight">
                {userName ? `Welcome back, ${userName.split(" ")[0]}` : "Welcome back"}
              </h1>
              <p className="font-sans text-sm text-muted-foreground mt-0.5">{userEmail}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <AccountTabs orders={orders} addresses={addresses} />
      </div>
    </div>
  );
}
