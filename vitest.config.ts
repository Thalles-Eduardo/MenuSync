import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Resolve o alias "@/..." do tsconfig (nativo desde o Vite 7 — dispensa o
    // plugin vite-tsconfig-paths). E OBRIGATORIO que os testes importem os
    // modulos pelos MESMOS especificadores que app/api/coupons/route.ts usa
    // ("@/lib/coupons/mailer"): um caminho relativo criaria uma SEGUNDA instancia
    // do modulo no cache, o stub do mailer seria registrado nela e a rota
    // chamaria a Resend de verdade (ja aconteceu nesta base).
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Carrega o .env: os testes de integracao precisam de DATABASE_URL.
    setupFiles: ["tests/setup.ts"],
    // Os testes tocam o Postgres real e compartilham dois estados globais: o Map
    // do rate limit e o enviador injetado no mailer. Em paralelo eles se
    // atropelam (uma suite queima a cota da outra), entao tudo roda em serie,
    // num unico processo.
    pool: "forks",
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
