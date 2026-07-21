import type { Dish } from "./dishes";
import type { ProdutoDTO } from "@/lib/catalogo/queries";

export type CartItem = {
  id: string;
  name: string;
  image: string;
  weight: string;
  precoOriginal: number; // preço de tabela ("de")
  unitPrice: number; // já com desconto aplicado ("por")
  quantity: number;
};

/** Um produto pronto para entrar no carrinho, ainda sem quantidade. */
export type CartInput = Omit<CartItem, "quantity">;

export function deProduto(p: ProdutoDTO): CartInput {
  return {
    // O id da linha do carrinho continua sendo o slug — e o que ja esta
    // gravado no localStorage de quem tem carrinho aberto.
    id: p.slug,
    name: p.name,
    image: p.image,
    weight: p.weight,
    precoOriginal: p.price,
    unitPrice: p.unitPrice,
  };
}

/**
 * O `menu.find` que morava aqui existia para o carrinho nao cobrar o preco
 * desatualizado de dishes.ts. Com Product como fonte unica, dish.price E o
 * preco do banco — o contorno deixou de ser necessario.
 */
export function deDish(dish: Dish): CartInput {
  return {
    id: dish.id,
    name: dish.name,
    image: dish.thumb, // a home usa a miniatura, nao a imagem do catalogo
    weight: "",
    precoOriginal: dish.price,
    unitPrice: dish.unitPrice,
  };
}
