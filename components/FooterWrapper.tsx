"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";
import type { BusinessDetails } from "@/lib/settings";

export function FooterWrapper({ business }: { business: BusinessDetails }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <Footer business={business} />;
}
