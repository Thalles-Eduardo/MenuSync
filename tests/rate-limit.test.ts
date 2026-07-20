import { beforeEach, describe, expect, it } from "vitest";
import { consumirCota, resetarRateLimit, tamanhoRateLimit } from "@/lib/rate-limit";

// Unitario: nao toca banco nem rota. Cobre o mecanismo que as cotas por IP e por
// e-mail da rota usam por baixo.
describe("rate limit (janela fixa em memoria)", () => {
  beforeEach(() => {
    resetarRateLimit();
  });

  it("permite ate o limite e bloqueia a partir dai", () => {
    const resultados = Array.from({ length: 7 }, () =>
      consumirCota("chave-a", { limite: 5, janelaMs: 60_000 }).permitido,
    );

    expect(resultados).toEqual([true, true, true, true, true, false, false]);
  });

  it("conta restantes de forma decrescente e para em zero", () => {
    const restantes = Array.from({ length: 7 }, () =>
      consumirCota("chave-b", { limite: 5, janelaMs: 60_000 }).restantes,
    );

    expect(restantes).toEqual([4, 3, 2, 1, 0, 0, 0]);
  });

  it("mantem chaves independentes: estourar uma nao afeta a outra", () => {
    for (let i = 0; i < 5; i += 1) consumirCota("vitima", { limite: 5, janelaMs: 60_000 });

    expect(consumirCota("vitima", { limite: 5, janelaMs: 60_000 }).permitido).toBe(false);
    expect(consumirCota("outra", { limite: 5, janelaMs: 60_000 }).permitido).toBe(true);
  });

  it("libera de novo quando a janela vence", () => {
    // Janela de 1ms: a proxima chamada ja cai na janela seguinte.
    consumirCota("chave-c", { limite: 1, janelaMs: 1 });
    const bloqueado = consumirCota("chave-c", { limite: 1, janelaMs: 100_000 }).permitido;
    expect(bloqueado).toBe(false);

    // Com janela vencida (resetAt no passado) o registro e recriado do zero.
    const depois = new Promise<boolean>((resolver) => {
      setTimeout(() => resolver(consumirCota("chave-c", { limite: 1, janelaMs: 1 }).permitido), 5);
    });

    return expect(depois).resolves.toBe(true);
  });

  it("nao incrementa alem do limite (quem estourou nao empurra a propria contagem)", () => {
    const opcoes = { limite: 2, janelaMs: 60_000 };
    consumirCota("chave-d", opcoes);
    const segunda = consumirCota("chave-d", opcoes);
    const terceira = consumirCota("chave-d", opcoes);
    const quarta = consumirCota("chave-d", opcoes);

    // O resetAt nao se move a cada tentativa bloqueada: a janela continua sendo
    // a original, senao quem faz flood empurraria o proprio desbloqueio adiante.
    expect(terceira.resetAt).toBe(segunda.resetAt);
    expect(quarta.resetAt).toBe(segunda.resetAt);
  });

  it("resetarRateLimit descarta todo o estado acumulado", () => {
    consumirCota("chave-e");
    consumirCota("chave-f");
    expect(tamanhoRateLimit()).toBe(2);

    resetarRateLimit();
    expect(tamanhoRateLimit()).toBe(0);
  });

  it("prefixos de dimensao diferentes nao compartilham bucket", () => {
    // E o que impede alguem de queimar a cota de `email:vitima@x.com` mandando
    // esse texto no x-forwarded-for: a rota prefixa `ip:` e `email:`.
    for (let i = 0; i < 5; i += 1) consumirCota("ip:email:vitima@x.com", { limite: 5 });

    expect(consumirCota("ip:email:vitima@x.com", { limite: 5 }).permitido).toBe(false);
    expect(consumirCota("email:vitima@x.com", { limite: 3 }).permitido).toBe(true);
  });
});
