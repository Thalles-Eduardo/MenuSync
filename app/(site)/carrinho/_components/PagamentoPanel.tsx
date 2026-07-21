"use client";

import { useState, type FormEvent } from "react";
import { useCart } from "../../_components/CartProvider";
import { brl } from "../../_lib/price";
import { campo, rotulo } from "./campos";

/** Agrupa em blocos de 4: "4111111111111111" → "4111 1111 1111 1111". */
function mascaraCartao(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 16);
  return digitos.replace(/(.{4})/g, "$1 ").trim();
}

export default function PagamentoPanel({
  total,
  onConfirm,
}: {
  total: number;
  onConfirm: () => void;
}) {
  // Estado LOCAL de propósito: nada aqui entra no CartProvider nem no localStorage.
  const [nome, setNome] = useState("");
  const [numero, setNumero] = useState("");
  const [mes, setMes] = useState("");
  const [ano, setAno] = useState("");
  const [cvv, setCvv] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [finalizando, setFinalizando] = useState(false);

  const { consumirCupom } = useCart();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Reentrada: sem esta guarda, dois cliques disparariam dois redeem do mesmo
    // cupom. O servidor recusaria o segundo (o update e condicional), mas o
    // usuario levaria um "cupom ja utilizado" causado pelo proprio clique duplo.
    if (finalizando) return;

    const digitos = numero.replace(/\D/g, "");
    const m = Number(mes);
    const a = Number(ano);
    const agora = new Date();

    if (nome.trim().length < 3) return setErro("Informe o nome como está no cartão.");
    if (digitos.length !== 16) return setErro("O número do cartão precisa ter 16 dígitos.");
    if (!(m >= 1 && m <= 12)) return setErro("Mês inválido.");
    if (!a || a < agora.getFullYear() || (a === agora.getFullYear() && m < agora.getMonth() + 1))
      return setErro("Cartão vencido.");
    if (cvv.replace(/\D/g, "").length !== 3) return setErro("CVV precisa ter 3 dígitos.");

    setErro(null);
    setFinalizando(true);

    try {
      // O cupom so e consumido AQUI, ao finalizar — validar no campo nao gasta
      // nada. Se ele deixou de valer nesse meio tempo (outra aba, expiracao), o
      // pedido NAO segue: o provider ja tirou o desconto da tela e o usuario
      // precisa ver o preco real antes de confirmar de novo.
      const consumido = await consumirCupom();
      if (!consumido) {
        setErro("O cupom nao vale mais. Confira o total e finalize de novo.");
        return;
      }

      onConfirm();
    } finally {
      setFinalizando(false);
    }
  }

  return (
    <aside className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm lg:sticky lg:top-28">
      <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-eczar), serif" }}>
        Pagamento
      </h2>
      <p className="mt-1 text-xs text-white/45">
        Demonstração — nenhum pagamento é processado e nenhum dado é enviado.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" autoComplete="off">
        <div>
          <label htmlFor="pag-nome" className={rotulo}>Nome no cartão</label>
          <input
            id="pag-nome"
            className={campo}
            value={nome}
            autoComplete="off"
            placeholder="Como está no cartão"
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="pag-numero" className={rotulo}>Número do cartão</label>
          <input
            id="pag-numero"
            className={campo}
            value={numero}
            inputMode="numeric"
            autoComplete="off"
            placeholder="0000 0000 0000 0000"
            onChange={(e) => setNumero(mascaraCartao(e.target.value))}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="pag-mes" className={rotulo}>Mês</label>
            <input
              id="pag-mes"
              className={campo}
              value={mes}
              inputMode="numeric"
              autoComplete="off"
              placeholder="mm"
              onChange={(e) => setMes(e.target.value.replace(/\D/g, "").slice(0, 2))}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="pag-ano" className={rotulo}>Ano</label>
            <input
              id="pag-ano"
              className={campo}
              value={ano}
              inputMode="numeric"
              autoComplete="off"
              placeholder="aaaa"
              onChange={(e) => setAno(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="pag-cvv" className={rotulo}>CVV</label>
            <input
              id="pag-cvv"
              className={campo}
              value={cvv}
              inputMode="numeric"
              autoComplete="off"
              placeholder="000"
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
            />
          </div>
        </div>

        {erro && (
          <p role="alert" className="text-sm text-salmon">{erro}</p>
        )}

        <button
          type="submit"
          disabled={finalizando}
          aria-busy={finalizando}
          className="mt-2 h-12 w-full rounded-xl bg-yellow font-semibold text-dark-blue transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-dark-blue active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100"
        >
          {finalizando ? "Finalizando…" : `Finalizar pedido · ${brl.format(total)}`}
        </button>
      </form>
    </aside>
  );
}
