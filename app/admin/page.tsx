import type { Metadata } from "next";
import { getDashboardStats } from "@/lib/queries/admin";
import {
  LayoutDashboard,
  ShoppingBag,
  IndianRupee,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard" };

const inr = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));

type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

const statusConfig: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  processing: {
    label: "Processing",
    className: "bg-amber-100 text-amber-700",
  },
  shipped: {
    label: "Shipped",
    className: "bg-blue-100 text-blue-700",
  },
  delivered: {
    label: "Delivered",
    className: "bg-green-100 text-green-700",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-600",
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as OrderStatus] ?? {
    label: status,
    className: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-sans text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  const statCards = [
    {
      label: "Total Orders",
      value: stats.totalOrders.toString(),
      icon: ShoppingBag,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
    },
    {
      label: "Processing",
      value: stats.processingCount.toString(),
      icon: LayoutDashboard,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Total Revenue",
      value: inr(stats.totalRevenue),
      icon: IndianRupee,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      label: "Today's Orders",
      value: stats.todayOrders.toString(),
      icon: TrendingUp,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="font-sans text-2xl font-semibold text-slate-900">
          Dashboard
        </h1>
        <p className="font-sans text-sm text-slate-500 mt-1">
          Welcome back — here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3"
            >
              <div
                className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center`}
              >
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <div>
                <p className="font-sans text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {card.label}
                </p>
                <p className="font-sans text-2xl font-semibold text-slate-900 mt-0.5 leading-tight">
                  {card.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-sans text-base font-semibold text-slate-900">
            Recent Orders
          </h2>
          <Link
            href="/admin/orders"
            className="font-sans text-sm text-primary hover:underline transition-colors"
          >
            View all
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-6 py-3 text-left font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                  Items
                </th>
                <th className="px-6 py-3 text-left font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center font-sans text-sm text-slate-400"
                  >
                    No orders yet.
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/80 transition-colors duration-100 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-sans text-sm font-medium text-slate-900 hover:text-primary transition-colors font-mono"
                      >
                        #{order.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${order.id}`} className="block">
                        <span className="font-sans text-sm text-slate-800 block">
                          {order.customerName}
                        </span>
                        <span className="font-sans text-xs text-slate-400">
                          {order.customerEmail}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="font-sans text-sm text-slate-600">
                        {order.items.length}{" "}
                        {order.items.length === 1 ? "item" : "items"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-sans text-sm font-medium text-slate-900">
                        {inr(order.totalAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.orderStatus} />
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="font-sans text-sm text-slate-500">
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
