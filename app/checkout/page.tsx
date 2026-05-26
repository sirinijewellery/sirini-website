import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout — Sirini Jewellery",
  description: "Complete your purchase securely.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/checkout");
  }

  const addresses = session.user.id
    ? await prisma.address.findMany({
        where: { userId: session.user.id },
        orderBy: { isDefault: "desc" },
      })
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-4xl font-light text-foreground mb-10">
        Checkout
      </h1>
      <CheckoutForm savedAddresses={addresses} />
    </div>
  );
}
