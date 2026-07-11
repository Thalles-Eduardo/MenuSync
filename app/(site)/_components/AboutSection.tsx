"use client";

import { useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { PLACE } from "./about/about-data";
import Timeline from "./about/Timeline";

gsap.registerPlugin(ScrollTrigger);

const RestaurantMap = dynamic(() => import("./about/RestaurantMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-white/40">
      Carregando mapa…
    </div>
  ),
});

export default function AboutSection() {
  const scope = useRef<HTMLElement>(null);
  const reduce = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useGSAP(
    () => {
      if (reduce) return;
      gsap.from(".about-reveal", {
        scrollTrigger: { trigger: scope.current, start: "top 75%", once: true },
        y: 28,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: "power3.out",
      });
    },
    { scope },
  );

  return (
    <section
      ref={scope}
      className="about-section relative overflow-hidden bg-cover bg-center bg-no-repeat px-8 py-24 text-white md:px-12 lg:py-28"
      style={{
        backgroundColor: "var(--color-dark-blue)",
        backgroundImage: "url('/bgAbout.webp')",
      }}
      aria-label="Sobre o restaurante"
    >
      {/* Overlay para legibilidade do texto/mapa sobre a imagem de fundo */}
      <div
        className="pointer-events-none absolute inset-0 bg-[var(--color-dark-blue)]/70"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl">
        <p className="about-reveal text-sm font-semibold tracking-[0.25em] text-yellow uppercase">
          Nossa história
        </p>
        <h2
          className="about-reveal mt-2 text-4xl font-bold md:text-6xl"
          style={{ fontFamily: "var(--font-eczar), serif" }}
        >
          Tradição japonesa em São Paulo
        </h2>

        <div className="about-reveal mt-8 max-w-2xl space-y-4 text-white/80">
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

        <div className="mt-20 grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="about-map-slot h-[360px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40 md:h-[420px]">
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
