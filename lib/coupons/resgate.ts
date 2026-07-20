import { prisma } from "../prisma";
import { PREFIXO } from "./code";

/**
 * Motivos de recusa. Sao distinguidos de proposito neste fluxo — ver a nota
 * sobre "resposta generica" nas rotas: quem digita um codigo ja possui a
 * credencial, entao dizer "esse cupom ja foi usado" nao entrega nada que o
 * portador nao saiba, e evita que ele fique tentando de novo sem entender.
 */
export type MotivoDeFalha = "INVALID_CODE" | "NOT_FOUND" | "ALREADY_USED" | "EXPIRED";

export type ResultadoDoResgate =
  | { ok: true; code: string; percent: number }
  | { ok: false; motivo: MotivoDeFalha };

// Mesmo alfabeto de lib/coupons/code.ts (sem I, O, 0 e 1). Escrever a classe
// exata em vez de [A-Z0-9] faz a rota rejeitar no formato, sem ida ao banco,
// tudo que nem poderia ter sido gerado por nos.
const FORMATO = new RegExp(`^${PREFIXO}[ABCDEFGHJKLMNPQRSTUVWXYZ2-9]{8}$`);

/**
 * Normaliza o que veio da mao do usuario antes de qualquer comparacao.
 *
 * O codigo e transcrito do e-mail, entao chega com espaco em volta e as vezes
 * em minusculas. Sem normalizar, "sakura10-abcdefgh" nao acharia a linha
 * gravada em maiusculas e o usuario levaria um "cupom nao encontrado" para um
 * cupom que existe.
 */
export function normalizarCodigo(code: string): string {
  return code.trim().toUpperCase();
}

export function formatoValido(code: string): boolean {
  return FORMATO.test(code);
}

/**
 * Consulta o cupom SEM consumi-lo.
 *
 * Nao escreve nada. Isto e o contrato desta funcao: ela alimenta a UI enquanto
 * o usuario ainda esta montando o pedido, e um efeito colateral aqui gastaria o
 * cupom de quem so quis conferir o desconto.
 */
export async function validarCupom(codeBruto: string): Promise<ResultadoDoResgate> {
  const code = normalizarCodigo(codeBruto);
  if (!formatoValido(code)) return { ok: false, motivo: "INVALID_CODE" };

  const cupom = await prisma.coupon.findUnique({ where: { code } });
  if (!cupom) return { ok: false, motivo: "NOT_FOUND" };
  if (cupom.status === "USED") return { ok: false, motivo: "ALREADY_USED" };

  // Checamos a DATA, nao so o status: nao existe job que vire ACTIVE em EXPIRED
  // (esta fora de escopo na spec), entao um cupom vencido continua marcado
  // ACTIVE no banco. Confiar so no status deixaria passar cupom vencido.
  if (cupom.status === "EXPIRED" || cupom.expiresAt <= new Date()) {
    return { ok: false, motivo: "EXPIRED" };
  }

  return { ok: true, code: cupom.code, percent: cupom.percent };
}

/**
 * Consome o cupom, de forma atomica.
 *
 * PROIBIDO ler-depois-escrever aqui (findUnique para conferir + update para
 * marcar). Essa sequencia tem a mesma janela de corrida do check-then-insert que
 * a geracao evitou com a constraint UNIQUE: dois cliques simultaneos passam
 * pelas duas leituras enquanto nenhuma das duas gravou, e o cupom e gasto duas
 * vezes. O `updateMany` com `status` e `expiresAt` no WHERE resolve a disputa
 * dentro do banco — a segunda transacao simplesmente nao encontra mais linha que
 * case, e volta com count 0. Por isso o `count === 1` e a autorizacao, nao uma
 * leitura anterior.
 */
export async function consumirCupom(codeBruto: string): Promise<ResultadoDoResgate> {
  const code = normalizarCodigo(codeBruto);
  if (!formatoValido(code)) return { ok: false, motivo: "INVALID_CODE" };

  const { count } = await prisma.coupon.updateMany({
    where: { code, status: "ACTIVE", expiresAt: { gt: new Date() } },
    data: { status: "USED" },
  });

  if (count === 1) {
    // So lemos DEPOIS de vencer a disputa. Como o codigo e unico e o status ja
    // e USED, esta leitura nao tem corrida: ninguem mais pode ter mudado a
    // linha para um estado que nos interesse.
    const cupom = await prisma.coupon.findUnique({ where: { code } });
    if (!cupom) {
      throw new Error("Cupom consumido desapareceu entre o update e a leitura");
    }
    return { ok: true, code: cupom.code, percent: cupom.percent };
  }

  // Perdemos (ou nunca houve linha elegivel). A leitura abaixo serve APENAS para
  // escolher a mensagem; ela nao autoriza nada e nao pode virar base de decisao
  // de escrita.
  return { ok: false, motivo: await diagnosticarFalha(code) };
}

async function diagnosticarFalha(code: string): Promise<MotivoDeFalha> {
  const cupom = await prisma.coupon.findUnique({ where: { code } });
  if (!cupom) return "NOT_FOUND";
  if (cupom.status === "USED") return "ALREADY_USED";
  return "EXPIRED";
}

/** Status HTTP de cada motivo, compartilhado pelas duas rotas de resgate. */
export const STATUS_POR_MOTIVO: Record<MotivoDeFalha, number> = {
  INVALID_CODE: 400,
  NOT_FOUND: 404,
  ALREADY_USED: 409,
  EXPIRED: 410,
};

/** Mensagens voltadas ao usuario final; nenhuma revela detalhe interno. */
export const MENSAGEM_POR_MOTIVO: Record<MotivoDeFalha, string> = {
  INVALID_CODE: "Codigo invalido. Confira o formato SAKURA10-XXXXXXXX.",
  NOT_FOUND: "Cupom nao encontrado.",
  ALREADY_USED: "Este cupom ja foi utilizado.",
  EXPIRED: "Este cupom expirou.",
};
