"use client";

import { useState, type FormEvent } from "react";
import { useCart } from "../../_components/CartProvider";
import { campo, rotulo } from "./campos";

/**
 * Campo de resgate do cupom.
 *
 * Nao guarda percentual nenhum: tudo que ele conhece do desconto vem do
 * `cupom` do CartProvider, que por sua vez so existe depois de o servidor
 * confirmar o codigo.
 */
export default function CupomField() {
  const { cupom, aplicandoCupom, erroCupom, aplicarCupom, removerCupom } = useCart();
  const [codigo, setCodigo] = useState("");

  const vazio = codigo.trim().length === 0;
  // Desabilitado no vazio E no loading: sem isso, dois cliques rapidos disparam
  // duas requisicoes e a segunda gasta cota do rate limit a toa.
  const bloqueado = vazio || aplicandoCupom;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (bloqueado) return;
    await aplicarCupom(codigo);
    setCodigo("");
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-dark-blue/70 p-6 backdrop-blur-sm">
      {cupom ? (
        // Estado "aplicado": o formulario sai de cena. Deixa-lo junto sugeriria
        // que da para acumular cupons, e so vale um por pedido.
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.2em] text-yellow/80">CUPOM APLICADO</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {cupom.code}{" "}
              <span className="font-normal text-white/60">
                (−{cupom.percent}%)
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={removerCupom}
            aria-label={`Remover o cupom ${cupom.code}`}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white/40 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-dark-blue"
          >
            Remover
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {/* Rotulo visivel, nao sr-only: e um campo de acao cuja funcao nao da
              para adivinhar pelo placeholder. */}
          <label htmlFor="cupom-codigo" className={rotulo}>
            Cupom de desconto
          </label>

          <div className="flex gap-3">
            <input
              id="cupom-codigo"
              name="cupom"
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              disabled={aplicandoCupom}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              placeholder="SAKURA10-XXXXXXXX"
              // aria-invalid so no erro: marcar sempre faria o leitor de tela
              // anunciar "invalido" num campo que o usuario nem preencheu.
              aria-invalid={erroCupom ? true : undefined}
              aria-describedby="cupom-feedback"
              className={`${campo} flex-1 tracking-wider disabled:cursor-not-allowed disabled:opacity-60`}
            />
            <button
              type="submit"
              disabled={bloqueado}
              aria-busy={aplicandoCupom}
              // Secundario de proposito: "Finalizar pedido" e o unico botao
              // preenchido da tela, e dois primarios brigariam pela atencao.
              className="h-11 shrink-0 rounded-xl border border-white/20 px-5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-dark-blue disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-white/20 disabled:hover:bg-transparent"
            >
              {aplicandoCupom ? "Aplicando…" : "Aplicar"}
            </button>
          </div>
        </form>
      )}

      {/* Container do feedback existe SEMPRE, mesmo vazio: um aria-live que so
          entra no DOM junto com a mensagem costuma nao ser anunciado, porque o
          leitor de tela precisa ja estar observando a regiao. */}
      <p
        id="cupom-feedback"
        role="status"
        aria-live="polite"
        className="mt-3 min-h-5 text-sm"
      >
        {erroCupom ? (
          // Cor nunca sozinha: o simbolo carrega o mesmo significado para quem
          // nao distingue as cores. salmon-soft, e nao salmon, por contraste
          // (medido sobre o fundo real desta caixa).
          <span className="text-salmon-soft">
            <span aria-hidden="true">✕ </span>
            {erroCupom}
          </span>
        ) : cupom ? (
          <span className="text-yellow">
            <span aria-hidden="true">✓ </span>
            Desconto de {cupom.percent}% aplicado ao total.
          </span>
        ) : null}
      </p>
    </div>
  );
}
