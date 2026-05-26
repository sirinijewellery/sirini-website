"use client";

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

export function VariantSelector({ variants, selectedVariantId, onSelect }: VariantSelectorProps) {
  const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean) as string[]));
  const colours = Array.from(new Set(variants.map((v) => v.colour).filter(Boolean) as string[]));

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const selectedSize = selectedVariant?.size ?? null;
  const selectedColour = selectedVariant?.colour ?? null;

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
      {/* Size selector */}
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
                  onClick={() => inStock && handleSizeSelect(size)}
                  disabled={!inStock}
                  className={`px-3 py-1.5 text-sm font-sans border rounded-lg transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : inStock
                      ? "border-border text-foreground hover:border-primary"
                      : "border-border text-muted-foreground opacity-40 cursor-not-allowed line-through"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Colour selector */}
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
          <div className="flex flex-wrap gap-2">
            {colours.map((colour) => {
              const inStock = isVariantInStock(selectedSize, colour);
              const isSelected = selectedColour === colour;
              return (
                <button
                  key={colour}
                  onClick={() => inStock && handleColourSelect(colour)}
                  disabled={!inStock}
                  className={`px-3 py-1.5 text-sm font-sans border rounded-lg transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : inStock
                      ? "border-border text-foreground hover:border-primary"
                      : "border-border text-muted-foreground opacity-40 cursor-not-allowed line-through"
                  }`}
                >
                  {colour}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock status */}
      {selectedVariant && (
        <p
          className={`text-xs font-sans ${
            selectedVariant.stockQuantity > 0 ? "text-emerald-600" : "text-destructive"
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
