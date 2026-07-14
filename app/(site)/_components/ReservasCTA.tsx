"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { PLACE } from "./about/about-data";

// Seção Reservas (CTA da home). O fundo (bgCTAsInk) é "pintado" ao ativar e os
// elementos entram das laterais com efeito elástico. É um CTA — o fluxo real de
// reserva é a Fase 08. O card apenas navega para /reserva.

const PHONE = "(11) 3200-1590";
const PHONE_HREF = "tel:+551132001590";

export default function ReservasCTA({ active = false }: { active?: boolean }) {
  const scope = useRef<HTMLElement>(null);
  const reduce = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const played = useRef(false);

  useGSAP(
    () => {
      // Reduced-motion / seção inativa: o markup já está no estado final; nada a animar.
      if (reduce || !active || played.current) return;
      played.current = true;

      const tl = gsap.timeline({ delay: 0.7 });

      // 1) Pintura: revela o caramelo a partir do canto inferior-esquerdo (origem da tinta).
      tl.fromTo(
        ".cta-paint",
        { clipPath: "circle(0% at 22% 78%)", scale: 1.08 },
        {
          clipPath: "circle(150% at 22% 78%)",
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
        },
        0,
      );

      // 2) Respingos ("jogar tinta").
      tl.fromTo(
        ".cta-splatter > *",
        { scale: 0, autoAlpha: 0 },
        {
          scale: 1,
          autoAlpha: 1,
          duration: 0.5,
          stagger: 0.06,
          ease: "back.out(2.5)",
        },
        0.15,
      );

      // 3) Entrada elástica — coluna esquerda entra da esquerda.
      tl.fromTo(
        ".cta-left > *",
        { x: -120, autoAlpha: 0 },
        {
          x: 0,
          autoAlpha: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: "elastic.out(1, 0.75)",
        },
        0.5,
      );

      // Card direito entra da direita.
      tl.fromTo(
        ".cta-card",
        { x: 120, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.75, ease: "elastic.out(1, 0.7)" },
        0.62,
      );
    },
    { scope, dependencies: [reduce, active] },
  );

  return (
    <section
      ref={scope}
      className="relative flex min-h-screen flex-col justify-center overflow-hidden px-8 py-16 md:px-12"
      style={{ backgroundColor: "var(--color-dark-blue)" }}
      aria-label="Reservas"
    >
      {/* Camada de tinta (caramelo) — revelada na animação de pintura */}
      <div
        className="cta-paint pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/bgCTAsInk.webp')" }}
        aria-hidden="true"
      />

      {/* Respingos ("jogar tinta") */}
      <div
        className="cta-splatter pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <span className="absolute left-[30%] top-[22%] h-3 w-3 rounded-full bg-caramel" />
        <span className="absolute left-[18%] top-[42%] h-5 w-5 rounded-full bg-caramel/90" />
        <span className="absolute bottom-[26%] left-[42%] h-2 w-2 rounded-full bg-caramel/80" />
      </div>

      <div className="relative z-10 grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Esquerda — texto/CTA (sobre caramelo → dark-blue) */}
        <div className="cta-left rounded-3xl bg-caramel/85 p-6 text-dark-blue backdrop-blur-sm lg:rounded-none lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <p className="text-sm font-semibold tracking-[0.25em] uppercase">
            予約 · Reservas
          </p>
          <h2
            className="mt-3 text-5xl leading-tight font-bold md:text-6xl"
            style={{ fontFamily: "var(--font-eczar), serif" }}
          >
            Reserve sua <span className="text-salmon">mesa</span>
          </h2>
          <p className="mt-5 max-w-md text-base text-dark-blue/80 md:text-lg">
            Uma noite de sabores autênticos à sua espera. Garanta seu lugar no balcão
            ou no salão e viva o ritual da cozinha japonesa.
          </p>
          <div className="mt-8">
            <Link
              href="/reserva"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-yellow px-7 font-semibold text-dark-blue shadow-[5px_5px_18px_rgba(0,0,0,0.18)] transition-all duration-500 hover:bg-caramel active:scale-[0.97]"
            >
              Reservar mesa
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-dark-blue/75">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-salmon" />
              {PLACE.hours}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-salmon" />
              <a href={PHONE_HREF} className="hover:text-dark-blue">
                {PHONE}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-salmon" />
              {PLACE.address}
            </li>
          </ul>
        </div>

        {/* Direita — card de reserva rápida (sobre área escura → vidro) */}
        <aside className="cta-card rounded-3xl border border-white/15 bg-dark-blue/60 p-7 text-white shadow-2xl backdrop-blur-md">
          <p className="text-sm font-semibold tracking-wide text-yellow uppercase">
            Reserva rápida
          </p>
          <h3
            className="mt-1 text-2xl font-bold"
            style={{ fontFamily: "var(--font-eczar), serif" }}
          >
            Escolha data e horário
          </h3>

          <form action="/reserva" className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm text-white/70">
              Data
              <input
                type="date"
                name="data"
                className="h-11 rounded-xl border border-white/15 bg-white/[0.05] px-3 text-white [color-scheme:dark] transition outline-none focus:border-yellow/60"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 text-sm text-white/70">
                Pessoas
                <select
                  name="pessoas"
                  className="h-11 rounded-xl border border-white/15 bg-white/[0.05] px-3 text-white transition outline-none focus:border-yellow/60"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n} className="text-dark-blue">
                      {n} {n === 1 ? "pessoa" : "pessoas"}
                    </option>
                  ))}
                  <option value="9+" className="text-dark-blue">
                    9+ pessoas
                  </option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm text-white/70">
                Horário
                <select
                  name="horario"
                  className="h-11 rounded-xl border border-white/15 bg-white/[0.05] px-3 text-white transition outline-none focus:border-yellow/60"
                >
                  {["18:00", "19:00", "20:00", "21:00", "22:00", "23:00"].map((h) => (
                    <option key={h} value={h} className="text-dark-blue">
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="submit"
              className="mt-2 h-12 rounded-full bg-yellow font-semibold text-dark-blue transition-all duration-500 hover:bg-caramel active:scale-[0.97]"
            >
              Reservar
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
}
