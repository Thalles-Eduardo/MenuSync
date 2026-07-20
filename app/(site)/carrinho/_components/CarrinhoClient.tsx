"use client";

import { useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import Navbar from "../../_components/Navbar";
import SakuraCorners from "../../_components/SakuraCorners";
import TransitionLink from "../../_components/TransitionLink";
import { useCart } from "../../_components/CartProvider";
import { brl } from "../../_lib/price";
import PagamentoPanel from "./PagamentoPanel";

function Stepper({
  quantity,
  onChange,
  nome,
}: {
  quantity: number;
  onChange: (q: number) => void;
  nome: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`Diminuir quantidade de ${nome}`}
        onClick={() => onChange(quantity - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-lg text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        −
      </button>
      <span
        aria-live="polite"
        className="flex h-9 w-12 items-center justify-center rounded-md border border-white/15 text-sm"
      >
        {quantity}
      </span>
      <button
        type="button"
        aria-label={`Aumentar quantidade de ${nome}`}
        onClick={() => onChange(quantity + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-lg text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        +
      </button>
    </div>
  );
}

export default function CarrinhoClient() {
  const { items, hydrated, desconto, total, setQty, remove, clear } = useCart();
  const [enviado, setEnviado] = useState(false);

  const scope = useRef<HTMLDivElement>(null);
  const reduce = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  // Depende de `hydrated`: as linhas só existem no DOM depois da hidratação.
  // Sair cedo enquanto o esqueleto está na tela evita o aviso do GSAP de
  // "target .cart-line not found" no primeiro render.
  useGSAP(
    () => {
      if (reduce || !hydrated) return;
      gsap.fromTo(
        ".cart-line",
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "power3.out" },
      );
    },
    { scope, dependencies: [hydrated] },
  );

  return (
    <div
      ref={scope}
      className="relative min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat text-white"
      style={{
        backgroundColor: "var(--color-dark-blue)",
        backgroundImage: "url('/bgCardapioInk.webp')",
      }}
    >
      {/* Mesmo tratamento de fundo do /cardapio, para as duas rotas serem irmãs. */}
      <SakuraCorners active />
      <div
        className="pointer-events-none absolute inset-0 bg-dark-blue/70"
        aria-hidden="true"
      />

      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto max-w-6xl px-8 pt-28 pb-16 md:px-12">
          <p className="text-sm tracking-[0.3em] text-yellow/80">
            カート · CARRINHO
          </p>
          <h1
            className="mt-1 text-5xl font-bold md:text-6xl"
            style={{ fontFamily: "var(--font-eczar), serif" }}
          >
            Carrinho
          </h1>

          {/* Antes de hidratar mostramos um esqueleto, nunca o estado vazio:
              quem tem itens salvos veria "carrinho vazio" piscar. */}
          {!hydrated ? (
            <div className="mt-12 space-y-4" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl bg-white/5"
                />
              ))}
            </div>
          ) : enviado ? (
            /* Vem ANTES do ramo de carrinho vazio: clear() esvazia a lista, então
               a ordem inversa faria o sucesso cair no estado vazio. */
            <div
              role="status"
              className="mt-16 flex flex-col items-start gap-6"
            >
              <h2
                className="text-3xl font-bold text-yellow"
                style={{ fontFamily: "var(--font-eczar), serif" }}
              >
                Pedido enviado!
              </h2>
              <p className="text-white/70">
                Obrigado. Em breve você recebe a confirmação por e-mail.
              </p>
              <TransitionLink
                href="/cardapio"
                className="rounded-xl bg-yellow px-6 py-3 font-semibold text-dark-blue transition hover:brightness-105"
              >
                Voltar ao cardápio
              </TransitionLink>
            </div>
          ) : items.length === 0 ? (
            <div className="mt-16 flex flex-col items-start gap-6">
              <p className="text-lg text-white/70">Seu carrinho está vazio.</p>
              <TransitionLink
                href="/cardapio"
                className="rounded-xl bg-yellow px-6 py-3 font-semibold text-dark-blue transition hover:brightness-105"
              >
                Ver o cardápio
              </TransitionLink>
            </div>
          ) : (
            <div className="mt-12 grid gap-10 lg:grid-cols-3">
              <section className="lg:col-span-2">
                <ul>
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="cart-line flex items-center gap-4 border-b border-white/10 py-5"
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={120}
                        height={120}
                        className="h-16 w-16 rounded-xl object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{item.name}</p>
                        {item.weight && (
                          <p className="mt-0.5 text-xs text-white/50">
                            {item.weight}
                          </p>
                        )}
                      </div>

                      <Stepper
                        quantity={item.quantity}
                        nome={item.name}
                        onChange={(q) => setQty(item.id, q)}
                      />

                      <span
                        className="flex w-24 flex-col items-end leading-tight"
                        style={{ fontFamily: "var(--font-eczar), serif" }}
                      >
                        {item.precoOriginal > item.unitPrice && (
                          <span className="text-xs text-white/40 line-through">
                            {brl.format(item.precoOriginal * item.quantity)}
                          </span>
                        )}
                        <span className="text-lg">
                          {brl.format(item.unitPrice * item.quantity)}
                        </span>
                      </span>

                      <button
                        type="button"
                        aria-label={`Remover ${item.name}`}
                        onClick={() => remove(item.id)}
                        className="ml-2 text-xl text-white/40 transition hover:text-salmon"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                  <TransitionLink
                    href="/cardapio"
                    className="text-sm text-white/60 transition hover:text-caramel flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7 13L3 9M3 9L7 5M3 9H16C18.7614 9 21 11.2386 21 14C21 16.7614 18.7614 19 16 19H11"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Continuar comprando
                  </TransitionLink>

                  <div className="text-right">
                    {desconto > 0 && (
                      <p className="text-sm text-yellow">
                        Desconto: −{brl.format(desconto)}
                      </p>
                    )}
                    <p className="text-sm text-white/60">
                      Subtotal:{" "}
                      <span
                        className="text-2xl font-bold text-white"
                        style={{ fontFamily: "var(--font-eczar), serif" }}
                      >
                        {brl.format(total)}
                      </span>
                    </p>
                  </div>
                </div>
              </section>

              <PagamentoPanel
                total={total}
                onConfirm={() => {
                  setEnviado(true);
                  clear();
                }}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
