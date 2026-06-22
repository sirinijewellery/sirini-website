// Server component: fetches the admin-managed menu taxonomy once (request-cached
// via getMenuTaxonomy()) and threads it into the navbar. The admin-route gate
// needs usePathname (client-only), so it lives in NavbarGate below.
import { getMenuTaxonomy } from "@/lib/queries/taxonomy";
import type { TaxonomyGroupData } from "@/lib/taxonomy";
import { NavbarGate } from "./NavbarGate";

export async function NavbarWrapper({ messages }: { messages?: string[] }) {
  // Gracefully fall back to an empty taxonomy if the read fails or returns
  // nothing — the MegaMenu then renders price + "View All" only.
  let groups: TaxonomyGroupData[];
  try {
    groups = await getMenuTaxonomy();
  } catch {
    groups = [];
  }
  return <NavbarGate messages={messages} groups={groups} />;
}
