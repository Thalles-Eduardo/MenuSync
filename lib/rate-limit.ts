/**
 * Rate limit de janela fixa, em memoria.
 *
 * LIMITACOES, declaradas em vez de escondidas:
 *
 * 1. O estado vive no processo: ZERA A CADA RESTART. Um deploy ou um crash
 *    devolve a cota cheia para todo mundo.
 * 2. E POR INSTANCIA. Com N instancias atras de um balanceador o limite efetivo
 *    vira N x limite. Serve para o deploy single-container previsto; ao escalar
 *    horizontalmente isto tem que virar Redis ou tabela.
 * 3. A chave usual e o IP tirado de `x-forwarded-for`, que e um header comum e
 *    portanto FORJAVEL: se nenhum proxy confiavel o reescrever, o cliente
 *    escolhe o proprio bucket e o limite deixa de valer. So e confiavel atras de
 *    um nginx/CDN que sobrescreva o header.
 *
 * Ou seja: isto e um freio contra abuso casual e script ingenuo, nao uma defesa
 * contra um atacante determinado.
 */

type Registro = { count: number; resetAt: number };

export type ResultadoRateLimit = {
  permitido: boolean;
  restantes: number;
  /** Epoch em ms em que a janela atual expira. */
  resetAt: number;
};

const LIMITE_PADRAO = 5;
const JANELA_PADRAO_MS = 10 * 60 * 1000; // 10 minutos

const registros = new Map<string, Registro>();

// Sem esta limpeza o Map so cresce: cada IP novo deixa uma entrada para sempre e
// o processo vaza memoria lentamente. Roda amortizada dentro do proprio
// consumirCota (nao ha timer) para nao segurar o event loop de um serverless.
function limparExpirados(agora: number): void {
  for (const [chave, registro] of registros) {
    if (registro.resetAt <= agora) registros.delete(chave);
  }
}

let proximaLimpeza = 0;
const INTERVALO_LIMPEZA_MS = 60 * 1000;

// Teto de seguranca: uma rajada de milhares de IPs distintos dentro do mesmo
// minuto encheria o Map antes da limpeza por tempo chegar. Passando daqui,
// limpa na hora.
const LIMIAR_LIMPEZA = 500;

export type OpcoesRateLimit = {
  limite?: number;
  janelaMs?: number;
};

/**
 * Consome uma unidade da cota de `chave`. Chamada unica: ja registra o consumo.
 */
export function consumirCota(
  chave: string,
  opcoes: OpcoesRateLimit = {},
): ResultadoRateLimit {
  const limite = opcoes.limite ?? LIMITE_PADRAO;
  const janelaMs = opcoes.janelaMs ?? JANELA_PADRAO_MS;
  const agora = Date.now();

  if (agora >= proximaLimpeza || registros.size >= LIMIAR_LIMPEZA) {
    limparExpirados(agora);
    proximaLimpeza = agora + INTERVALO_LIMPEZA_MS;
  }

  const atual = registros.get(chave);

  // Janela ausente ou vencida: comeca uma nova. Janela FIXA mesmo — o custo
  // conhecido e que um cliente pode gastar 2x o limite na virada (fim de uma
  // janela + inicio da seguinte). Aceitavel para captacao de lead.
  if (!atual || atual.resetAt <= agora) {
    const novo: Registro = { count: 1, resetAt: agora + janelaMs };
    registros.set(chave, novo);
    return { permitido: true, restantes: limite - 1, resetAt: novo.resetAt };
  }

  if (atual.count >= limite) {
    // Nao incrementa alem do limite: quem ja estourou nao empurra a propria
    // contagem para o infinito, e o resetAt continua sendo o da janela original.
    return { permitido: false, restantes: 0, resetAt: atual.resetAt };
  }

  atual.count += 1;
  return { permitido: true, restantes: limite - atual.count, resetAt: atual.resetAt };
}

/** Uso em teste: descarta todo o estado acumulado. */
export function resetarRateLimit(): void {
  registros.clear();
  proximaLimpeza = 0;
}

/** Uso em teste: quantas chaves estao vivas no Map. */
export function tamanhoRateLimit(): number {
  return registros.size;
}
