import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * O que as paginas recebem. NAO e o registro do Prisma, por dois motivos:
 *
 * 1. `Decimal` nao atravessa a fronteira Server -> Client Component (nao e
 *    serializavel). A conversao tem que acontecer em algum lugar; melhor um so.
 * 2. `unitPrice` sai pronto daqui. Antes, precoFinal() rodava no cliente em
 *    float. Passando calculado, o cliente deixa de fazer aritmetica de dinheiro
 *    — o mesmo principio que ja vale para o percentual do cupom.
 */
export type ProdutoDTO = {
  slug: string;
  name: string;
  description: string;
  weight: string;
  image: string;
  price: number;
  unitPrice: number;
  discount: number | null;
};

export type CategoriaDTO = {
  slug: string;
  label: string;
};

const CEM = new Prisma.Decimal(100);

function calcularUnitPrice(
  price: Prisma.Decimal,
  discount: number | null,
): Prisma.Decimal {
  if (discount === null || discount <= 0) return price;
  // Arredonda aqui, uma vez, com a regra explicita. Deixar para o formatador do
  // cliente faria cada tela decidir sozinha.
  return price
    .mul(CEM.minus(discount))
    .div(CEM)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

const SELECAO = {
  slug: true,
  name: true,
  description: true,
  weight: true,
  image: true,
  price: true,
  discount: true,
} as const;

type LinhaProduto = {
  slug: string;
  name: string;
  description: string;
  weight: string;
  image: string;
  price: Prisma.Decimal;
  discount: number | null;
};

function paraDTO(linha: LinhaProduto): ProdutoDTO {
  return {
    slug: linha.slug,
    name: linha.name,
    description: linha.description,
    weight: linha.weight,
    image: linha.image,
    price: linha.price.toNumber(),
    unitPrice: calcularUnitPrice(linha.price, linha.discount).toNumber(),
    discount: linha.discount,
  };
}

export async function listarCategorias(): Promise<CategoriaDTO[]> {
  const linhas = await prisma.category.findMany({
    orderBy: { position: "asc" },
    select: { slug: true, label: true },
  });
  return linhas;
}

export async function listarProdutos(): Promise<
  (ProdutoDTO & { categorySlug: string })[]
> {
  const linhas = await prisma.product.findMany({
    where: { available: true },
    orderBy: [{ category: { position: "asc" } }, { name: "asc" }],
    select: { ...SELECAO, category: { select: { slug: true } } },
  });
  return linhas.map((l) => ({ ...paraDTO(l), categorySlug: l.category.slug }));
}

/**
 * A home pede 4 pratos especificos e a ordem importa (o primeiro e o que abre
 * em destaque). O Postgres nao devolve na ordem do IN, entao reordenamos aqui.
 * Slug inexistente simplesmente nao aparece: e conteudo editorial, nao pode
 * derrubar a home.
 */
export async function buscarProdutosPorSlug(
  slugs: string[],
): Promise<ProdutoDTO[]> {
  if (slugs.length === 0) return [];

  const linhas = await prisma.product.findMany({
    where: { slug: { in: slugs } },
    select: SELECAO,
  });

  const porSlug = new Map(linhas.map((l) => [l.slug, paraDTO(l)]));
  return slugs
    .map((s) => porSlug.get(s))
    .filter((p): p is ProdutoDTO => p !== undefined);
}
