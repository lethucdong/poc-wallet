import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback: .env
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Dùng URL không qua pooler để migrate (Neon yêu cầu direct connection)
    url: process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"],
  },
});
