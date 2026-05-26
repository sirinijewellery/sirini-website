"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  orderId: string;
  currentStatus: string;
}

const ORDER_STATUSES = [
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number]["value"];

const STATUS_STYLES: Record<
  OrderStatus,
  { badge: string; ring: string; dot: string }
> = {
  processing: {
    badge: "bg-amber-100 text-amber-700",
    ring: "ring-amber-300",
    dot: "bg-amber-400",
  },
  shipped: {
    badge: "bg-blue-100 text-blue-700",
    ring: "ring-blue-300",
    dot: "bg-blue-400",
  },
  delivered: {
    badge: "bg-green-100 text-green-700",
    ring: "ring-green-300",
    dot: "bg-green-400",
  },
  cancelled: {
    badge: "bg-red-100 text-red-600",
    ring: "ring-red-300",
    dot: "bg-red-400",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrderStatusUpdate({ orderId, currentStatus }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<OrderStatus>(
    (currentStatus as OrderStatus) ?? "processing"
  );
  const [loading, setLoading] = useState(false);

  const styles =
    STATUS_STYLES[selected] ?? STATUS_STYLES["processing"];

  async function handleUpdate() {
    if (selected === currentStatus) {
      toast.info("Status is already set to this value.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selected }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to update status");
      }

      toast.success("Order status updated successfully.");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Current status display */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Current Status
        </p>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
            STATUS_STYLES[currentStatus as OrderStatus]?.badge ??
            "bg-gray-100 text-gray-600"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              STATUS_STYLES[currentStatus as OrderStatus]?.dot ?? "bg-gray-400"
            }`}
            aria-hidden="true"
          />
          <span className="capitalize">{currentStatus}</span>
        </span>
      </div>

      {/* Select new status */}
      <div>
        <label
          htmlFor="order-status-select"
          className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block"
        >
          Update Status
        </label>
        <div className="relative">
          <select
            id="order-status-select"
            value={selected}
            onChange={(e) => setSelected(e.target.value as OrderStatus)}
            disabled={loading}
            className={`w-full appearance-none pl-3 pr-8 py-2.5 text-sm font-medium text-gray-800 bg-white border rounded-lg
              focus:outline-none focus:ring-2 transition-all duration-150
              disabled:opacity-60 disabled:cursor-not-allowed
              border-gray-300 ${styles.ring}
              cursor-pointer`}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {/* Chevron icon */}
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={handleUpdate}
        disabled={loading || selected === currentStatus}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white
          bg-slate-800 hover:bg-slate-700 active:bg-slate-900
          disabled:opacity-50 disabled:cursor-not-allowed
          rounded-lg transition-colors duration-150 cursor-pointer"
      >
        {loading ? (
          <>
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Updating…
          </>
        ) : (
          "Update Status"
        )}
      </button>

      {selected === currentStatus && (
        <p className="text-xs text-gray-400 text-center">
          Select a different status to update.
        </p>
      )}
    </div>
  );
}
