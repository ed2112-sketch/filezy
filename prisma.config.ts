import { defineConfig } from "prisma/config";

try {
  require("dotenv/config");
} catch {
  // dotenv not available in production — env vars are injected by the platform
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
