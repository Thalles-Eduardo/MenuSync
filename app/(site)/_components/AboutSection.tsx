"use client";

import { useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { PLACE } from "./about/about-data";
import Timeline from "./about/Timeline";

const RestaurantMap = dynamic(() => import("./about/RestaurantMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-white/40">
      Carregando mapa…
    </div>
  ),
});

export default function AboutSection({ active = false }: { active?: boolean }) {
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
      if (reduce || !active || played.current) return;
      played.current = true;
      gsap.from(".about-reveal", {
        y: 28,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: "power3.out",
      });
    },
    { scope, dependencies: [reduce, active] },
  );

  return (
    <section
      ref={scope}
      className="about-section relative flex min-h-screen flex-col justify-center overflow-hidden bg-cover bg-center bg-no-repeat px-8 py-10 text-white md:px-12 lg:py-12"
      style={{
        backgroundColor: "var(--color-dark-blue)",
        backgroundImage: "url('/bgAboutInk.webp')",
      }}
      aria-label="Sobre o restaurante"
    >
      {/* Overlay para legibilidade do texto/mapa sobre a imagem de fundo */}
      <div
        className="pointer-events-none absolute inset-0 bg-[var(--color-dark-blue)]/70"
        aria-hidden="true"
      />

      <div className="relative w-full">
        <p className="about-reveal text-sm font-semibold tracking-[0.25em] text-yellow uppercase">
          Nossa história
        </p>
        <h2
          className="about-reveal mt-2 text-4xl font-bold md:text-6xl"
          style={{ fontFamily: "var(--font-eczar), serif" }}
        >
          Tradição japonesa em São Paulo
        </h2>

        <div className="about-reveal mt-5 max-w-2xl space-y-3 text-white/80">
          <p>
            Desde 2009, na Liberdade, servimos a cozinha japonesa como um ritual: ingredientes
            frescos, técnica precisa e a hospitalidade de quem trata cada prato como uma
            apresentação.
          </p>
          <p>
            Do balcão de sushi à cozinha quente, cada receita carrega uma história — a mesma que
            contamos aqui, ano após ano.
          </p>
        </div>

        <Timeline />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="about-map-slot h-[210px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40 md:h-[240px]">
            <RestaurantMap />
          </div>

          <aside className="about-reveal flex flex-col justify-center gap-6 rounded-2xl border border-white/10 bg-white/[0.04] p-8">
            <div>
              <p className="text-sm font-semibold tracking-wide text-yellow uppercase">Onde estamos</p>
              <p className="mt-2 text-lg" style={{ fontFamily: "var(--font-eczar), serif" }}>
                {PLACE.address}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-yellow uppercase">Horário</p>
              <p className="mt-2 text-lg">{PLACE.hours}</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
