"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { CommerceSettings } from "@/lib/commerce/pricing";

// Setting keys mirror getCommerceSettings() in lib/queries/commerce.ts.
// (Inlined here so this client file never imports the server query module.)
const KEYS = {
  gstRate: "commerce.gstRate",
  giftWrapFee: "commerce.giftWrapFee",
  shippingFee: "commerce.shippingFee",
  freeShipThreshold: "commerce.freeShipThreshold",
  codEnabled: "commerce.codEnabled",
  codMaxOrder: "commerce.codMaxOrder",
} as const;

function Field({
  label,
  help,
  prefix,
  suffix,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  prefix?: string;
  suffix?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-700">{label}</span>
      <span className="mt-1 flex items-center rounded-lg border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
        {prefix && <span className="pl-3 text-sm text-slate-400">{prefix}</span>}
        <input
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 focus:outline-none"
        />
        {suffix && <span className="pr-3 text-sm text-slate-400">{suffix}</span>}
      </span>
      {help && <span className="text-[11px] text-slate-400 mt-0.5 block">{help}</span>}
    </label>
  );
}

export function CommerceSettingsManager({ initial }: { initial: CommerceSettings }) {
  const [gstPercent, setGstPercent] = useState(
    String(Math.round(initial.gstRate * 10000) / 100)
  );
  const [giftWrapFee, setGiftWrapFee] = useState(String(initial.giftWrapFee));
  const [shippingFee, setShippingFee] = useState(String(initial.shippingFee));
  const [freeShipThreshold, setFreeShipThreshold] = useState(
    String(initial.freeShipThreshold)
  );
  const [codEnabled, setCodEnabled] = useState(initial.codEnabled);
  const [codMaxOrder, setCodMaxOrder] = useState(String(initial.codMaxOrder));
  const [saving, setSaving] = useState(false);

  async function save() {
    const gstRate = Number(gstPercent) / 100;
    const numbers: [string, number][] = [
      [KEYS.gstRate, gstRate],
      [KEYS.giftWrapFee, Number(giftWrapFee)],
      [KEYS.shippingFee, Number(shippingFee)],
      [KEYS.freeShipThreshold, Number(freeShipThreshold)],
      [KEYS.codMaxOrder, Number(codMaxOrder)],
    ];
    for (const [, v] of numbers) {
      if (!Number.isFinite(v) || v < 0) {
        toast.error("Please enter valid, non-negative numbers");
        return;
      }
    }
    if (gstRate > 1) {
      toast.error("GST % looks too high — enter a percentage like 3, not 300");
      return;
    }

    const updates: [string, number | boolean][] = [
      ...numbers,
      [KEYS.codEnabled, codEnabled],
    ];

    setSaving(true);
    try {
      const results = await Promise.all(
        updates.map(([key, value]) =>
          fetch("/api/admin/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, value }),
          })
        )
      );
      const bad = results.find((r) => !r.ok);
      if (bad) throw new Error((await bad.json()).error || "Failed to save");
      toast.success("Pricing & shipping saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* GST */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Tax (GST)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Applied to the order subtotal after any discount. Shown to customers at
            checkout.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="GST rate"
            suffix="%"
            help="e.g. 3 for 3%. Set 0 to remove GST."
            value={gstPercent}
            onChange={setGstPercent}
          />
        </div>
      </div>

      {/* Gift wrap */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Gift wrapping</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Optional add-on the customer can tick at checkout.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Gift-wrap fee"
            prefix="₹"
            help="Set 0 to make gift wrapping free."
            value={giftWrapFee}
            onChange={setGiftWrapFee}
          />
        </div>
      </div>

      {/* Shipping */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Shipping</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Charge a flat shipping fee, with optional free shipping above a cart
            value. Leave both at 0 to keep shipping free for everyone.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Shipping fee"
            prefix="₹"
            help="Charged when the order is below the free-shipping threshold."
            value={shippingFee}
            onChange={setShippingFee}
          />
          <Field
            label="Free shipping above"
            prefix="₹"
            help="Order value at/above which shipping is free. 0 = always free."
            value={freeShipThreshold}
            onChange={setFreeShipThreshold}
          />
        </div>
      </div>

      {/* Cash on Delivery */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Cash on Delivery</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Control whether customers can pay in cash on delivery.
          </p>
        </div>
        <label className="flex items-center gap-3 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={codEnabled}
            onChange={(e) => setCodEnabled(e.target.checked)}
            className="h-4 w-4 accent-primary cursor-pointer"
          />
          <span className="text-sm text-slate-700">Offer Cash on Delivery</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="COD limit"
            prefix="₹"
            help="Hide COD for orders above this total. 0 = no limit."
            value={codMaxOrder}
            onChange={setCodMaxOrder}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
