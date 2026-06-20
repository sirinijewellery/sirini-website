// One-off: create the owner's main admin (nishit.savla) and give the existing
// Sirini admin a username. Passwords are bcrypt-hashed — never stored plaintext.
// Run: DOTENV_CONFIG_PATH=.env.local npx tsx -r dotenv/config scripts/seed-admins.ts
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

(async () => {
  // 1) Main admin — nishit.savla / nsavla
  const username = "nishit.savla";
  const email = "nishit.savla@sirini.local"; // synthetic; login is by username
  const passwordHash = await bcrypt.hash("nsavla", 12);
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { username, name: "Nishit Savla", passwordHash, isAdmin: true },
    });
    console.log("Updated existing main admin (nishit.savla)");
  } else {
    await prisma.user.create({
      data: { username, email, name: "Nishit Savla", passwordHash, isAdmin: true },
    });
    console.log("Created main admin (nishit.savla)");
  }

  // 2) Existing Sirini admin -> username sirini.jewellery
  const sirini = await prisma.user.findFirst({ where: { email: "sirinijewellery@gmail.com" } });
  if (sirini) {
    await prisma.user.update({ where: { id: sirini.id }, data: { username: "sirini.jewellery", isAdmin: true } });
    console.log("Set Sirini admin username -> sirini.jewellery");
  } else {
    console.log("WARNING: Sirini admin (sirinijewellery@gmail.com) not found");
  }

  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { username: true, email: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  console.log("Current admins:", JSON.stringify(admins, null, 2));
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
