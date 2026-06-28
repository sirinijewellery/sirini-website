// Server component: fetches the admin-managed menu taxonomy once (request-cached
// via getMenuTaxonomy()) and threads it into the navbar. The admin-route gate
// needs usePathname (client-only), so it lives in NavbarGate below.
import { getMenuTaxonomy } from "@/lib/queries/taxonomy";
import { getNavbarConfig } from "@/lib/queries/navbar";
import type { TaxonomyGroupData } from "@/lib/taxonomy";
import type { NavbarConfig } from "@/lib/queries/navbar";
import { NavbarGate } from "./NavbarGate";

export async function NavbarWrapper({ messages }: { messages?: string[] }) {
  let groups: TaxonomyGroupData[];
  try {
    groups = await getMenuTaxonomy();
  } catch {
    groups = [];
  }
  let navbarConfig: NavbarConfig;
  try {
    navbarConfig = await getNavbarConfig();
  } catch {
    navbarConfig = { links: [] };
  }
  return <NavbarGate messages={messages} groups={groups} navbarConfig={navbarConfig} />;
}
