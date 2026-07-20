import { randomInt } from "node:crypto";

// Sem I, O, 0 e 1: o codigo e transcrito a mao do e-mail para o checkout, e esses
// quatro sao os pares que as pessoas confundem lendo. 32 simbolos.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const TAMANHO = 8;

export const PREFIXO = "SAKURA10-";

/**
 * Gera um codigo de cupom no formato `SAKURA10-XXXXXXXX`.
 *
 * A origem da aleatoriedade e criptografica (`crypto.randomInt`) porque este
 * codigo CONCEDE DESCONTO. `Math.random` usa um PRNG nao criptografico e com
 * estado observavel: quem coleta alguns codigos emitidos consegue reconstruir o
 * estado do gerador e prever os proximos — ou seja, fabricar cupons validos sem
 * nunca ter recebido um e-mail. `randomInt` tambem evita o vies de modulo que
 * um `% ALFABETO.length` cru introduziria.
 *
 * 8 caracteres em 32 simbolos dao ~40 bits, o que torna a adivinhacao cega
 * inviavel; 4 caracteres (~20 bits) seriam forca-brutaveis.
 */
export function gerarCodigo(): string {
  let corpo = "";
  for (let i = 0; i < TAMANHO; i += 1) {
    corpo += ALFABETO[randomInt(ALFABETO.length)];
  }
  return `${PREFIXO}${corpo}`;
}
