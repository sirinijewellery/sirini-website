"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag, X } from "lucide-react";

interface CouponResult {
  code: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  discountAmount: number;
}

interface CouponFieldProps {
  subtotal: number;
  onApply: (coupon: CouponResult | null) => void;
  appliedCoupon: CouponResult | null;
}

export function CouponField({ subtotal, onApply, appliedCoupon }: CouponFieldProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleApply() {
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/coupon/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase(), orderAmount: subtotal }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid coupon code");
        return;
      }

      onApply(data);
      setCode("");
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-sans font-medium text-emerald-700">{appliedCoupon.code}</span>
          <span className="text-xs text-emerald-600 font-sans">
            ({appliedCoupon.discountType === "percentage"
              ? `${appliedCoupon.discountValue}% off`
              : `₹${appliedCoupon.discountValue} off`})
          </span>
        </div>
        <button
          onClick={() => onApply(null)}
          className="text-emerald-600 hover:text-emerald-800 transition-colors"
          aria-label="Remove coupon"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter coupon code"
          className="font-sans text-sm uppercase tracking-wider"
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
        />
        <Button
          variant="outline"
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="shrink-0"
        >
          {loading ? "…" : "Apply"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive font-sans">{error}</p>}
    </div>
  );
}
