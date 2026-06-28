"use client";

// Client gate: hides the navbar on /admin routes (needs usePathname). Receives
// server-fetched data (ribbon messages + menu taxonomy + navbar config) as
// serializable props from NavbarWrapper and forwards them to Navbar.
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import type { TaxonomyGroupData } from "@/lib/taxonomy";
import type { NavbarConfig } from "@/lib/queries/navbar";

export function NavbarGate({
  messages,
  groups,
  navbarConfig,
}: {
  messages?: string[];
  groups: TaxonomyGroupData[];
  navbarConfig: NavbarConfig;
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <Navbar messages={messages} groups={groups} navbarConfig={navbarConfig} />;
}
