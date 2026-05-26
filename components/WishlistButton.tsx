"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface WishlistButtonProps {
  productId: string;
}

export function WishlistButton({ productId }: WishlistButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    fetch(`/api/wishlist/check?productId=${productId}`)
      .then((r) => r.json())
      .then((d: { wishlisted: boolean }) => setIsWishlisted(d.wishlisted))
      .catch(() => {});
  }, [productId, session?.user?.id]);

  async function toggle() {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/shop`);
      return;
    }

    setLoading(true);
    try {
      const method = isWishlisted ? "DELETE" : "POST";
      const res = await fetch("/api/wishlist", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (res.ok) {
        setIsWishlisted(!isWishlisted);
        toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={`p-3 rounded-full border transition-colors ${
        isWishlisted
          ? "bg-primary/10 border-primary text-primary"
          : "border-border text-muted-foreground hover:text-primary hover:border-primary"
      }`}
    >
      <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
    </button>
  );
}
