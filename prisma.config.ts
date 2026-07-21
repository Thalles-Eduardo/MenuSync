import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// O Prisma 7 tirou a `url` do schema.prisma: a conexao usada pela CLI
// (migrate/introspect) mora aqui. E, diferente do 6, a CLI nao carrega o .env
// sozinha — por isso o "dotenv/config" acima, senao DATABASE_URL vem vazia.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  // No Prisma 7 o seed sai do package.json e vem para ca.
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
