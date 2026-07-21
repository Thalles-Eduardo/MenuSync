import type { Dish } from "./dishes";
import { menu, type MenuItem } from "./menu";
import { precoFinal } from "../_lib/price";
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

export function deMenuItem(item: MenuItem): CartInput {
  return {
    id: item.id,
    name: item.name,
    image: item.image,
    weight: item.weight,
    precoOriginal: item.price,
    unitPrice: precoFinal(item),
  };
}

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
 * `Dish` não tem `weight` nem `discount`. Os 4 pratos do hero existem no `menu`
 * com o mesmo id, então herdamos de lá para a linha do carrinho ficar consistente
 * venha de onde vier. Sem correspondência, cai para o preço do próprio Dish.
 */
export function deDish(dish: Dish): CartInput {
  const equivalente = menu.find((m) => m.id === dish.id);

  if (!equivalente) {
    return {
      id: dish.id,
      name: dish.name,
      image: dish.thumb,
      weight: "",
      precoOriginal: dish.price,
      unitPrice: dish.price,
    };
  }

  return { ...deMenuItem(equivalente), image: dish.thumb };
}
