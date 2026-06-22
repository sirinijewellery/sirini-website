"use client";

// Client gate: hides the navbar on /admin routes (needs usePathname). Receives
// server-fetched data (ribbon messages + menu taxonomy) as serializable props
// from NavbarWrapper and forwards them to Navbar.
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import type { TaxonomyGroupData } from "@/lib/taxonomy";

export function NavbarGate({
  messages,
  groups,
}: {
  messages?: string[];
  groups: TaxonomyGroupData[];
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <Navbar messages={messages} groups={groups} />;
}
