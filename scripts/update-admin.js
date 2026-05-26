const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const bcrypt = require("bcryptjs");

const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const filePath = dbUrl.replace(/^file:/, "");
const dbPath = path.isAbsolute(filePath)
  ? filePath
  : path.resolve(process.cwd(), filePath);

const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("Sirini@123", 12);
  await prisma.user.deleteMany({ where: { isAdmin: true } });
  const admin = await prisma.user.create({
    data: {
      email: "sirinijewellery@gmail.com",
      name: "Sirini Admin",
      passwordHash,
      isAdmin: true,
    },
  });
  console.log("✓ Admin account set up:", admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
