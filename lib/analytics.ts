declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

function isClient() {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

export function trackViewItem(product: {
  id: string;
  name: string;
  price: number;
  category: string;
}) {
  if (!isClient()) return;
  window.gtag("event", "view_item", {
    currency: "INR",
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
      },
    ],
  });
}

export function trackAddToCart(product: {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity: number;
}) {
  if (!isClient()) return;
  window.gtag("event", "add_to_cart", {
    currency: "INR",
    value: product.price * product.quantity,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
        quantity: product.quantity,
      },
    ],
  });
}

export function trackCheckoutStarted(total: number) {
  if (!isClient()) return;
  window.gtag("event", "begin_checkout", {
    currency: "INR",
    value: total,
  });
}

export function trackPurchaseCompleted(orderId: string, total: number) {
  if (!isClient()) return;
  window.gtag("event", "purchase", {
    transaction_id: orderId,
    currency: "INR",
    value: total,
  });
}
