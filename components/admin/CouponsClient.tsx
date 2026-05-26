"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Ticket } from "lucide-react";
import { CouponForm } from "@/components/admin/CouponForm";

interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | string | null;
  isActive: boolean;
  createdAt: Date | string;
}

interface Props {
  initialCoupons: Coupon[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const inr = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);

function formatExpiry(expiresAt: Date | string | null): {
  label: string;
  expired: boolean;
} {
  if (!expiresAt) return { label: "Never", expired: false };
  const d = new Date(expiresAt);
  if (isNaN(d.getTime())) return { label: "—", expired: false };
  const expired = d < new Date();
  return {
    label: new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d),
    expired,
  };
}

// ---------------------------------------------------------------------------
// Active toggle
// ---------------------------------------------------------------------------
function ActiveToggle({
  couponId,
  isActive,
  onToggle,
}: {
  couponId: string;
  isActive: boolean;
  onToggle: (id: string, next: boolean) => void;
}) {
  return (
    <button
      onClick={() => onToggle(couponId, !isActive)}
      role="switch"
      aria-checked={isActive}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
        isActive ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
          isActive ? "translate-x-4" : "translate-x-0"
        }`}
      />
      <span className="sr-only">{isActive ? "Active" : "Inactive"}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function CouponsClient({ initialCoupons }: Props) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ---- Toggle active -------------------------------------------------------
  async function handleToggle(id: string, next: boolean) {
    setTogglingId(id);
    // Optimistic update
    setCoupons((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: next } : c))
    );

    try {
      const coupon = coupons.find((c) => c.id === id)!;
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount,
          maxUses: coupon.maxUses,
          expiresAt: coupon.expiresAt
            ? new Date(coupon.expiresAt as string).toISOString().split("T")[0]
            : null,
          isActive: next,
        }),
      });
      if (!res.ok) {
        // Revert on failure
        setCoupons((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isActive: !next } : c))
        );
        const json = await res.json();
        toast.error(json.error ?? "Failed to update coupon");
      } else {
        toast.success(next ? "Coupon activated" : "Coupon deactivated");
      }
    } catch {
      setCoupons((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: !next } : c))
      );
      toast.error("Network error — please try again");
    } finally {
      setTogglingId(null);
    }
  }

  // ---- Delete --------------------------------------------------------------
  async function handleDelete(coupon: Coupon) {
    if (
      !window.confirm(
        `Delete coupon "${coupon.code}"?\n\nThis cannot be undone. Orders that used this code will not be affected.`
      )
    )
      return;

    setDeletingId(coupon.id);
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Failed to delete coupon");
        return;
      }
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      toast.success(`Coupon "${coupon.code}" deleted`);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setDeletingId(null);
    }
  }

  // ---- Form success --------------------------------------------------------
  async function handleFormSuccess() {
    // Re-fetch fresh list from server
    try {
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data as Coupon[]);
      }
    } catch {
      // ignore — toasts already handled in form
    }
    setIsAdding(false);
    setEditingId(null);
  }

  return (
    <div className="space-y-6">
      {/* Add button */}
      {!isAdding && !editingId && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Coupon
          </button>
        </div>
      )}

      {/* Add form */}
      {isAdding && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-700 mb-4">New Coupon</p>
          <CouponForm
            onSuccess={handleFormSuccess}
            onCancel={() => setIsAdding(false)}
          />
        </div>
      )}

      {/* Edit form */}
      {editingId && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-700 mb-4">
            Editing: {coupons.find((c) => c.id === editingId)?.code}
          </p>
          <CouponForm
            coupon={coupons.find((c) => c.id === editingId)}
            onSuccess={handleFormSuccess}
            onCancel={() => setEditingId(null)}
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <Ticket className="h-8 w-8 opacity-40" />
            <p className="font-sans text-sm">No coupons yet. Create one above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left">
                    Code
                  </th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left hidden sm:table-cell">
                    Type
                  </th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left">
                    Value
                  </th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left hidden md:table-cell">
                    Min Order
                  </th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left hidden lg:table-cell">
                    Uses
                  </th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left hidden lg:table-cell">
                    Expires
                  </th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left">
                    Active
                  </th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupons.map((coupon) => {
                  const expiry = formatExpiry(coupon.expiresAt);
                  const isExpired = expiry.expired;

                  return (
                    <tr
                      key={coupon.id}
                      className="hover:bg-gray-50/70 transition-colors duration-100"
                    >
                      {/* Code */}
                      <td className="px-4 py-3 text-sm">
                        <span className="font-mono font-semibold text-slate-800">
                          {coupon.code}
                        </span>
                        {isExpired && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-50 text-red-600">
                            Expired
                          </span>
                        )}
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3 text-sm hidden sm:table-cell">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            coupon.discountType === "percentage"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {coupon.discountType === "percentage" ? "Percentage" : "Flat"}
                        </span>
                      </td>

                      {/* Value */}
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                        {coupon.discountType === "percentage"
                          ? `${coupon.discountValue}%`
                          : inr(coupon.discountValue)}
                      </td>

                      {/* Min Order */}
                      <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">
                        {coupon.minOrderAmount ? inr(coupon.minOrderAmount) : (
                          <span className="text-slate-400 italic text-xs">None</span>
                        )}
                      </td>

                      {/* Uses */}
                      <td className="px-4 py-3 text-sm text-slate-600 hidden lg:table-cell">
                        <span className="font-mono">
                          {coupon.usedCount}
                          <span className="text-slate-400">
                            {" / "}
                            {coupon.maxUses !== null ? coupon.maxUses : "∞"}
                          </span>
                        </span>
                      </td>

                      {/* Expires */}
                      <td className="px-4 py-3 text-sm hidden lg:table-cell">
                        <span
                          className={
                            isExpired
                              ? "text-red-500 font-medium"
                              : expiry.label === "Never"
                                ? "text-slate-400 italic text-xs"
                                : "text-slate-700"
                          }
                        >
                          {expiry.label}
                        </span>
                      </td>

                      {/* Active toggle */}
                      <td className="px-4 py-3">
                        <div className={togglingId === coupon.id ? "opacity-50 pointer-events-none" : ""}>
                          <ActiveToggle
                            couponId={coupon.id}
                            isActive={coupon.isActive}
                            onToggle={handleToggle}
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setIsAdding(false);
                              setEditingId(editingId === coupon.id ? null : coupon.id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 h-7 rounded border border-gray-200 text-xs font-medium text-slate-600 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
                            aria-label={`Edit ${coupon.code}`}
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(coupon)}
                            disabled={deletingId === coupon.id}
                            className="inline-flex items-center gap-1 px-2.5 h-7 rounded border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50 cursor-pointer"
                            aria-label={`Delete ${coupon.code}`}
                          >
                            <Trash2 className="h-3 w-3" />
                            {deletingId === coupon.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Count */}
      {coupons.length > 0 && (
        <p className="font-sans text-xs text-slate-400">
          {coupons.length} {coupons.length === 1 ? "coupon" : "coupons"} total
          {" · "}
          {coupons.filter((c) => c.isActive).length} active
        </p>
      )}
    </div>
  );
}
