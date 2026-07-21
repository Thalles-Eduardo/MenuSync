import "dotenv/config";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { gerarCodigo } from "@/lib/coupons/code";
import { consumirCupom, validarCupom } from "@/lib/coupons/resgate";
import { resetarRateLimit } from "@/lib/rate-limit";
import { POST as validateRoute } from "@/app/api/coupons/validate/route";
import { POST as redeemRoute } from "@/app/api/coupons/redeem/route";

/**
 * Testes de integracao contra o Postgres real (docker compose).
 *
 * DOMINIO PROPRIO nos fixtures: a tabela tem cupons de verdade, inclusive o do
 * dono do projeto. Limpar a tabela inteira num afterAll destruiria dados reais,
 * entao todo cleanup e filtrado por @resgate.test.
 */
const DOMINIO = "@resgate.test";

let seq = 0;
function emailDeTeste(): string {
  seq += 1;
  return `resgate-${Date.now()}-${seq}${DOMINIO}`;
}

const EM_30_DIAS = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
const ONTEM = () => new Date(Date.now() - 24 * 60 * 60 * 1000);

async function criarCupom(dados: {
  status?: "ACTIVE" | "USED" | "EXPIRED";
  expiresAt?: Date;
  percent?: number;
}) {
  return prisma.coupon.create({
    data: {
      email: emailDeTeste(),
      code: gerarCodigo(),
      status: dados.status ?? "ACTIVE",
      expiresAt: dados.expiresAt ?? EM_30_DIAS(),
      ...(dados.percent === undefined ? {} : { percent: dados.percent }),
    },
  });
}

function requisicao(url: string, body: unknown, ip: string): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

// Cada teste comeca com a cota zerada; senao a ordem dos testes decidiria quem
// leva 429, e a suite ficaria sensivel a reordenacao.
beforeEach(() => {
  resetarRateLimit();
});

afterAll(async () => {
  await prisma.coupon.deleteMany({ where: { email: { endsWith: DOMINIO } } });
});

describe("validarCupom", () => {
  it("aceita um cupom ativo e devolve o percentual do banco", async () => {
    const cupom = await criarCupom({ percent: 25 });

    const resultado = await validarCupom(cupom.code);

    expect(resultado).toEqual({ ok: true, code: cupom.code, percent: 25 });
  });

  it("NAO marca o cupom como USED (validar nao consome)", async () => {
    const cupom = await criarCupom({});

    await validarCupom(cupom.code);

    // A assercao decisiva: o estado no banco DEPOIS da validacao. Um efeito
    // colateral aqui gastaria o cupom de quem so quis conferir o desconto.
    const depois = await prisma.coupon.findUnique({ where: { code: cupom.code } });
    expect(depois?.status).toBe("ACTIVE");
  });

  it("normaliza caixa e espaco antes de procurar", async () => {
    const cupom = await criarCupom({});

    const resultado = await validarCupom(`  ${cupom.code.toLowerCase()}  `);

    expect(resultado.ok).toBe(true);
  });

  it("recusa formato invalido sem ir ao banco", async () => {
    expect(await validarCupom("NAO-E-CUPOM")).toEqual({
      ok: false,
      motivo: "INVALID_CODE",
    });
  });

  it("recusa codigo inexistente", async () => {
    expect(await validarCupom(gerarCodigo())).toEqual({ ok: false, motivo: "NOT_FOUND" });
  });

  it("recusa cupom ja usado", async () => {
    const cupom = await criarCupom({ status: "USED" });
    expect(await validarCupom(cupom.code)).toEqual({ ok: false, motivo: "ALREADY_USED" });
  });

  it("recusa cupom vencido mesmo com status ACTIVE", async () => {
    const cupom = await criarCupom({ expiresAt: ONTEM() });
    expect(await validarCupom(cupom.code)).toEqual({ ok: false, motivo: "EXPIRED" });
  });
});

describe("consumirCupom", () => {
  it("consome um cupom ativo e o deixa USED", async () => {
    const cupom = await criarCupom({ percent: 10 });

    const resultado = await consumirCupom(cupom.code);

    expect(resultado).toEqual({ ok: true, code: cupom.code, percent: 10 });
    const depois = await prisma.coupon.findUnique({ where: { code: cupom.code } });
    expect(depois?.status).toBe("USED");
  });

  it("recusa o segundo consumo do mesmo cupom", async () => {
    const cupom = await criarCupom({});
    await consumirCupom(cupom.code);

    expect(await consumirCupom(cupom.code)).toEqual({ ok: false, motivo: "ALREADY_USED" });
  });

  it("recusa cupom vencido mesmo com status ACTIVE", async () => {
    const cupom = await criarCupom({ expiresAt: ONTEM() });

    expect(await consumirCupom(cupom.code)).toEqual({ ok: false, motivo: "EXPIRED" });

    // E, principalmente, nao o marcou como usado: o WHERE do updateMany carrega
    // o expiresAt, entao a linha nem foi tocada.
    const depois = await prisma.coupon.findUnique({ where: { code: cupom.code } });
    expect(depois?.status).toBe("ACTIVE");
  });

  it("CORRIDA: 5 consumos simultaneos do mesmo cupom dao exatamente 1 sucesso", async () => {
    const cupom = await criarCupom({});

    // Promise.all e o ponto do teste: as 5 chamadas partem antes de qualquer uma
    // terminar. Com findUnique + update, varias passariam pela leitura enquanto
    // o status ainda era ACTIVE e o cupom seria gasto mais de uma vez. Com o
    // updateMany condicional, o banco serializa e so uma acha linha elegivel.
    const resultados = await Promise.all(
      Array.from({ length: 5 }, () => consumirCupom(cupom.code)),
    );

    expect(resultados.filter((r) => r.ok)).toHaveLength(1);
    expect(resultados.filter((r) => !r.ok)).toHaveLength(4);

    const depois = await prisma.coupon.findUnique({ where: { code: cupom.code } });
    expect(depois?.status).toBe("USED");
  });
});

describe("POST /api/coupons/validate", () => {
  const url = "http://localhost/api/coupons/validate";

  it("200 com o percentual quando o cupom vale", async () => {
    const cupom = await criarCupom({ percent: 15 });

    const resposta = await validateRoute(requisicao(url, { code: cupom.code }, "10.0.0.1"));

    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({
      valid: true,
      code: cupom.code,
      percent: 15,
    });
  });

  it("nao consome o cupom pela rota", async () => {
    const cupom = await criarCupom({});

    await validateRoute(requisicao(url, { code: cupom.code }, "10.0.0.2"));

    const depois = await prisma.coupon.findUnique({ where: { code: cupom.code } });
    expect(depois?.status).toBe("ACTIVE");
  });

  it("400 para formato invalido", async () => {
    const resposta = await validateRoute(requisicao(url, { code: "xxx" }, "10.0.0.3"));
    expect(resposta.status).toBe(400);
    expect((await resposta.json()).error.code).toBe("INVALID_CODE");
  });

  it("400 para corpo sem code", async () => {
    const resposta = await validateRoute(requisicao(url, {}, "10.0.0.4"));
    expect(resposta.status).toBe(400);
  });

  it("404 para codigo inexistente", async () => {
    const resposta = await validateRoute(requisicao(url, { code: gerarCodigo() }, "10.0.0.5"));
    expect(resposta.status).toBe(404);
    expect((await resposta.json()).error.code).toBe("NOT_FOUND");
  });

  it("409 para cupom ja usado", async () => {
    const cupom = await criarCupom({ status: "USED" });
    const resposta = await validateRoute(requisicao(url, { code: cupom.code }, "10.0.0.6"));
    expect(resposta.status).toBe(409);
    expect((await resposta.json()).error.code).toBe("ALREADY_USED");
  });

  it("410 para cupom expirado", async () => {
    const cupom = await criarCupom({ expiresAt: ONTEM() });
    const resposta = await validateRoute(requisicao(url, { code: cupom.code }, "10.0.0.7"));
    expect(resposta.status).toBe(410);
    expect((await resposta.json()).error.code).toBe("EXPIRED");
  });

  it("429 na 11a tentativa do mesmo IP (10 por janela)", async () => {
    const ip = "10.0.0.8";
    const codigo = gerarCodigo(); // inexistente de proposito: nada e consumido

    const statusesIniciais: number[] = [];
    for (let i = 0; i < 10; i += 1) {
      const r = await validateRoute(requisicao(url, { code: codigo }, ip));
      statusesIniciais.push(r.status);
    }

    // As 10 primeiras passam do rate limit (e batem 404, que e o esperado).
    expect(statusesIniciais.every((s) => s === 404)).toBe(true);

    const decimaPrimeira = await validateRoute(requisicao(url, { code: codigo }, ip));
    expect(decimaPrimeira.status).toBe(429);
    expect((await decimaPrimeira.json()).error.code).toBe("RATE_LIMITED");
  });

  it("a cota de um IP nao afeta a de outro", async () => {
    const codigo = gerarCodigo();
    for (let i = 0; i < 10; i += 1) {
      await validateRoute(requisicao(url, { code: codigo }, "10.0.0.9"));
    }

    const outro = await validateRoute(requisicao(url, { code: codigo }, "10.0.0.10"));
    expect(outro.status).toBe(404);
  });
});

describe("POST /api/coupons/redeem", () => {
  const url = "http://localhost/api/coupons/redeem";

  it("200 e marca USED", async () => {
    const cupom = await criarCupom({ percent: 10 });

    const resposta = await redeemRoute(requisicao(url, { code: cupom.code }, "10.1.0.1"));

    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({
      redeemed: true,
      code: cupom.code,
      percent: 10,
    });
    const depois = await prisma.coupon.findUnique({ where: { code: cupom.code } });
    expect(depois?.status).toBe("USED");
  });

  it("409 no segundo resgate", async () => {
    const cupom = await criarCupom({});
    await redeemRoute(requisicao(url, { code: cupom.code }, "10.1.0.2"));

    const resposta = await redeemRoute(requisicao(url, { code: cupom.code }, "10.1.0.2"));
    expect(resposta.status).toBe(409);
  });

  it("410 para cupom expirado com status ACTIVE", async () => {
    const cupom = await criarCupom({ expiresAt: ONTEM() });
    const resposta = await redeemRoute(requisicao(url, { code: cupom.code }, "10.1.0.3"));
    expect(resposta.status).toBe(410);
  });

  it("CORRIDA pela rota: 5 resgates simultaneos, 1 sucesso e 4 falhas", async () => {
    const cupom = await criarCupom({});

    // IPs distintos para o rate limit nao mascarar o resultado: queremos que as
    // 5 cheguem ao banco e que seja o UPDATE, nao a cota, a decidir.
    const respostas = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        redeemRoute(requisicao(url, { code: cupom.code }, `10.2.0.${i}`)),
      ),
    );

    const statuses = respostas.map((r) => r.status);
    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
    expect(statuses.filter((s) => s !== 200)).toHaveLength(4);
  });
});
