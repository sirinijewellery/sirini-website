import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CouponsClient } from "@/components/admin/CouponsClient";

export const metadata: Metadata = { title: "Coupons" };

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 font-sans">Coupons</h1>
      </div>
      <CouponsClient initialCoupons={coupons} />
    </div>
  );
}
