"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   VariantSelector — Sirini Jewellery
   · Colour / finish  → 28 px circular swatches with gold ring selection state
   · Size             → sharp rectangular chips (no border-radius), refined touch targets
   · Out-of-stock     → diagonal strike across swatch or chip, opacity-40
───────────────────────────────────────────────────────────────────────────── */

interface Variant {
  id: string;
  size: string | null;
  colour: string | null;
  stockQuantity: number;
}

interface VariantSelectorProps {
  variants: Variant[];
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
}

// ── Colour map ──────────────────────────────────────────────────────────────
const COLOUR_MAP: Record<string, string> = {
  "gold": "#C9A96E",
  "gold plated": "#C9A96E",
  "rose gold": "#B76E79",
  "rose gold plated": "#B76E79",
  "silver": "#C0C0C0",
  "silver plated": "#C0C0C0",
  "antique gold": "#8B6B2E",
  "oxidised": "#696969",
  "oxidized": "#696969",
  "white": "#F0EBE3",
  "black": "#3C3C3C",
  "red": "#C0392B",
  "green": "#2D6A4F",
  "blue": "#1A5276",
  "pink": "#E8A0B4",
  "purple": "#7D3C98",
};

function getColourHex(name: string): string | null {
  return COLOUR_MAP[name.toLowerCase()] ?? null;
}

// ── Component ────────────────────────────────────────────────────────────────
export function VariantSelector({ variants, selectedVariantId, onSelect }: VariantSelectorProps) {
  const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean) as string[]));
  const colours = Array.from(new Set(variants.map((v) => v.colour).filter(Boolean) as string[]));

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const selectedSize = selectedVariant?.size ?? null;
  const selectedColour = selectedVariant?.colour ?? null;

  // ── Logic (unchanged) ──────────────────────────────────────────────────────
  function getVariantByAttrs(size: string | null, colour: string | null) {
    return variants.find((v) => v.size === size && v.colour === colour) ?? null;
  }

  function handleSizeSelect(size: string) {
    const match =
      getVariantByAttrs(size, selectedColour) ??
      variants.find((v) => v.size === size);
    if (match) onSelect(match.id);
  }

  function handleColourSelect(colour: string) {
    const match =
      getVariantByAttrs(selectedSize, colour) ??
      variants.find((v) => v.colour === colour);
    if (match) onSelect(match.id);
  }

  function isVariantInStock(size: string | null, colour: string | null) {
    const v = getVariantByAttrs(size, colour);
    return v ? v.stockQuantity > 0 : false;
  }

  return (
    <div className="space-y-4">

      {/* ── Size selector — sharp rectangular chips ─────────────────────────── */}
      {sizes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
            Size{" "}
            {selectedSize && (
              <span className="text-foreground normal-case tracking-normal">
                — {selectedSize}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const inStock = isVariantInStock(size, selectedColour);
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => inStock && handleSizeSelect(size)}
                  disabled={!inStock}
                  className={`relative min-w-[40px] px-3 py-2 text-[11px] font-sans font-medium tracking-wide border transition-all duration-200 ${
                    isSelected
                      ? "border-primary bg-primary text-on-primary"
                      : inStock
                      ? "border-outline-variant text-on-surface hover:border-primary hover:text-primary cursor-pointer"
                      : "border-outline-variant text-on-surface-variant opacity-40 cursor-not-allowed"
                  }`}
                >
                  {size}
                  {/* Diagonal strike for out-of-stock */}
                  {!inStock && (
                    <span
                      className="absolute inset-0 overflow-hidden pointer-events-none"
                      aria-hidden="true"
                    >
                      <span className="absolute top-1/2 left-0 w-full h-px bg-on-surface-variant/40 rotate-[-20deg]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Colour / finish selector — circular swatches ────────────────────── */}
      {colours.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
            Finish{" "}
            {selectedColour && (
              <span className="text-foreground normal-case tracking-normal">
                — {selectedColour}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            {colours.map((colour) => {
              const inStock = isVariantInStock(selectedSize, colour);
              const isSelected = selectedColour === colour;
              const hex = getColourHex(colour);

              return (
                <button
                  key={colour}
                  type="button"
                  onClick={() => inStock && handleColourSelect(colour)}
                  disabled={!inStock}
                  title={colour}
                  aria-label={`${colour}${!inStock ? " — out of stock" : ""}`}
                  className={`relative w-7 h-7 rounded-full transition-all duration-200 cursor-pointer disabled:cursor-not-allowed shrink-0 ${
                    isSelected
                      ? "ring-2 ring-offset-2 ring-[#C9A96E]"
                      : inStock
                      ? "hover:ring-2 hover:ring-offset-1 hover:ring-outline-variant"
                      : "opacity-40"
                  }`}
                  style={hex ? { backgroundColor: hex } : undefined}
                >
                  {/* Text initial fallback when no colour map entry exists */}
                  {!hex && (
                    <span
                      className={`absolute inset-0 flex items-center justify-center text-[10px] font-sans rounded-full border ${
                        isSelected
                          ? "border-primary bg-primary text-on-primary"
                          : "border-border text-on-surface"
                      }`}
                    >
                      {colour.charAt(0).toUpperCase()}
                    </span>
                  )}
                  {/* Diagonal strike for out-of-stock */}
                  {!inStock && (
                    <span
                      className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
                      aria-hidden="true"
                    >
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="block w-full h-px bg-on-surface-variant/50 rotate-45" />
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Stock status ─────────────────────────────────────────────────────── */}
      {selectedVariant && (
        <p
          className={`text-xs font-sans ${
            selectedVariant.stockQuantity > 0 ? "text-success-emerald" : "text-destructive"
          }`}
        >
          {selectedVariant.stockQuantity > 0
            ? selectedVariant.stockQuantity <= 5
              ? `Only ${selectedVariant.stockQuantity} left in stock`
              : "In Stock"
            : "Out of Stock"}
        </p>
      )}
    </div>
  );
}
