import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { identificarCliente } from "@/lib/http";
import { consumirCota } from "@/lib/rate-limit";
import {
  MENSAGEM_POR_MOTIVO,
  STATUS_POR_MOTIVO,
  consumirCupom,
} from "@/lib/coupons/resgate";

// O Prisma nao roda no runtime edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const corpoEsperado = z.object({
  code: z.string().trim().min(1).max(64),
});

// Mesma cota do validate. O redeem tambem responde "existe / ja usado / venceu"
// e portanto vaza a mesma informacao; deixa-lo mais folgado daria ao atacante um
// segundo oraculo, mais barato que o primeiro — e este AINDA gasta o cupom se
// acertar.
const COTA_POR_IP = { limite: 10, janelaMs: 10 * 60 * 1000 };

type CodigoDeErro =
  | "RATE_LIMITED"
  | "INVALID_CODE"
  | "NOT_FOUND"
  | "ALREADY_USED"
  | "EXPIRED"
  | "INTERNAL";

function erro(code: CodigoDeErro, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  try {
    const cota = consumirCota(`coupon-redeem:${identificarCliente(request)}`, COTA_POR_IP);
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

    // O consumo e um update condicional (ver lib/coupons/resgate.ts): quem
    // recebe ok:true e quem venceu a disputa no banco, nao quem leu antes.
    const resultado = await consumirCupom(analisado.data.code);

    if (!resultado.ok) {
      return erro(
        resultado.motivo,
        MENSAGEM_POR_MOTIVO[resultado.motivo],
        STATUS_POR_MOTIVO[resultado.motivo],
      );
    }

    console.info(`[coupons/redeem] consumido ${resultado.code}`);

    return NextResponse.json(
      { redeemed: true, code: resultado.code, percent: resultado.percent },
      { status: 200 },
    );
  } catch (falha) {
    const idDoErro = randomUUID();
    console.error(
      `[coupons/redeem] erro interno ${idDoErro}`,
      falha instanceof Error ? falha.stack : falha,
    );
    return erro(
      "INTERNAL",
      `Algo deu errado do nosso lado. Tente de novo em instantes. (ref: ${idDoErro})`,
      500,
    );
  }
}
