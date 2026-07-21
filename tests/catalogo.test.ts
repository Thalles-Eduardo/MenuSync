import { describe, expect, it } from "vitest";
import { listarCategorias, listarProdutos, buscarProdutosPorSlug } from "@/lib/catalogo/queries";

// Testes de LEITURA sobre os dados do seed. Nao escrevem nada, entao nao
// precisam de limpeza e nao podem corromper o banco de desenvolvimento.
describe("catalogo", () => {
  it("lista as 6 categorias na ordem de position", async () => {
    const categorias = await listarCategorias();
    expect(categorias.map((c) => c.slug)).toEqual([
      "sushi",
      "rolls",
      "entradas",
      "quentes",
      "sobremesas",
      "bebidas",
    ]);
  });

  it("lista os 22 produtos com preco como number", async () => {
    const produtos = await listarProdutos();
    expect(produtos).toHaveLength(22);

    const sushi10 = produtos.find((p) => p.slug === "sushi-10");
    expect(sushi10).toBeDefined();
    expect(sushi10!.price).toBe(89.9);
    expect(typeof sushi10!.price).toBe("number");
  });

  it("sem desconto, unitPrice e igual a price", async () => {
    const [p] = await buscarProdutosPorSlug(["sushi-10"]);
    expect(p.discount).toBeNull();
    expect(p.unitPrice).toBe(89.9);
  });

  // A assercao decisiva: em float, 78.90 * (1 - 15/100) da 67.065 e o
  // arredondamento fica a cargo de quem exibe. Em Decimal o servidor entrega
  // 67.07 pronto, e o cliente nao faz aritmetica de dinheiro nenhuma.
  it("com desconto, unitPrice vem arredondado a 2 casas do servidor", async () => {
    const [p] = await buscarProdutosPorSlug(["sashimi-misto"]);
    expect(p.discount).toBe(15);
    expect(p.price).toBe(78.9);
    expect(p.unitPrice).toBe(67.07);
  });

  // O caso que distingue Decimal de float. Em float,
  // 46.9 * (1 - 15/100) === 39.864999999999995, que arredonda para 39.86 e
  // PERDE um centavo. O valor exato e 39.8650, que com ROUND_HALF_UP da 39.87.
  // Se este teste falhar com 39.86, o calculo voltou a passar por float.
  it("nao perde o centavo que o float perdia (yakisoba)", async () => {
    const [p] = await buscarProdutosPorSlug(["yakisoba"]);
    expect(p.unitPrice).toBe(39.87);
    expect(p.unitPrice).not.toBe(46.9 * (1 - 15 / 100));
  });

  it("preserva a ordem dos slugs pedidos", async () => {
    const slugs = ["okonomiyaki", "teishoku", "sushi-10"];
    const produtos = await buscarProdutosPorSlug(slugs);
    expect(produtos.map((p) => p.slug)).toEqual(slugs);
  });

  it("ignora slug inexistente em vez de estourar", async () => {
    const produtos = await buscarProdutosPorSlug(["sushi-10", "nao-existe"]);
    expect(produtos.map((p) => p.slug)).toEqual(["sushi-10"]);
  });
});
