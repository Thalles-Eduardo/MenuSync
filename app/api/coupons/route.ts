import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { consumirCota } from "@/lib/rate-limit";
import { criarOuRecuperarCupom } from "@/lib/coupons/service";
import { ErroDeEnvio, obterEnviador, redigirEmail } from "@/lib/coupons/mailer";

// O handler usa node:crypto e o Prisma, que nao rodam no runtime edge.
export const runtime = "nodejs";
// Sem isto o Next poderia tentar avaliar a rota no build, e ai getEnv()
// dispararia num ambiente sem .env (ver a nota de build em lib/env.ts).
export const dynamic = "force-dynamic";

const corpoEsperado = z.object({
  email: z.email({ message: "Informe um e-mail valido." }),
});

type CodigoDeErro = "RATE_LIMITED" | "INVALID_EMAIL" | "SEND_FAILED" | "INTERNAL";

// Shape unico de erro: o cliente sempre le { error: { code, message } }, entao a
// UI trata por `code` e nunca precisa adivinhar formato.
function erro(code: CodigoDeErro, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function identificarCliente(request: Request): string {
  // x-forwarded-for e forjavel se nenhum proxy confiavel o reescrever (ver
  // lib/rate-limit.ts). Em dev costuma vir nulo; nesse caso todo mundo cai num
  // bucket unico, que e restritivo demais para producao mas seguro aqui: o pior
  // caso e limitar quem nao deveria, nunca liberar quem deveria ser limitado.
  const encaminhado = request.headers.get("x-forwarded-for");
  if (!encaminhado) return "sem-ip";

  const primeiro = encaminhado.split(",")[0]?.trim();
  return primeiro && primeiro.length > 0 ? primeiro : "sem-ip";
}

export async function POST(request: Request) {
  try {
    // 1. Rate limit vem ANTES de qualquer parse: quem esta em flood nao deve
    //    conseguir nos fazer gastar CPU de validacao nem round-trip de banco.
    const cota = consumirCota(identificarCliente(request));
    if (!cota.permitido) {
      return erro(
        "RATE_LIMITED",
        "Muitas tentativas. Tente de novo em alguns minutos.",
        429,
      );
    }

    // 2. Validacao. A mensagem do Zod aqui e segura de expor: fala do formato do
    //    e-mail, nao de nada interno.
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return erro("INVALID_EMAIL", "Informe um e-mail valido.", 400);
    }

    const analisado = corpoEsperado.safeParse(json);
    if (!analisado.success) {
      return erro("INVALID_EMAIL", "Informe um e-mail valido.", 400);
    }

    // 3. Servico: cria ou recupera. Os dois ramos seguem identicos daqui pra
    //    frente — jaExistia so vira log.
    const { coupon, jaExistia } = await criarOuRecuperarCupom(analisado.data.email);

    // 4. Envio. Reenviar o MESMO codigo e idempotente de proposito: uma nova
    //    tentativa do usuario nao gera um segundo cupom.
    try {
      await obterEnviador().enviar({
        email: coupon.email,
        code: coupon.code,
        expiresAt: coupon.expiresAt,
      });
    } catch (falhaDeEnvio) {
      const idDoErro = randomUUID();
      console.error(
        `[coupons] falha de envio ${idDoErro} para ${redigirEmail(coupon.email)}`,
        falhaDeEnvio instanceof ErroDeEnvio ? falhaDeEnvio.causa : falhaDeEnvio,
      );
      return erro(
        "SEND_FAILED",
        `Nao conseguimos enviar o e-mail agora. Tente de novo em instantes. (ref: ${idDoErro})`,
        502,
      );
    }

    console.info(
      `[coupons] ok para ${redigirEmail(coupon.email)} (ja existia: ${jaExistia})`,
    );

    // 5. Sucesso SEMPRE igual: 200 { ok: true }, sem o codigo (ele so existe no
    //    e-mail, senao bastaria digitar o endereco de outra pessoa para ganhar
    //    um cupom) e sem nenhum sinal de que o e-mail ja estava na base.
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (falha) {
    // Stack, mensagem do Prisma e detalhe do Postgres ficam no servidor: eles
    // revelam schema, nomes de constraint e caminhos de arquivo. O cliente leva
    // so o id, que e o que o suporte precisa para achar esta linha no log.
    const idDoErro = randomUUID();
    console.error(
      `[coupons] erro interno ${idDoErro}`,
      falha instanceof Error ? falha.stack : falha,
    );
    return erro(
      "INTERNAL",
      `Algo deu errado do nosso lado. Tente de novo em instantes. (ref: ${idDoErro})`,
      500,
    );
  }
}
