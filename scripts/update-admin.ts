import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("Sirini@123", 12);

  // Delete any existing admin users to avoid conflicts
  await prisma.user.deleteMany({ where: { isAdmin: true } });

  const admin = await prisma.user.create({
    data: {
      email: "sirinijewellery@gmail.com",
      name: "Sirini Admin",
      passwordHash,
      isAdmin: true,
    },
  });

  console.log(`✓ Admin created: ${admin.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
