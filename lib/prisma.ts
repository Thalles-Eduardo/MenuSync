import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getEnv } from "./env";

// O dev do Next reavalia os modulos a cada hot reload. Sem guarda, cada reload
// construiria um PrismaClient novo, cada um com seu pool, e em poucos minutos o
// Postgres recusa conexao por "too many clients". Guardar a instancia no
// globalThis — que sobrevive ao reload — resolve.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function obterClient(): PrismaClient {
  const existente = globalForPrisma.prisma;
  if (existente) return existente;

  // O Prisma 7 exige um driver adapter; a URL vem do env ja validado.
  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString: getEnv().DATABASE_URL }),
  });

  // Em producao o processo e unico e nao ha reload: guardar no global so
  // manteria uma referencia viva sem ganho nenhum.
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

// Proxy em vez de instanciar direto no import: construir o client aqui chamaria
// getEnv() no escopo do modulo e quebraria `npm run build` em ambiente sem .env
// (mesma razao documentada em lib/env.ts). Assim o client so nasce no primeiro
// acesso de verdade, que acontece dentro do handler.
export const prisma = new Proxy({} as PrismaClient, {
  get(_alvo, prop, receiver) {
    return Reflect.get(obterClient(), prop, receiver);
  },
});
