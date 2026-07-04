import { ImageResponse } from "next/og";
import { getProductBySlug } from "@/lib/queries/products";
import { parseImages, selectCardImages } from "@/lib/parseImages";
import { botImageUrl } from "@/lib/cdnImage";
import { formatPrice } from "@/components/PriceDisplay";

// Image metadata
export const alt = "Sirini Jewellery product";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand palette
const CREAM = "#FFF8F5";
const MAROON = "#5C1A24";
const GOLD = "#C9A96E";

function GenericCard() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: MAROON,
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div
          style={{
            display: "flex",
            color: GOLD,
            fontSize: 110,
            fontWeight: 700,
            letterSpacing: 2,
            textAlign: "center",
          }}
        >
          Sirini Jewellery
        </div>
        <div
          style={{
            display: "flex",
            color: CREAM,
            fontSize: 30,
            marginTop: 28,
            letterSpacing: 3,
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          Handcrafted Kundan, Meenakari &amp; Gold-Plated Jewellery
        </div>
      </div>
    ),
    { ...size }
  );
}

// Cream panel content shared by split + full-width layouts
function Panel({
  name,
  price,
  compareAt,
  fullWidth,
}: {
  name: string;
  price: number;
  compareAt: number | null;
  fullWidth: boolean;
}) {
  return (
    <div
      style={{
        width: fullWidth ? "100%" : "50%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: CREAM,
        padding: fullWidth ? "0 110px" : "0 70px",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      {/* Eyebrow */}
      <div
        style={{
          display: "flex",
          color: GOLD,
          fontSize: 24,
          letterSpacing: 7,
          textTransform: "uppercase",
          marginBottom: 28,
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        Sirini Jewellery
      </div>

      {/* Product name */}
      <div
        style={{
          display: "flex",
          color: MAROON,
          fontSize: 64,
          fontWeight: 700,
          lineHeight: 1.12,
          letterSpacing: 1,
        }}
      >
        {name}
      </div>

      {/* Price row */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          marginTop: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            color: MAROON,
            fontSize: 56,
            fontWeight: 700,
          }}
        >
          {formatPrice(price)}
        </div>
        {compareAt && compareAt > price ? (
          <div
            style={{
              display: "flex",
              color: "#9A6A6A",
              fontSize: 34,
              marginLeft: 22,
              textDecoration: "line-through",
            }}
          >
            {formatPrice(compareAt)}
          </div>
        ) : null}
      </div>

      {/* Free shipping */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          color: GOLD,
          fontSize: 26,
          marginTop: 44,
          letterSpacing: 2,
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        Free shipping across India
      </div>
    </div>
  );
}

// Image generation
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let product: Awaited<ReturnType<typeof getProductBySlug>> = null;
  try {
    product = await getProductBySlug(slug);
  } catch {
    product = null;
  }

  if (!product) {
    return GenericCard();
  }

  const primary = selectCardImages(parseImages(product.images)).primary;
  const imageUrl = primary ? botImageUrl(primary) : primary;
  const compareAt = product.compareAtPrice ?? null;

  // No image → cream panel full-width with name + price
  if (!imageUrl) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex" }}>
          <Panel
            name={product.name}
            price={product.price}
            compareAt={compareAt}
            fullWidth
          />
        </div>
      ),
      { ...size }
    );
  }

  // Split layout: image left, cream panel right
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        {/* Left: product image */}
        <div
          style={{
            width: "50%",
            height: "100%",
            display: "flex",
            background: MAROON,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={product.name}
            width={600}
            height={630}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* Right: details */}
        <Panel
          name={product.name}
          price={product.price}
          compareAt={compareAt}
          fullWidth={false}
        />
      </div>
    ),
    { ...size }
  );
}
