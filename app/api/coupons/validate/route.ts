import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { identificarCliente } from "@/lib/http";
import { consumirCota } from "@/lib/rate-limit";
import {
  MENSAGEM_POR_MOTIVO,
  STATUS_POR_MOTIVO,
  validarCupom,
} from "@/lib/coupons/resgate";

// O Prisma nao roda no runtime edge.
export const runtime = "nodejs";
// Sem isto o Next poderia avaliar a rota no build, e ai getEnv() dispararia num
// ambiente sem .env (ver a nota de build em lib/env.ts).
export const dynamic = "force-dynamic";

const corpoEsperado = z.object({
  // O `.max(64)` corta cedo qualquer corpo absurdo: o codigo tem 17 caracteres,
  // e sem teto uma string de megabytes chegaria ate a regex e ate o banco.
  code: z.string().trim().min(1).max(64),
});

/**
 * Cota bem mais apertada que a da geracao (5/10min por IP, mas por e-mail).
 *
 * Este endpoint e o unico oraculo publico de "este codigo vale?", e o rate limit
 * E a defesa central dele. Sao ~40 bits de entropia (32^8 ~ 1,1x10^12), o que
 * torna a adivinhacao cega inviavel ENQUANTO houver limite; sem limite, um
 * atacante distribuido varre o espaco em paralelo e o custo por tentativa cai a
 * zero. 10 tentativas por 10 minutos deixa folga confortavel para quem errou a
 * digitacao e continua proibitivo para script.
 */
const COTA_POR_IP = { limite: 10, janelaMs: 10 * 60 * 1000 };

type CodigoDeErro =
  | "RATE_LIMITED"
  | "INVALID_CODE"
  | "NOT_FOUND"
  | "ALREADY_USED"
  | "EXPIRED"
  | "INTERNAL";

// Mesmo shape de erro do POST /api/coupons: a UI sempre le { error: { code,
// message } } e trata por `code`, nunca pelo texto.
function erro(code: CodigoDeErro, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  try {
    // Rate limit ANTES do parse: quem esta em flood nao deve nos custar CPU de
    // validacao nem round-trip de banco. Chave prefixada por rota para a cota do
    // validate nao se misturar com a da geracao.
    const cota = consumirCota(`coupon-validate:${identificarCliente(request)}`, COTA_POR_IP);
    if (!cota.permitido) {
      return erro(
        "RATE_LIMITED",
        "Muitas tentativas. Tente de novo em alguns minutos.",
        429,
      );
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return erro("INVALID_CODE", MENSAGEM_POR_MOTIVO.INVALID_CODE, 400);
    }

    const analisado = corpoEsperado.safeParse(json);
    if (!analisado.success) {
      return erro("INVALID_CODE", MENSAGEM_POR_MOTIVO.INVALID_CODE, 400);
    }

    const resultado = await validarCupom(analisado.data.code);

    // Distinguir NOT_FOUND / ALREADY_USED / EXPIRED e DELIBERADO, ao contrario
    // da rota de geracao, que responde generico para nao virar um oraculo de
    // "este e-mail esta cadastrado?". Aqui a assimetria nao existe: quem chega
    // com um codigo ja possui o codigo, que e a propria credencial. O unico
    // segredo em jogo e o proprio valor digitado, e o rate limit acima e que o
    // protege — nao a vagueza da mensagem.
    if (!resultado.ok) {
      return erro(
        resultado.motivo,
        MENSAGEM_POR_MOTIVO[resultado.motivo],
        STATUS_POR_MOTIVO[resultado.motivo],
      );
    }

    // O `percent` sai daqui, do banco, a cada consulta. E o unico caminho pelo
    // qual o cliente pode conhecer o desconto: ele nunca o persiste.
    return NextResponse.json(
      { valid: true, code: resultado.code, percent: resultado.percent },
      { status: 200 },
    );
  } catch (falha) {
    // Stack e mensagem do Prisma revelam schema e caminhos de arquivo; ficam no
    // servidor. O cliente leva so o id que o suporte usa para achar a linha.
    const idDoErro = randomUUID();
    console.error(
      `[coupons/validate] erro interno ${idDoErro}`,
      falha instanceof Error ? falha.stack : falha,
    );
    return erro(
      "INTERNAL",
      `Algo deu errado do nosso lado. Tente de novo em instantes. (ref: ${idDoErro})`,
      500,
    );
  }
}
