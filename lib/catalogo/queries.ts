// Falha no build se um Client Component importar este modulo. Sem isto o erro
// apareceria como uma falha opaca de bundling do `pg`.
import "server-only";
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

/**
 * ATENCAO para quem for escrever OrderItems/Payments: o valor devolvido aqui e
 * de EXIBICAO. O arredondamento acontece por unidade, antes de existir
 * quantidade — e multiplicar o unitario ja arredondado diverge de arredondar o
 * total da linha uma vez so (39.87 x 3 = 119.61, contra 119.60 arredondando no
 * fim). O total de uma linha de pedido deve sair de `price` e `discount`, que o
 * DTO tambem carrega, nao da multiplicacao deste campo.
 */
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

// Derivado de SELECAO, nao escrito a mao: tipagem estrutural deixaria passar
// em silencio um campo NOVO adicionado ao select (so pega campo removido ou
// renomeado). Com o tipo derivado, um campo a mais em SELECAO aparece aqui
// tambem, e o compiler avisa se paraDTO nao o usar.
type LinhaProduto = Prisma.ProductGetPayload<{ select: typeof SELECAO }>;

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
    // Mesmo filtro de listarProdutos. Sem ele, um prato esgotado sumia do
    // /cardapio mas continuava no hero da home, com o botao de adicionar ao
    // carrinho funcionando.
    where: { slug: { in: slugs }, available: true },
    select: SELECAO,
  });

  const porSlug = new Map(linhas.map((l) => [l.slug, paraDTO(l)]));
  return slugs
    .map((s) => porSlug.get(s))
    .filter((p): p is ProdutoDTO => p !== undefined);
}
