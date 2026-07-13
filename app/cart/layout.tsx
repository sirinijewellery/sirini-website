import type { Metadata } from "next";

// Title is brand-free — the root layout's title.template appends the brand.
export const metadata: Metadata = {
  title: "Your Cart",
  robots: { index: false, follow: false },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
