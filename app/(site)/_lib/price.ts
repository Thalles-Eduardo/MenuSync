// Formatador compartilhado. `precoFinal`/`temDesconto` moravam aqui e faziam a
// conta do desconto em float no cliente; agora o servidor entrega `unitPrice`
// pronto (ver lib/catalogo/queries.ts).

export const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
