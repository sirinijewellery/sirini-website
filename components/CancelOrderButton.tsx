"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { XCircleIcon } from "lucide-react";

interface CancelOrderButtonProps {
  orderId: string;
}

export default function CancelOrderButton({ orderId }: CancelOrderButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (loading) return;

    const confirmed = window.confirm(
      "Cancel this order? This cannot be undone."
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to cancel order");
      }

      toast.success("Order cancelled");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 font-sans text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <XCircleIcon className="h-3.5 w-3.5" />
      {loading ? "Cancelling…" : "Cancel order"}
    </button>
  );
}
