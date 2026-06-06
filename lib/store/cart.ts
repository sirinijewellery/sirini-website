import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  image: string;
  category?: string;
  size?: string;
  colour?: string;
  quantity: number;
}

export interface CouponResult {
  code: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  discountAmount: number;
}

interface CartStore {
  items: CartItem[];
  appliedCoupon: CouponResult | null;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  setCoupon: (coupon: CouponResult | null) => void;
  // Drawer state — transient, not persisted
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

function isSameItem(a: CartItem, b: { productId: string; variantId?: string }) {
  return a.productId === b.productId && a.variantId === b.variantId;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,

      addItem: (newItem) =>
        set((state) => {
          const existing = state.items.find((i) => isSameItem(i, newItem));
          if (existing) {
            return {
              items: state.items.map((i) =>
                isSameItem(i, newItem)
                  ? { ...i, quantity: i.quantity + newItem.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, newItem] };
        }),

      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter((i) => !isSameItem(i, { productId, variantId })),
        })),

      updateQuantity: (productId, variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => !isSameItem(i, { productId, variantId }))
              : state.items.map((i) =>
                  isSameItem(i, { productId, variantId }) ? { ...i, quantity } : i
                ),
        })),

      clearCart: () => set({ items: [], appliedCoupon: null }),

      setCoupon: (coupon) => set({ appliedCoupon: coupon }),

      getTotal: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      // Drawer — transient state, excluded from persistence via partialize
      isDrawerOpen: false,
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
    }),
    {
      name: "sirini-cart",
      partialize: (state) => ({
        items: state.items,
        appliedCoupon: state.appliedCoupon,
      }),
    }
  )
);
