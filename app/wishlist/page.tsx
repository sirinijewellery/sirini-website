import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { getWishlistItems } from "@/lib/queries/wishlist";
import { WishlistItemCard } from "@/components/WishlistItemCard";

export const metadata: Metadata = {
  title: "My Wishlist | Sirini Jewellery",
  robots: { index: false },
};

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/wishlist");
  }

  const wishlistItems = await getWishlistItems(session.user.id);
  const count = wishlistItems.length;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

        {/* Page header */}
        <header className="mb-10">
          <h1 className="font-display text-4xl sm:text-5xl font-light text-foreground tracking-tight">
            My Wishlist
          </h1>
          {count > 0 && (
            <p className="mt-2 text-sm font-sans text-muted-foreground">
              {count} {count === 1 ? "piece" : "pieces"} saved
            </p>
          )}
        </header>

        {/* Empty state */}
        {count === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-5">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blush">
              <Heart
                className="w-7 h-7 text-primary"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-display text-2xl font-light text-foreground">
                Your wishlist is empty
              </h2>
              <p className="font-sans text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Save pieces you love and come back to them anytime.
              </p>
            </div>
            <Link
              href="/shop"
              className="mt-2 inline-block font-sans text-sm font-medium px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-rose-gold-dark transition-colors duration-150 cursor-pointer"
            >
              Explore the Collection
            </Link>
          </div>
        ) : (
          /* Product grid */
          <section aria-label="Wishlist items">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {wishlistItems.map((item) => (
                <WishlistItemCard key={item.id} item={item} />
              ))}
            </div>

            {/* Continue shopping nudge */}
            <div className="mt-14 pt-10 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-display text-lg font-light text-foreground">
                  Looking for something else?
                </p>
                <p className="font-sans text-sm text-muted-foreground mt-0.5">
                  Browse our full collection for more pieces you'll love.
                </p>
              </div>
              <Link
                href="/shop"
                className="shrink-0 font-sans text-sm font-medium px-5 py-2.5 rounded-lg border border-border text-foreground hover:border-primary hover:text-primary transition-colors duration-150 cursor-pointer"
              >
                Continue Shopping
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
