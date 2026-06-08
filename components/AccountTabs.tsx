"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBagIcon, MapPinIcon, ChevronRightIcon } from "lucide-react";
import AddressManager from "@/components/AddressManager";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Address {
  id: string;
  userId: string;
  label: string | null;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface OrderItem {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  product: { name: string; slug: string; images: unknown } | null;
}

interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  totalAmount: number;
  discountAmount: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: Date | string;
  items: OrderItem[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
});

function formatDate(dateStr: Date | string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  processing: { bg: "bg-amber-50", text: "text-amber-700", label: "Processing" },
  shipped:    { bg: "bg-blue-50",  text: "text-blue-700",  label: "Shipped"    },
  delivered:  { bg: "bg-green-50", text: "text-green-700", label: "Delivered"  },
  cancelled:  { bg: "bg-red-50",   text: "text-red-600",   label: "Cancelled"  },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status.toLowerCase()] ?? {
    bg: "bg-muted",
    text: "text-muted-foreground",
    label: status,
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-sans text-[11px] font-medium uppercase tracking-wide ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}

// ── Order Card ─────────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="group block rounded-xl border border-border bg-card p-5 hover:shadow-md hover:border-primary/30 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {/* Order ID */}
          <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-primary mb-1">
            Order SR{order.orderNumber}
          </p>
          {/* Date */}
          <p className="font-sans text-xs text-muted-foreground mb-3">
            {formatDate(order.createdAt)}
          </p>
          {/* Status */}
          <StatusBadge status={order.orderStatus} />
        </div>

        {/* Amount + item count */}
        <div className="text-right shrink-0">
          <p className="font-display text-xl font-medium text-foreground">
            {inr.format(order.totalAmount)}
          </p>
          <p className="font-sans text-xs text-muted-foreground mt-0.5">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      {/* View arrow */}
      <div className="flex items-center gap-1 mt-4 text-xs font-sans text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        View order details
        <ChevronRightIcon className="h-3.5 w-3.5" />
      </div>
    </Link>
  );
}

// ── Orders Tab ─────────────────────────────────────────────────────────────────

function OrdersTab({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center">
        <ShoppingBagIcon className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <p className="font-display text-xl text-foreground mb-2">No orders yet</p>
        <p className="font-sans text-sm text-muted-foreground mb-6">
          Discover our handcrafted jewellery collection.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

type Tab = "orders" | "addresses";

export default function AccountTabs({
  orders,
  addresses,
}: {
  orders: Order[];
  addresses: Address[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("orders");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "orders",
      label: "Orders",
      icon: <ShoppingBagIcon className="h-4 w-4" />,
    },
    {
      id: "addresses",
      label: "Addresses",
      icon: <MapPinIcon className="h-4 w-4" />,
    },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative inline-flex items-center gap-2 px-4 pb-3 pt-1 font-sans text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
            {/* Active underline — rose gold slide indicator */}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "orders" && <OrdersTab orders={orders} />}
      {activeTab === "addresses" && (
        <AddressManager initialAddresses={addresses} />
      )}
    </div>
  );
}
