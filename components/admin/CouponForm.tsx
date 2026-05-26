"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const couponFormSchema = z
  .object({
    code: z
      .string()
      .min(3, "Code must be at least 3 characters")
      .max(20, "Code must be at most 20 characters")
      .regex(
        /^[A-Z0-9-]+$/,
        "Only uppercase letters, numbers, and dashes are allowed"
      ),
    discountType: z.enum(["percentage", "flat"]),
    discountValue: z
      .number({ message: "Must be a number" })
      .positive("Must be positive"),
    minOrderAmount: (z.preprocess(
      (v) => (v === "" || v === null || (typeof v === "number" && isNaN(v as number)) ? null : v),
      z.number({ message: "Must be a number" }).positive("Must be positive").nullable()
    ) as unknown) as z.ZodType<number | null>,
    maxUses: (z.preprocess(
      (v) => (v === "" || v === null || (typeof v === "number" && isNaN(v as number)) ? null : v),
      z.number({ message: "Must be a number" }).int("Must be a whole number").positive("Must be positive").nullable()
    ) as unknown) as z.ZodType<number | null>,
    expiresAt: z.string().optional().nullable(),
    isActive: z.boolean(),
  })
  .refine(
    (data) =>
      data.discountType !== "percentage" ||
      (data.discountValue >= 1 && data.discountValue <= 100),
    {
      message: "Percentage discount must be between 1 and 100",
      path: ["discountValue"],
    }
  );

// Manually define to fix z.preprocess type inference in Zod v4
type CouponFormValues = {
  code: string;
  discountType: "flat" | "percentage";
  discountValue: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  expiresAt?: string | null;
  isActive: boolean;
};

// ---------------------------------------------------------------------------
// Coupon type (mirrors Prisma model)
// ---------------------------------------------------------------------------
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
  coupon?: Coupon;
  onSuccess: () => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Helper: format ISO date for <input type="date">
// ---------------------------------------------------------------------------
function toDateInputValue(val: Date | string | null | undefined): string {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Form component
// ---------------------------------------------------------------------------
export function CouponForm({ coupon, onSuccess, onCancel }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!coupon;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema) as Resolver<CouponFormValues>,
    defaultValues: {
      code: coupon?.code ?? "",
      discountType: (coupon?.discountType as "percentage" | "flat") ?? "percentage",
      discountValue: coupon?.discountValue ?? undefined,
      minOrderAmount: coupon?.minOrderAmount ?? null,
      maxUses: coupon?.maxUses ?? null,
      expiresAt: toDateInputValue(coupon?.expiresAt) || null,
      isActive: coupon?.isActive ?? true,
    },
  });

  const discountType = watch("discountType");

  // Auto-uppercase code as user types
  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue("code", e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""), {
      shouldValidate: true,
    });
  }

  async function onSubmit(data: CouponFormValues) {
    setSubmitting(true);
    try {
      const url = isEditing
        ? `/api/admin/coupons/${coupon!.id}`
        : "/api/admin/coupons";
      const method = isEditing ? "PUT" : "POST";

      // Convert empty strings to null for optional fields
      const payload = {
        ...data,
        minOrderAmount: data.minOrderAmount || null,
        maxUses: data.maxUses || null,
        expiresAt: data.expiresAt || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Something went wrong");
        return;
      }

      toast.success(
        isEditing ? `Coupon "${data.code}" updated` : `Coupon "${data.code}" created`
      );
      onSuccess();
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Row 1: Code + Discount Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Code */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Coupon Code <span className="text-red-500">*</span>
          </label>
          <input
            {...register("code")}
            onChange={handleCodeChange}
            placeholder="e.g. WELCOME20"
            maxLength={20}
            className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-slate-900 bg-white font-mono uppercase placeholder:normal-case placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
          {errors.code && (
            <p className="text-xs text-red-500">{errors.code.message}</p>
          )}
        </div>

        {/* Discount Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Discount Type <span className="text-red-500">*</span>
          </label>
          <select
            {...register("discountType")}
            className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors cursor-pointer"
          >
            <option value="percentage">Percentage (%)</option>
            <option value="flat">Flat Amount (₹)</option>
          </select>
          {errors.discountType && (
            <p className="text-xs text-red-500">{errors.discountType.message}</p>
          )}
        </div>
      </div>

      {/* Row 2: Discount Value + Min Order */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Discount Value */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Discount Value{" "}
            <span className="text-slate-400 normal-case font-normal">
              ({discountType === "percentage" ? "1–100 %" : "₹ amount"})
            </span>
            <span className="text-red-500"> *</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">
              {discountType === "percentage" ? "%" : "₹"}
            </span>
            <input
              {...register("discountValue", { valueAsNumber: true })}
              type="number"
              min={discountType === "percentage" ? 1 : 0.01}
              max={discountType === "percentage" ? 100 : undefined}
              step="0.01"
              placeholder={discountType === "percentage" ? "e.g. 15" : "e.g. 200"}
              className="h-9 pl-8 pr-3 w-full rounded-lg border border-gray-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
          {errors.discountValue && (
            <p className="text-xs text-red-500">{errors.discountValue.message}</p>
          )}
        </div>

        {/* Min Order Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Min Order Amount{" "}
            <span className="text-slate-400 normal-case font-normal">(optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">
              ₹
            </span>
            <input
              {...register("minOrderAmount", { valueAsNumber: true })}
              type="number"
              min={0.01}
              step="0.01"
              placeholder="e.g. 500"
              className="h-9 pl-8 pr-3 w-full rounded-lg border border-gray-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
          {errors.minOrderAmount && (
            <p className="text-xs text-red-500">{errors.minOrderAmount.message}</p>
          )}
        </div>
      </div>

      {/* Row 3: Max Uses + Expires At */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Max Uses */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Max Uses{" "}
            <span className="text-slate-400 normal-case font-normal">(optional — leave blank for unlimited)</span>
          </label>
          <input
            {...register("maxUses", { valueAsNumber: true })}
            type="number"
            min={1}
            step={1}
            placeholder="e.g. 100"
            className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
          {errors.maxUses && (
            <p className="text-xs text-red-500">{errors.maxUses.message}</p>
          )}
        </div>

        {/* Expires At */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Expires At{" "}
            <span className="text-slate-400 normal-case font-normal">(optional)</span>
          </label>
          <input
            {...register("expiresAt")}
            type="date"
            className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors cursor-pointer"
          />
          {errors.expiresAt && (
            <p className="text-xs text-red-500">{errors.expiresAt.message}</p>
          )}
        </div>
      </div>

      {/* Is Active toggle */}
      <div className="flex items-center gap-3 pt-1">
        <input
          {...register("isActive")}
          type="checkbox"
          id="isActive"
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
        />
        <label
          htmlFor="isActive"
          className="text-sm font-medium text-slate-700 cursor-pointer select-none"
        >
          Active — coupon can be used at checkout
        </label>
      </div>

      {/* Submit / Cancel */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 px-5 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting
            ? isEditing
              ? "Saving…"
              : "Creating…"
            : isEditing
              ? "Save Changes"
              : "Create Coupon"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 px-5 h-9 rounded-lg border border-gray-200 text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors disabled:opacity-60 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
