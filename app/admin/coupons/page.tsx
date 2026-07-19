import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CouponsClient } from "@/components/admin/CouponsClient";

export const metadata: Metadata = { title: "Coupons" };

export default async function AdminCouponsPage() {
  // Default view = admin-created coupons only. Machine-minted lead coupons
  // (issuedToEmail != null) can number in the thousands and would flood this
  // unpaginated table; they're reachable via the "minted" filter in the client.
  const coupons = await prisma.coupon.findMany({
    where: { issuedToEmail: null },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 font-sans">Coupons</h1>
      </div>
      <CouponsClient initialCoupons={coupons} />
    </div>
  );
}
