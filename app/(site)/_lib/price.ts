// Regra de preço compartilhada. Antes duplicada em MenuItemCard, HeroText e MenuBento.

export const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type Precificavel = { price: number; discount?: number };

export function temDesconto(item: { discount?: number }): boolean {
  return typeof item.discount === "number" && item.discount > 0;
}

/** Preço efetivo ("por"), com o desconto percentual já aplicado. */
export function precoFinal(item: Precificavel): number {
  return temDesconto(item) ? item.price * (1 - item.discount! / 100) : item.price;
}
