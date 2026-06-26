import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderById } from "@/lib/queries/orders";
import OrderStatusUpdate from "@/components/admin/OrderStatusUpdate";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

type ShippingAddress = {
  line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Order ${id.slice(0, 8)}` };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateLong(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
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
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold capitalize ${cls}`}
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

function describePayment({
  paymentMethod,
  paymentStatus,
  totalAmount,
}: {
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
}): { label: string; cls: string } {
  if (paymentMethod === "cod") {
    return { label: "COD", cls: "bg-indigo-100 text-indigo-700" };
  }
  if (paymentMethod === "online" && totalAmount === 0) {
    return { label: "Free (coupon)", cls: "bg-emerald-100 text-emerald-700" };
  }
  if (paymentMethod === "online" && paymentStatus === "paid" && totalAmount > 0) {
    return { label: "Online · Paid", cls: "bg-green-100 text-green-700" };
  }
  const statusCls: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    failed: "bg-red-100 text-red-600",
  };
  return {
    label: paymentStatus,
    cls: statusCls[paymentStatus] ?? "bg-gray-100 text-gray-600",
  };
}

function PaymentBadge({
  paymentMethod,
  paymentStatus,
  totalAmount,
}: {
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
}) {
  const { label, cls } = describePayment({
    paymentMethod,
    paymentStatus,
    totalAmount,
  });
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}
    >
      {label}
    </span>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
      {children}
    </p>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) notFound();

  const shipping = (order.shippingAddress ?? {}) as ShippingAddress;
  const subtotal = order.items.reduce(
    (acc, item) => acc + item.priceAtPurchase * item.quantity,
    0
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Back link + header */}
      <div className="mb-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors duration-150 mb-3 group"
        >
          <svg
            className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Orders
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 font-sans">
              Order SR{order.orderNumber}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5 font-mono">
              {order.id}
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Placed on{" "}
            <span className="text-gray-700 font-medium">
              {formatDateLong(order.createdAt)}
            </span>
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column (2/3 width) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Items table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <SectionLabel>Order Items</SectionLabel>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full font-sans text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left px-4 py-3">
                      Product
                    </th>
                    <th className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right px-4 py-3">
                      Qty
                    </th>
                    <th className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right px-4 py-3">
                      Unit Price
                    </th>
                    <th className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right px-4 py-3">
                      Line Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors duration-100"
                    >
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {item.product?.name ?? (
                          <span className="text-gray-400 italic">
                            Product removed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-right tabular-nums">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-right tabular-nums">
                        {formatINR(item.priceAtPurchase)}
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-semibold text-right tabular-nums">
                        {formatINR(item.priceAtPurchase * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pricing summary */}
            <div className="px-4 py-4 border-t border-gray-200 bg-gray-50 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600 font-sans">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatINR(subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm font-sans">
                  <span className="text-green-700">
                    Discount{order.couponCode ? ` (${order.couponCode})` : ""}
                  </span>
                  <span className="text-green-700 tabular-nums">
                    − {formatINR(order.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600 font-sans">
                <span>Shipping</span>
                <span className="text-green-700 font-medium">Free</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-gray-900 font-sans pt-2 border-t border-gray-200 mt-2">
                <span>Total</span>
                <span className="tabular-nums">{formatINR(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Customer & Shipping side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Customer details */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <SectionLabel>Customer</SectionLabel>
              <div className="space-y-2 text-sm font-sans">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="text-gray-900 font-medium">
                    {order.customerName}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <a
                    href={`mailto:${order.customerEmail}`}
                    className="text-slate-700 hover:underline truncate"
                  >
                    {order.customerEmail}
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span className="text-gray-700">{order.customerPhone}</span>
                </div>
              </div>
            </div>

            {/* Shipping address */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <SectionLabel>Shipping Address</SectionLabel>
              <div className="flex items-start gap-2 text-sm font-sans">
                <svg
                  className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <address className="not-italic text-gray-700 leading-relaxed">
                  {shipping.line1 && <span className="block">{shipping.line1}</span>}
                  {(shipping.city || shipping.state) && (
                    <span className="block">
                      {[shipping.city, shipping.state].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {shipping.pincode && (
                    <span className="block text-gray-500">{shipping.pincode}</span>
                  )}
                </address>
              </div>
            </div>
          </div>

          {/* Notes (if any) */}
          {order.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <SectionLabel>Order Notes</SectionLabel>
              <p className="text-sm text-amber-800 font-sans leading-relaxed">
                {order.notes}
              </p>
            </div>
          )}
        </div>

        {/* ── Right column (1/3 width) ── */}
        <div className="space-y-6">
          {/* Status management card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <SectionLabel>Order Status</SectionLabel>
            <OrderStatusUpdate
              orderId={order.id}
              currentStatus={order.orderStatus}
            />
          </div>

          {/* Payment card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <SectionLabel>Payment</SectionLabel>
            <div className="space-y-3 text-sm font-sans">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Method</span>
                <PaymentBadge
                  paymentMethod={order.paymentMethod}
                  paymentStatus={order.paymentStatus}
                  totalAmount={order.totalAmount}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status</span>
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
              {order.paymentId && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500 flex-shrink-0">Payment ID</span>
                  <span
                    className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded truncate max-w-[140px]"
                    title={order.paymentId}
                  >
                    {order.paymentId.length > 16
                      ? `${order.paymentId.slice(0, 16)}…`
                      : order.paymentId}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-semibold text-gray-900 tabular-nums">
                  {formatINR(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Order meta card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <SectionLabel>Order Meta</SectionLabel>
            <div className="space-y-2 text-sm font-sans">
              <div>
                <span className="text-gray-500 text-xs block mb-0.5">
                  Order Number
                </span>
                <span className="font-mono text-xs font-semibold text-slate-700">
                  SR{order.orderNumber}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-xs block mb-0.5">
                  Order ID
                </span>
                <span className="font-mono text-xs text-gray-700 break-all">
                  {order.id}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-xs block mb-0.5">
                  Placed
                </span>
                <span className="text-gray-700">
                  {formatDateLong(order.createdAt)}
                </span>
              </div>
              {order.couponCode && (
                <div>
                  <span className="text-gray-500 text-xs block mb-0.5">
                    Coupon Used
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs font-mono font-medium border border-green-200">
                    {order.couponCode}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
