import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Orders" };

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  searchParams: Promise<{ status?: string; page?: string }>;
}

type OrderWithItemCount = {
  id: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: Date;
  items: { id: string }[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    processing: "bg-amber-100 text-amber-700",
    shipped: "bg-blue-100 text-blue-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-600",
  };
  const cls = map[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}
    >
      {status}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    failed: "bg-red-100 text-red-600",
  };
  const cls = map[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}
    >
      {status}
    </span>
  );
}

// ─── Status Filter Tabs ───────────────────────────────────────────────────────

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

function StatusTabs({
  current,
}: {
  current: string;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {STATUS_TABS.map((tab) => {
        const isActive =
          current === tab.value || (current === "" && tab.value === "all");
        return (
          <Link
            key={tab.value}
            href={tab.value === "all" ? "/admin/orders" : `/admin/orders?status=${tab.value}`}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
              isActive
                ? "bg-slate-900 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  total,
  limit,
  status,
}: {
  page: number;
  total: number;
  limit: number;
  status: string;
}) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const statusParam = status && status !== "all" ? `&status=${status}` : "";
  const prevHref =
    page > 1 ? `/admin/orders?page=${page - 1}${statusParam}` : null;
  const nextHref =
    page < totalPages ? `/admin/orders?page=${page + 1}${statusParam}` : null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <p className="text-sm text-gray-500 font-sans">
        Showing{" "}
        <span className="font-medium text-gray-700">
          {start}–{end}
        </span>{" "}
        of <span className="font-medium text-gray-700">{total}</span> orders
      </p>
      <div className="flex items-center gap-2">
        {prevHref ? (
          <Link
            href={prevHref}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150"
          >
            ← Previous
          </Link>
        ) : (
          <span className="px-3 py-1.5 text-sm font-medium text-gray-400 bg-white border border-gray-200 rounded-lg cursor-not-allowed">
            ← Previous
          </span>
        )}
        <span className="text-sm text-gray-500 font-sans">
          Page {page} of {totalPages}
        </span>
        {nextHref ? (
          <Link
            href={nextHref}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150"
          >
            Next →
          </Link>
        ) : (
          <span className="px-3 py-1.5 text-sm font-medium text-gray-400 bg-white border border-gray-200 rounded-lg cursor-not-allowed">
            Next →
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { status, page } = await searchParams;

  const currentPage = Math.max(1, parseInt(page ?? "1") || 1);
  const limit = 20;
  const activeStatus = status ?? "";

  const where =
    activeStatus && activeStatus !== "all"
      ? { orderStatus: activeStatus }
      : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * limit,
      take: limit,
      include: { items: { select: { id: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900 font-sans">
            Orders
          </h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {total.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4">
        <StatusTabs current={activeStatus} />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg
              className="w-10 h-10 text-gray-300 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-sm font-medium text-gray-500">No orders found</p>
            {activeStatus && activeStatus !== "all" && (
              <Link
                href="/admin/orders"
                className="mt-2 text-xs text-slate-600 underline underline-offset-2 hover:text-slate-900"
              >
                Clear filter
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full font-sans text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left px-4 py-3">
                      Order ID
                    </th>
                    <th className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left px-4 py-3">
                      Customer
                    </th>
                    <th className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left px-4 py-3">
                      Items
                    </th>
                    <th className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left px-4 py-3">
                      Total
                    </th>
                    <th className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left px-4 py-3">
                      Order Status
                    </th>
                    <th className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left px-4 py-3">
                      Payment
                    </th>
                    <th className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left px-4 py-3">
                      Date
                    </th>
                    <th className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left px-4 py-3">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(orders as OrderWithItemCount[]).map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors duration-100"
                    >
                      <td className="px-4 py-3 text-gray-900">
                        <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                          {order.id.slice(0, 8)}…
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        <p className="font-medium text-gray-800 leading-tight">
                          {order.customerName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {order.customerEmail}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                          {order.items.length}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium tabular-nums">
                        {formatINR(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={order.orderStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-150 cursor-pointer"
                        >
                          View
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={currentPage}
              total={total}
              limit={limit}
              status={activeStatus}
            />
          </>
        )}
      </div>
    </div>
  );
}
