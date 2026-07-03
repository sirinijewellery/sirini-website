import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Order Confirmed — Sirini Jewellery",
  description: "Your order has been placed successfully.",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ orderId?: string }>;
}

function formatINR(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(price);
}

export default async function OrderConfirmationPage({ searchParams }: Props) {
  const { orderId } = await searchParams;

  if (!orderId) notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) notFound();

  // Orders placed by a signed-in account are only visible to that account
  // (or an admin). Guest orders (userId null) remain reachable by their
  // unguessable cuid link — the confirmation page must work without login.
  if (order.userId) {
    const session = await auth();
    if (session?.user?.id !== order.userId && !session?.user?.isAdmin) {
      notFound();
    }
  }

  const address = order.shippingAddress as {
    line1: string;
    city: string;
    state: string;
    pincode: string;
    label?: string;
  };

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Success header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-4xl font-light text-foreground">
            Order Confirmed!
          </h1>
          <p className="font-sans text-muted-foreground mt-2 text-sm">
            Thank you for shopping with Sirini Jewellery. We&apos;ll keep you updated.
          </p>
        </div>

        {/* Order ID box */}
        <div className="bg-cream-dark rounded-xl border border-border px-6 py-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
              Order Reference
            </p>
            <p className="font-display font-semibold text-foreground text-lg tracking-wide">
              #SR{order.orderNumber}
            </p>
          </div>
          <div className="text-right">
            <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
              Placed on
            </p>
            <p className="font-sans text-sm text-foreground">
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Main card */}
        <div className="rounded-xl border border-border bg-card overflow-hidden mb-8">

          {/* Items */}
          <div className="p-6 space-y-5">
            <h2 className="font-display text-xl font-light text-foreground">Items Ordered</h2>
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 items-start">
                {/* Product image */}
                {item.product && (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                    {(() => {
                      const images = item.product.images as string[];
                      const src = Array.isArray(images) ? images[0] : null;
                      return src ? (
                        <Image
                          src={src}
                          alt={item.product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      );
                    })()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm font-medium text-foreground leading-snug">
                    {item.product?.name ?? "Product"}
                  </p>
                  <p className="font-sans text-xs text-muted-foreground mt-0.5">
                    Qty: {item.quantity}
                  </p>
                </div>

                <span className="font-sans text-sm font-medium text-foreground shrink-0">
                  {formatINR(item.priceAtPurchase * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Pricing */}
          <div className="p-6 space-y-2">
            {order.discountAmount > 0 && (
              <>
                <div className="flex justify-between font-sans text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatINR(order.totalAmount + order.discountAmount)}</span>
                </div>
                <div className="flex justify-between font-sans text-sm text-emerald-600">
                  <span>
                    Discount{order.couponCode ? ` (${order.couponCode})` : ""}
                  </span>
                  <span>− {formatINR(order.discountAmount)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-sans text-sm text-muted-foreground">
              <span>Shipping</span>
              <span className="text-emerald-600">Free</span>
            </div>
            <div className="flex justify-between font-sans font-semibold text-foreground pt-1">
              <span>Total Paid</span>
              <span className="font-display text-xl text-primary">{formatINR(order.totalAmount)}</span>
            </div>
          </div>

          <Separator />

          {/* Shipping address */}
          <div className="p-6">
            <h3 className="font-sans text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Delivering to
            </h3>
            <p className="font-sans text-sm text-foreground font-medium">{order.customerName}</p>
            <p className="font-sans text-sm text-muted-foreground">
              {address.line1}, {address.city}, {address.state} — {address.pincode}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-3">
          <Link href="/shop">
            <Button size="lg" className="px-10">
              Continue Shopping
            </Button>
          </Link>
          <p className="font-sans text-xs text-muted-foreground">
            Questions? Email us at{" "}
            <a
              href="mailto:sirinijewellery@gmail.com"
              className="text-primary hover:underline"
            >
              sirinijewellery@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
