import type { Coupon } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { gerarCodigo } from "./code";

const DIAS_DE_VALIDADE = 30;
const MAX_TENTATIVAS_DE_CODIGO = 3;

export type ResultadoDoCupom = {
  coupon: Coupon;
  /**
   * Verdadeiro quando o e-mail ja tinha cupom e devolvemos o existente.
   *
   * Serve APENAS para log e telemetria. Quem chama nao pode variar a resposta
   * HTTP com base nisso: status, corpo ou mensagem diferentes transformariam o
   * endpoint num oraculo de "este e-mail esta cadastrado?" para qualquer um.
   */
  jaExistia: boolean;
};

export function normalizarEmail(email: string): string {
  // Sem isto, "Foo@x.com" e "foo@x.com" viram duas linhas e o dedupe do
  // "um cupom por e-mail" e contornavel so mudando a caixa de uma letra.
  return email.trim().toLowerCase();
}

function calcularValidade(agora = new Date()): Date {
  const validade = new Date(agora);
  validade.setDate(validade.getDate() + DIAS_DE_VALIDADE);
  return validade;
}

type ErroDoAdapter = {
  driverAdapterError?: {
    cause?: {
      constraint?: { fields?: unknown; index?: unknown };
      originalMessage?: unknown;
    };
  };
  target?: unknown;
};

/**
 * Extrai quais campos o P2002 acusou.
 *
 * A forma disso muda conforme o caminho: o Prisma "classico" preenche
 * `meta.target` (string[] ou string), mas com o driver adapter do Postgres
 * (Prisma 7) `meta.target` NAO existe — a informacao vem em
 * `meta.driverAdapterError.cause.constraint.fields`. Ler so `target` fazia o
 * conflito de e-mail escapar para o catch generico e virar 500 em vez de
 * devolver o cupom existente; foi exatamente o que aconteceu no primeiro teste
 * manual. Por isso lemos as duas formas, com o texto original como ultimo
 * recurso (ele cita o nome do indice, ex.: "coupons_email_key").
 */
function alvosDoP2002(erro: Prisma.PrismaClientKnownRequestError): string[] {
  const meta = (erro.meta ?? {}) as ErroDoAdapter;
  const alvos: string[] = [];

  if (Array.isArray(meta.target)) alvos.push(...meta.target.map(String));
  else if (typeof meta.target === "string") alvos.push(meta.target);

  const causa = meta.driverAdapterError?.cause;
  const campos = causa?.constraint?.fields;
  if (Array.isArray(campos)) alvos.push(...campos.map(String));
  if (typeof causa?.constraint?.index === "string") alvos.push(causa.constraint.index);
  if (typeof causa?.originalMessage === "string") alvos.push(causa.originalMessage);

  return alvos;
}

function ehViolacaoDe(campo: string, erro: Prisma.PrismaClientKnownRequestError): boolean {
  return alvosDoP2002(erro).some((alvo) => alvo.includes(campo));
}

/**
 * Cria o cupom do e-mail, ou devolve o que ja existe.
 *
 * PROIBIDO consultar antes de inserir (findFirst/findUnique como "ja existe?").
 * Check-then-insert tem janela de corrida: duas requisicoes simultaneas para o
 * mesmo e-mail passam pelas duas checagens antes de qualquer uma gravar, e o
 * "um cupom por e-mail" cai. A garantia e o indice UNIQUE do banco, que nao tem
 * essa janela — entao inserimos primeiro e tratamos o P2002 que voltar. O
 * findUnique so aparece DEPOIS do conflito, para carregar a linha vencedora.
 */
export async function criarOuRecuperarCupom(email: string): Promise<ResultadoDoCupom> {
  const emailNormalizado = normalizarEmail(email);

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS_DE_CODIGO; tentativa += 1) {
    try {
      const coupon = await prisma.coupon.create({
        data: {
          email: emailNormalizado,
          code: gerarCodigo(),
          expiresAt: calcularValidade(),
        },
      });
      return { coupon, jaExistia: false };
    } catch (erro) {
      if (!(erro instanceof Prisma.PrismaClientKnownRequestError) || erro.code !== "P2002") {
        throw erro;
      }

      if (ehViolacaoDe("email", erro)) {
        const existente = await prisma.coupon.findUnique({
          where: { email: emailNormalizado },
        });

        // Nao deveria acontecer, mas se a linha sumiu entre o conflito e a
        // leitura, propagar e melhor do que devolver um cupom inventado.
        if (!existente) {
          throw new Error("Conflito de e-mail sem linha correspondente no banco");
        }

        return { coupon: existente, jaExistia: true };
      }

      if (ehViolacaoDe("code", erro)) {
        // ~40 bits de entropia tornam colisao praticamente impossivel, mas
        // "praticamente" nao e "nunca": regenera e tenta de novo.
        continue;
      }

      throw erro;
    }
  }

  throw new Error(
    `Nao foi possivel gerar um codigo unico apos ${MAX_TENTATIVAS_DE_CODIGO} tentativas`,
  );
}
