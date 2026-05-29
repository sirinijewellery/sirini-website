import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RecentlyViewedItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;      // first image URL
  category: string;
}

interface RecentlyViewedStore {
  items: RecentlyViewedItem[];
  addItem: (item: RecentlyViewedItem) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          // Remove existing entry if present, prepend new one, cap at 6
          const filtered = state.items.filter((i) => i.id !== item.id);
          return { items: [item, ...filtered].slice(0, 6) };
        }),
      clear: () => set({ items: [] }),
    }),
    { name: "sirini-recently-viewed" }
  )
);
