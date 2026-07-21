// O pacote `server-only` lanca incondicionalmente fora do bundler do Next, que
// normalmente o substitui por um no-op ao compilar o grafo do servidor. O
// Vitest nao e o Next e nao tem grafo cliente/servidor para proteger, entao
// aqui ele vira no-op de verdade. A garantia continua valendo onde importa: no
// `next build`.
export {};
