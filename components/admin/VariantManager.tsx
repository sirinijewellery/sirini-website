"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface Variant {
  id?: string;
  size?: string;
  colour?: string;
  stockQuantity: number;
}

interface VariantManagerProps {
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
  error?: string;
}

export function VariantManager({ variants, onChange, error }: VariantManagerProps) {
  function addVariant() {
    onChange([...variants, { size: "", colour: "", stockQuantity: 0 }]);
  }

  function removeVariant(index: number) {
    onChange(variants.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, field: keyof Variant, value: string | number) {
    const next = variants.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    );
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {variants.length > 0 ? (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_100px_40px] gap-0 bg-gray-50 border-b border-gray-200">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Size
            </div>
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Colour
            </div>
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Stock
            </div>
            <div className="px-3 py-2" aria-hidden="true" />
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {variants.map((variant, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_1fr_100px_40px] items-center gap-0"
              >
                <div className="px-2 py-2">
                  <Input
                    type="text"
                    placeholder="e.g. M, L, XL"
                    value={variant.size ?? ""}
                    onChange={(e) => updateVariant(index, "size", e.target.value)}
                    className="h-7 text-sm border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-ring/50 rounded-md px-2"
                    aria-label={`Variant ${index + 1} size`}
                  />
                </div>
                <div className="px-2 py-2">
                  <Input
                    type="text"
                    placeholder="e.g. Gold, Silver"
                    value={variant.colour ?? ""}
                    onChange={(e) => updateVariant(index, "colour", e.target.value)}
                    className="h-7 text-sm border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-ring/50 rounded-md px-2"
                    aria-label={`Variant ${index + 1} colour`}
                  />
                </div>
                <div className="px-2 py-2">
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    placeholder="0"
                    value={variant.stockQuantity}
                    onChange={(e) =>
                      updateVariant(index, "stockQuantity", Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="h-7 text-sm border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-ring/50 rounded-md px-2"
                    aria-label={`Variant ${index + 1} stock quantity`}
                  />
                </div>
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                    aria-label={`Remove variant ${index + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex h-20 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400">
          No variants yet — add at least one.
        </div>
      )}

      {error && (
        <p className="text-xs font-medium text-destructive">{error}</p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addVariant}
        className="gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Variant
      </Button>
    </div>
  );
}
