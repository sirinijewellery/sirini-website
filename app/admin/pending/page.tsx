import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList } from "lucide-react";
import { getPendingItems } from "@/lib/queries/pending";

export const metadata: Metadata = { title: "Pending" };

export default async function AdminPendingPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login?callbackUrl=/admin/pending");

  const items = await getPendingItems();
  const open = items.filter((item) => item.count > 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl space-y-6">
      {/* Heading */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
          <ClipboardList className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="font-sans text-2xl font-semibold text-slate-900">
            Pending
          </h1>
          <p className="font-sans text-sm text-slate-500 mt-1">
            Catalogue chores left to do while you finish tagging your products.
          </p>
        </div>
      </div>

      {open.length === 0 ? (
        /* ── Empty state ── */
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="font-sans text-lg font-semibold text-slate-900">
            All caught up
          </h2>
          <p className="font-sans text-sm text-slate-500 mt-1 max-w-sm">
            Every product is tagged and every term has a cover image. Nothing
            needs your attention right now.
          </p>
        </div>
      ) : (
        /* ── Checklist ── */
        <div className="space-y-3">
          {open.map((item) => (
            <div
              key={item.key}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <span className="inline-flex items-center justify-center min-w-[2.5rem] h-10 px-2 rounded-lg bg-amber-50 text-amber-700 font-sans text-base font-semibold shrink-0">
                {item.count}
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="font-sans text-sm font-semibold text-slate-900">
                  {item.label}
                </h2>
                <p className="font-sans text-sm text-slate-500 mt-0.5">
                  {item.description}
                </p>
              </div>
              <Link
                href={item.href}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white font-sans text-sm font-medium hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                Fix
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
