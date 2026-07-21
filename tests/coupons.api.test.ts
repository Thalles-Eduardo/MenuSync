import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
// ATENCAO: importar SEMPRE por "@/...", os mesmos especificadores que
// app/api/coupons/route.ts usa. Um caminho relativo aqui criaria uma segunda
// instancia do modulo do mailer no cache, o stub abaixo seria registrado nela e a
// rota chamaria a Resend de verdade (ja aconteceu).
import { POST } from "@/app/api/coupons/route";
import { definirEnviador, type CupomParaEnvio } from "@/lib/coupons/mailer";
import { criarOuRecuperarCupom } from "@/lib/coupons/service";
import { prisma } from "@/lib/prisma";
import { resetarRateLimit } from "@/lib/rate-limit";

// Dominio proprio dos testes: a limpeza apaga SO o que termina nele. A tabela tem
// linhas legitimas (inclusive um cupom real do usuario) que nao podem ser tocadas.
const DOMINIO = "vitest.local";
const FORMATO_CODIGO = /^SAKURA10-[A-Z2-9]{8}$/;

// Termos que jamais podem aparecer num corpo de erro: revelam schema, nome de
// constraint, dialeto do banco ou caminho de arquivo do servidor.
const TERMOS_PROIBIDOS = [
  "prisma",
  "postgres",
  "postgresql",
  "23505",
  "p2002",
  "coupons",
  "constraint",
  "unique",
  "select ",
  "insert ",
  "\n    at ",
  ".ts:",
  "stack",
  "node_modules",
  "c:\\",
  "/lib/coupons",
];

type CorpoObservado = { caso: string; status: number; body: string };

// Acumuladores globais do arquivo: as varreduras finais (vazamento de codigo e de
// detalhe interno) rodam sobre TUDO que a suite ja viu, nao so sobre um caso.
const corposCrus: CorpoObservado[] = [];
const enviados: CupomParaEnvio[] = [];
let falharEnvio = false;

definirEnviador({
  async enviar(cupom) {
    if (falharEnvio) throw new Error("stub: envio recusado");
    enviados.push({ ...cupom });
  },
});

type Resposta = { status: number; body: string; contentType: string | null };

async function chamar(
  email: unknown,
  ip: string,
  { corpoCru, caso = "?" }: { corpoCru?: string; caso?: string } = {},
): Promise<Resposta> {
  const request = new Request("http://localhost:3000/api/coupons", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: corpoCru !== undefined ? corpoCru : JSON.stringify({ email }),
  });

  const resposta = await POST(request);
  const body = await resposta.text();
  corposCrus.push({ caso, status: resposta.status, body });

  return { status: resposta.status, body, contentType: resposta.headers.get("content-type") };
}

function linhasDe(email: string) {
  return prisma.coupon.findMany({ where: { email: email.trim().toLowerCase() } });
}

function limparDominioDeTeste() {
  return prisma.coupon.deleteMany({ where: { email: { endsWith: `@${DOMINIO}` } } });
}

beforeAll(async () => {
  await limparDominioDeTeste();
});

beforeEach(async () => {
  // Cada teste comeca com cota cheia e sem linhas do dominio de teste. Os testes
  // sao autocontidos de proposito: nenhum depende da linha que o anterior criou.
  resetarRateLimit();
  falharEnvio = false;
  await limparDominioDeTeste();
});

afterAll(async () => {
  await limparDominioDeTeste();
  await prisma.$disconnect();
});

describe("POST /api/coupons — ciclo feliz", () => {
  it("e-mail valido responde 200, grava UMA linha ACTIVE e o codigo casa o formato", async () => {
    const email = `caso1@${DOMINIO}`;
    const resposta = await chamar(email, "10.0.0.1", { caso: "1" });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toBe('{"ok":true}');

    const linhas = await linhasDe(email);
    expect(linhas).toHaveLength(1);
    expect(linhas[0].code).toMatch(FORMATO_CODIGO);
    expect(linhas[0].status).toBe("ACTIVE");
  });

  it("repetir o mesmo e-mail continua com UMA linha e reenvia o MESMO codigo", async () => {
    const email = `caso2@${DOMINIO}`;
    const primeira = await chamar(email, "10.0.0.2", { caso: "2" });
    const codigoInicial = (await linhasDe(email))[0]?.code;

    const segunda = await chamar(email, "10.0.0.2", { caso: "2" });

    expect(primeira.status).toBe(200);
    expect(segunda.status).toBe(200);

    const linhas = await linhasDe(email);
    expect(linhas).toHaveLength(1);
    expect(linhas[0].code).toBe(codigoInicial);

    // O stub prova que o canal e o e-mail: dois envios, o mesmo codigo nos dois.
    const paraEsteEmail = enviados.filter((e) => e.email === email);
    expect(paraEsteEmail).toHaveLength(2);
    expect(paraEsteEmail.every((e) => e.code === codigoInicial)).toBe(true);
  });

  it("normalizacao: FOO@X depois de foo@x nao cria segunda linha", async () => {
    const email = `caso3@${DOMINIO}`;
    await chamar(email, "10.0.0.3", { caso: "3a" });
    const codigoInicial = (await linhasDe(email))[0]?.code;

    const resposta = await chamar(`CASO3@${DOMINIO.toUpperCase()}`, "10.0.0.3", { caso: "3b" });
    expect(resposta.status).toBe(200);

    const linhas = await prisma.coupon.findMany({
      where: { email: { contains: "caso3", mode: "insensitive" } },
    });
    expect(linhas).toHaveLength(1);
    expect(linhas[0].code).toBe(codigoInicial);
    // Gravado sempre em minusculas, senao o dedupe cai trocando a caixa de uma letra.
    expect(linhas[0].email).toBe(email);
  });

  it("trim: espaco em volta do endereco e aceito e gravado sem espaco", async () => {
    // O `.trim()` do Zod roda ANTES do servico. Sem ele um endereco colado com
    // espaco (o caso mais comum de copiar e colar) levava 400.
    const email = `espacos@${DOMINIO}`;
    const resposta = await chamar(`  ${email}  `, "10.0.0.4", { caso: "trim" });

    expect(resposta.status).toBe(200);
    expect(await prisma.coupon.findUnique({ where: { email } })).not.toBeNull();
  });

  it("espaco + caixa alta juntos nao criam segunda linha nem trocam o codigo", async () => {
    const email = `caso11-trim@${DOMINIO}`;
    await chamar(email, "10.0.0.5", { caso: "11a" });
    const codigoInicial = (await linhasDe(email))[0]?.code;

    await chamar(`  ${email.toUpperCase()}  `, "10.0.0.5", { caso: "11a" });

    const linhas = await prisma.coupon.findMany({
      where: { email: { contains: "caso11-trim", mode: "insensitive" } },
    });
    expect(linhas).toHaveLength(1);
    expect(linhas[0].code).toBe(codigoInicial);
  });

  it("expiresAt fica a 30 dias de createdAt (tolerancia de 10 min)", async () => {
    const email = `caso10@${DOMINIO}`;
    await chamar(email, "10.0.0.6", { caso: "10" });

    const linha = (await linhasDe(email))[0];
    const trintaDias = 30 * 24 * 60 * 60 * 1000;
    const delta = linha.expiresAt.getTime() - linha.createdAt.getTime();
    const desvioEmMinutos = Math.abs(delta - trintaDias) / 60_000;

    expect(desvioEmMinutos).toBeLessThanOrEqual(10);
  });
});

describe("POST /api/coupons — entrada invalida", () => {
  const invalidos = ["nao-e-email", "", "a@", "@b.com", "a b@c.com"];

  it.each(invalidos)('e-mail invalido "%s" responde 400', async (alvo) => {
    const resposta = await chamar(alvo, "10.0.0.10", { caso: "4" });
    expect(resposta.status).toBe(400);
  });

  it("corpo que nao e JSON responde 400", async () => {
    const resposta = await chamar(null, "10.0.0.10", { corpoCru: "isto nao e json", caso: "4" });
    expect(resposta.status).toBe(400);
  });

  it("corpo sem o campo email responde 400", async () => {
    const resposta = await chamar(null, "10.0.0.10", { corpoCru: "{}", caso: "4" });
    expect(resposta.status).toBe(400);
  });

  it("nenhuma entrada invalida cria linha no banco", async () => {
    const antes = await prisma.coupon.count();

    for (const alvo of invalidos) {
      resetarRateLimit();
      await chamar(alvo, "10.0.0.10", { caso: "4" });
    }
    resetarRateLimit();
    await chamar(null, "10.0.0.10", { corpoCru: "isto nao e json", caso: "4" });
    resetarRateLimit();
    await chamar(null, "10.0.0.10", { corpoCru: "{}", caso: "4" });

    expect(await prisma.coupon.count()).toBe(antes);
  });

  it("endereco acima de 254 chars e rejeitado e nao vira linha", async () => {
    // Sem o .max(254) do RFC 5321 cada string distinta de milhares de caracteres
    // virava uma linha nova: vetor de inchaco da tabela.
    const gigante = `${"a".repeat(300)}@${DOMINIO}`;
    const resposta = await chamar(gigante, "10.0.0.11", { caso: "11b" });

    expect(resposta.status).toBe(400);
    expect(await prisma.coupon.count({ where: { email: gigante } })).toBe(0);
  });

  it("endereco de exatamente 254 chars ainda e aceito", async () => {
    const sufixo = `@${DOMINIO}`;
    const email = "b".repeat(254 - sufixo.length) + sufixo;

    const resposta = await chamar(email, "10.0.0.12", { caso: "borda254" });
    expect(resposta.status).toBe(200);
  });

  it("endereco de 5000 chars nunca vira 500", async () => {
    const gigante = `${"a".repeat(5000)}@${DOMINIO}`;
    const resposta = await chamar(gigante, "10.0.0.13", { caso: "11b" });

    expect(resposta.status).not.toBe(500);
  });

  it("endereco sem TLD e tratado como entrada, nunca como erro do servidor", async () => {
    const resposta = await chamar("alguem@localhost", "10.0.0.14", { caso: "11c" });
    expect(resposta.status).toBeLessThan(500);
  });
});

describe("POST /api/coupons — rate limit", () => {
  it("cota por IP: 5 passam, a 6a e a 7a levam 429 com code RATE_LIMITED", async () => {
    const status: number[] = [];
    for (let i = 1; i <= 7; i += 1) {
      const resposta = await chamar(`caso5-${i}@${DOMINIO}`, "10.0.0.20", { caso: "5" });
      status.push(resposta.status);
    }

    expect(status).toEqual([200, 200, 200, 200, 200, 429, 429]);

    const bloqueada = corposCrus.filter((c) => c.caso === "5" && c.status === 429)[0];
    expect(JSON.parse(bloqueada.body).error.code).toBe("RATE_LIMITED");
  });

  it("cota por e-mail de destino segura mesmo o atacante trocando de IP", async () => {
    // O limite por IP nao cobre email bombing: basta trocar de IP. Sem a cota por
    // destinatario, o dedupe garantiria um unico cupom mas o ENVIO se repetiria a
    // cada requisicao, usando nossa infra para inundar a caixa da vitima.
    const alvo = `vitima@${DOMINIO}`;
    const status: number[] = [];

    for (let i = 0; i < 5; i += 1) {
      const resposta = await chamar(alvo, `172.16.0.${i}`, { caso: "cota-email" });
      status.push(resposta.status);
    }

    expect(status).toEqual([200, 200, 200, 429, 429]);
    expect(enviados.filter((e) => e.email === alvo)).toHaveLength(3);
    expect(await prisma.coupon.count({ where: { email: alvo } })).toBe(1);
  });

  it("prefixo de namespace impede queimar a cota da vitima via x-forwarded-for", async () => {
    // Sem o prefixo `ip:`/`email:`, mandar `x-forwarded-for: email:vitima@x` cairia
    // no MESMO bucket da cota por destinatario e trancaria a vitima de fora.
    const alvo = `vitima2@${DOMINIO}`;

    for (let i = 0; i < 6; i += 1) {
      await chamar(`ruido${i}@${DOMINIO}`, `email:${alvo}`, { caso: "namespace" });
    }

    const resposta = await chamar(alvo, "192.168.5.5", { caso: "namespace" });
    expect(resposta.status).toBe(200);
  });
});

describe("POST /api/coupons — corrida (a garantia e a constraint, nao check-then-insert)", () => {
  it("5 requisicoes SIMULTANEAS para e-mail novo produzem EXATAMENTE 1 linha", async () => {
    const email = `corrida@${DOMINIO}`;
    expect(await linhasDe(email)).toHaveLength(0);

    const respostas = await Promise.all(
      Array.from({ length: 5 }, () => chamar(email, "10.0.0.30", { caso: "7" })),
    );

    // A cota por destinatario (3/h) recorta as 5 em 3 aceitas + 2 bloqueadas. O
    // que esta sob teste aqui e a UNICIDADE sob concorrencia, entao o que importa
    // e que as que passaram disputaram o mesmo INSERT e so uma linha sobreviveu.
    const aceitas = respostas.filter((r) => r.status === 200).length;
    expect(aceitas).toBeGreaterThan(1);

    const linhas = await linhasDe(email);
    expect(linhas).toHaveLength(1);

    const codigosEntregues = new Set(
      enviados.filter((e) => e.email === email).map((e) => e.code),
    );
    expect(codigosEntregues.size).toBe(1);
    expect([...codigosEntregues][0]).toBe(linhas[0].code);
  });

  it("5 chamadas simultaneas ao servico produzem 1 linha e o mesmo codigo para todas", async () => {
    // Mesma corrida sem passar pelo rate limit, para as 5 baterem de fato no
    // INSERT ao mesmo tempo. E o teste que distingue constraint UNIQUE de
    // check-then-insert: com findFirst antes do create, as 5 passariam pela
    // checagem antes de qualquer uma gravar e nasceriam 5 linhas.
    const email = `corrida-servico@${DOMINIO}`;

    const resultados = await Promise.all(
      Array.from({ length: 5 }, () => criarOuRecuperarCupom(email)),
    );

    const linhas = await linhasDe(email);
    expect(linhas).toHaveLength(1);

    const codigos = new Set(resultados.map((r) => r.coupon.code));
    expect(codigos.size).toBe(1);
    expect([...codigos][0]).toBe(linhas[0].code);

    // Exatamente uma das cinco criou; as outras quatro recuperaram a existente.
    expect(resultados.filter((r) => !r.jaExistia)).toHaveLength(1);
  });
});

describe("POST /api/coupons — a resposta nao pode ser um oraculo", () => {
  it("e-mail NOVO e e-mail JA EXISTENTE respondem identico byte a byte", async () => {
    const email = `caso8@${DOMINIO}`;
    const novo = await chamar(email, "10.0.0.40", { caso: "8" });
    const existente = await chamar(email, "10.0.0.40", { caso: "8" });

    expect(existente.status).toBe(novo.status);
    expect(existente.contentType).toBe(novo.contentType);
    expect(Buffer.from(existente.body).toString("hex")).toBe(
      Buffer.from(novo.body).toString("hex"),
    );
  });

  it("falha de envio responde 5xx sem vazar a causa", async () => {
    falharEnvio = true;
    const resposta = await chamar(`caso9@${DOMINIO}`, "10.0.0.41", { caso: "9" });
    falharEnvio = false;

    expect(resposta.status).toBeGreaterThanOrEqual(500);
    expect(JSON.parse(resposta.body).error.code).toBe("SEND_FAILED");
    // O corpo carrega so um id de correlacao; o detalhe fica no log do servidor.
    expect(resposta.body).not.toMatch(/stub: envio recusado/);
  });
});

// Estes dois rodam por ultimo de proposito: varrem TODOS os corpos que a suite
// inteira acumulou, e nao so os de um caso.
describe("varredura final sobre todos os corpos observados", () => {
  it("o codigo do cupom NUNCA aparece em resposta alguma, nem nas de erro", async () => {
    const codigosConhecidos = new Set([
      ...(await prisma.coupon.findMany({ where: { email: { endsWith: `@${DOMINIO}` } } })).map(
        (c) => c.code,
      ),
      ...enviados.map((e) => e.code),
    ]);

    // Pre-condicao: se o stub nunca recebeu nada, a varredura abaixo passaria a
    // toa e o teste estaria mentindo.
    expect(enviados.length).toBeGreaterThan(0);
    expect(corposCrus.length).toBeGreaterThan(0);

    const vazamentos: string[] = [];
    for (const corpo of corposCrus) {
      if (/SAKURA10-/i.test(corpo.body)) {
        vazamentos.push(`caso ${corpo.caso}: prefixo SAKURA10-`);
      }
      for (const codigo of codigosConhecidos) {
        if (corpo.body.includes(codigo)) vazamentos.push(`caso ${corpo.caso}: codigo ${codigo}`);
        if (corpo.body.includes(codigo.replace("SAKURA10-", ""))) {
          vazamentos.push(`caso ${corpo.caso}: sufixo de ${codigo}`);
        }
      }
    }

    expect(vazamentos).toEqual([]);
  });

  it("nenhum corpo de erro vaza stack, dialeto do banco ou caminho de arquivo", () => {
    const corposDeErro = corposCrus.filter((c) => c.status >= 400);
    expect(corposDeErro.length).toBeGreaterThan(0);

    const vazamentos: string[] = [];
    for (const corpo of corposDeErro) {
      const minusculo = corpo.body.toLowerCase();
      for (const termo of TERMOS_PROIBIDOS) {
        if (minusculo.includes(termo)) {
          vazamentos.push(`caso ${corpo.caso} (${corpo.status}): "${termo}"`);
        }
      }
    }

    expect(vazamentos).toEqual([]);
  });
});
