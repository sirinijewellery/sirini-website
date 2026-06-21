import {
  ShieldCheck,
  Truck,
  RefreshCw,
  Lock,
  BadgeCheck,
  Gem,
  Heart,
  Award,
  Sparkles,
  Gift,
  type LucideIcon,
} from "lucide-react";
import type { TrustBadge, TrustIconKey } from "@/lib/queries/home";

// Map the owner-selectable icon enum to the actual Lucide components.
// Unknown / missing keys fall back to ShieldCheck so a badge always renders.
const ICONS: Record<TrustIconKey, LucideIcon> = {
  shield: ShieldCheck,
  truck: Truck,
  exchange: RefreshCw,
  lock: Lock,
  badge: BadgeCheck,
  gem: Gem,
  heart: Heart,
  award: Award,
  sparkles: Sparkles,
  gift: Gift,
};

// Badges are read from settings on the server and passed in via props, so the
// strip stays a lightweight presentational component (defaults reproduce the
// original five items).
export function TrustStrip({ badges }: { badges: TrustBadge[] }) {
  if (!badges.length) return null;

  // Keep the original 5-up desktop layout for the common case, but degrade
  // gracefully if the owner adds more or fewer badges.
  const desktopCols =
    badges.length >= 5
      ? "md:grid-cols-5"
      : badges.length === 4
        ? "md:grid-cols-4"
        : badges.length === 3
          ? "md:grid-cols-3"
          : "md:grid-cols-2";

  return (
    <section className="py-8 px-4 md:px-16 bg-surface-container-low border-y border-outline-variant/30">
      <div className={`grid grid-cols-2 ${desktopCols} gap-6 max-w-screen-2xl mx-auto reveal stagger-grid`}>
        {badges.map((badge, i) => {
          const Icon = ICONS[badge.icon] ?? ShieldCheck;
          return (
            <div key={`${badge.title}-${i}`} className="flex items-start md:items-center gap-3">
              <Icon className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
              <div>
                <p className="font-label-caps text-label-caps font-semibold text-on-surface">
                  {badge.title}
                </p>
                {badge.sub && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    {badge.sub}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
