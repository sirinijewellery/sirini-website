import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HeroManager, type HeroSlide } from "@/components/admin/HeroManager";

export const metadata = { title: "Hero Section" };

export default async function AdminHeroPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login?callbackUrl=/admin/hero");

  const slides = await prisma.heroSlide.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true, imageUrl: true, mobileImageUrl: true,
      focalDesktop: true, focalMobile: true, order: true, isActive: true,
    },
  });
  const durationRow = await prisma.setting.findUnique({ where: { key: "hero.durationMs" } });
  const durationMs = (durationRow?.value as number) ?? 6000;

  return (
    <div className="p-4 md:p-10 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Hero Section</h1>
        <p className="text-sm text-slate-500 mt-1">
          The big images at the top of your home page. Add multiple to rotate them, set how each is cropped per device, and choose the speed.
        </p>
      </div>
      <HeroManager initialSlides={slides as HeroSlide[]} initialDurationMs={durationMs} />
    </div>
  );
}
