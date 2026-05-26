"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteProductButtonProps {
  productId: string;
  productName: string;
}

export function DeleteProductButton({ productId, productName }: DeleteProductButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      // Auto-reset confirmation state after 3s if user doesn't act
      setTimeout(() => setConfirming(false), 3000);
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Failed to delete product");
        return;
      }

      toast.success(`"${productName}" deleted`);
      router.refresh();
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setIsDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleDelete}
      disabled={isDeleting}
      aria-label={confirming ? `Confirm delete ${productName}` : `Delete ${productName}`}
      className={
        confirming
          ? "text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600"
          : "text-gray-400 hover:text-red-500 hover:bg-red-50"
      }
      title={confirming ? "Click again to confirm" : "Delete product"}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
