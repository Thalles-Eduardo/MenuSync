/**
 * Estilos dos campos do /carrinho.
 *
 * Vivem num modulo proprio porque o painel de pagamento e o campo de cupom
 * estao lado a lado na mesma tela: se cada um repetisse a string, um ajuste de
 * altura ou de anel de foco em so um deles deixaria a tela desalinhada sem
 * ninguem perceber.
 */

export const campo =
  "h-11 w-full rounded-xl border-0 bg-dark-blue/60 px-3 text-sm text-white shadow-[0_0_0_1.5px_rgba(255,255,255,0.12)] backdrop-blur-sm transition-all duration-300 outline-none placeholder:text-white/40 focus:shadow-[0_0_0_2px_rgba(227,199,123,0.9)]";

export const rotulo = "mb-1 block text-xs text-white/50";
