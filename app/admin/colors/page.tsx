import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ColorsClient } from "@/components/admin/ColorsClient";

export const metadata = { title: "Colours" };

export default async function AdminColorsPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login?callbackUrl=/admin/colors");

  const group = await prisma.taxonomyGroup.findFirst({
    where: { slug: "colour" },
    select: {
      id: true,
      label: true,
      terms: {
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
        select: {
          id: true,
          label: true,
          slug: true,
          hexColor: true,
          sortOrder: true,
          showInMenu: true,
          _count: { select: { products: true } },
        },
      },
    },
  });

  return (
    <div className="p-4 md:p-10 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Colours</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage colour terms, set their hex codes, and see how many products
          are tagged with each colour.
        </p>
      </div>
      <ColorsClient
        groupId={group?.id ?? ""}
        initialTerms={(group?.terms ?? []).map((t) => ({
          id: t.id,
          label: t.label,
          slug: t.slug,
          hexColor: t.hexColor,
          sortOrder: t.sortOrder,
          showInMenu: t.showInMenu,
          productCount: t._count.products,
        }))}
      />
    </div>
  );
}
