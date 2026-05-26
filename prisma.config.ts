import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node --compiler-options {\"module\":\"commonjs\"} prisma/seed.ts",
  },
  datasource: {
    // Use the direct (non-pooled) URL for migrations — DDL needs a real connection
    url: process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"]!,
  },
});
