import { Shield, Truck, RotateCcw, Gem } from "lucide-react";

const signals = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On orders above ₹999",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description: "Powered by Razorpay",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "7-day return policy",
  },
  {
    icon: Gem,
    title: "Genuine Materials",
    description: "Quality guaranteed",
  },
];

export function TrustSignals() {
  return (
    <section className="border-y border-border py-8 md:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {signals.map((signal) => (
            <div key={signal.title} className="flex flex-col items-center text-center gap-2">
              <signal.icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
              <div>
                <p className="font-sans text-sm font-semibold text-foreground">{signal.title}</p>
                <p className="font-sans text-xs text-muted-foreground mt-0.5">{signal.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
