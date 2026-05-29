import { ShieldCheck, Truck, RefreshCw, Lock } from "lucide-react";

const trustItems = [
  {
    Icon: ShieldCheck,
    title: "Genuine Materials",
    sub: "100% authentic Kundan & Meenakari",
  },
  {
    Icon: Truck,
    title: "Free Shipping",
    sub: "Pan-India on all orders",
  },
  {
    Icon: RefreshCw,
    title: "Easy Exchange",
    sub: "7-day hassle-free exchange",
  },
  {
    Icon: Lock,
    title: "Secure Payments",
    sub: "UPI, Cards, COD accepted",
  },
];

export function TrustStrip() {
  return (
    <section className="py-8 px-4 md:px-16 bg-surface-container-low border-y border-outline-variant/30">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-screen-2xl mx-auto">
        {trustItems.map(({ Icon, title, sub }) => (
          <div key={title} className="flex items-start md:items-center gap-3">
            <Icon className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
            <div>
              <p className="font-label-caps text-label-caps font-semibold text-on-surface">
                {title}
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {sub}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
