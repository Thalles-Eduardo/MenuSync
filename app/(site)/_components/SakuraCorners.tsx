"use client";

import { useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// Sakura decorativa nos cantos inferiores da section Cardápio, com reveal ao scroll.

gsap.registerPlugin(ScrollTrigger);

const CREAM = "#fbf3ec";

// Ângulos das 5 pétalas de cada flor (graus).
const PETAL_ANGLES = [0, 72, 144, 216, 288] as const;

// Posições das flores ao longo do galho, no sistema de coordenadas do viewBox
// (0 0 200 320). Origem do galho = canto inferior-esquerdo; sobe curvando pra dentro.
const BLOOMS = [
  { x: 26, y: 300, s: 1.0, r: -8 },
  { x: 30, y: 250, s: 0.82, r: 14 },
  { x: 42, y: 208, s: 1.1, r: -18 },
  { x: 60, y: 170, s: 0.78, r: 22 },
  { x: 82, y: 134, s: 1.0, r: -6 },
  { x: 104, y: 104, s: 0.72, r: 16 },
] as const;

function Blossom({ x, y, s, r }: { x: number; y: number; s: number; r: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <g className="sakura-bloom">
        {PETAL_ANGLES.map((a) => (
          <path
            key={a}
            d="M0 0 C -4 -6 -4 -13 -1.6 -17 L 0 -14.5 L 1.6 -17 C 4 -13 4 -6 0 0 Z"
            transform={`rotate(${a})`}
            fill={CREAM}
          />
        ))}
        {PETAL_ANGLES.map((a) => (
          <circle
            key={`st-${a}`}
            cx="0"
            cy="-5.5"
            r="1"
            fill="var(--color-yellow)"
            transform={`rotate(${a})`}
          />
        ))}
        <circle cx="0" cy="0" r="2.6" fill="var(--color-salmon)" />
      </g>
    </g>
  );
}

function SakuraBranch() {
  return (
    <svg
      viewBox="0 0 200 320"
      className="absolute bottom-0 left-0 h-[35%] max-h-[440px] w-auto"
      fill="none"
      aria-hidden="true"
    >
      <path
        className="sakura-branch"
        d="M18 322 C 34 276 16 232 46 202 C 70 178 78 150 104 96"
        stroke="var(--color-brown)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        className="sakura-branch"
        d="M46 202 C 40 190 30 184 20 182"
        stroke="var(--color-brown)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {BLOOMS.map((b, i) => (
        <Blossom key={i} {...b} />
      ))}
    </svg>
  );
}

export default function SakuraCorners() {
  const scope = useRef<HTMLDivElement>(null);
  const reduce = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useGSAP(
    () => {
      if (reduce) return;

      // Prepara cada path do galho para o efeito de "desenhar" (stroke-dashoffset).
      const branches = gsap.utils.toArray<SVGPathElement>(
        ".sakura-branch",
        scope.current,
      );
      branches.forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len });
      });

      // Gatilho em "bottom 90%": o reveal dispara quando o rodapé da seção
      // (onde ficam as flores) entra em cena. Depende de existir conteúdo
      // abaixo do Cardápio (Galeria/Sobre) para que esse rodapé cruze a linha;
      // se o Cardápio virar a última seção da página, ajuste o start.
      const tl = gsap.timeline({
        scrollTrigger: { trigger: scope.current, start: "bottom 90%", once: true },
      });

      // 1) galho cresce
      tl.from(".sakura-branch", {
        strokeDashoffset: (_i, el) => (el as SVGPathElement).getTotalLength(),
        duration: 0.8,
        ease: "power2.out",
      });

      // 2) flores desabrocham em stagger, começando enquanto o galho ainda desenha
      tl.from(
        ".sakura-bloom",
        {
          scale: 0,
          autoAlpha: 0,
          rotation: -30,
          transformOrigin: "center center",
          stagger: 0.12,
          duration: 0.5,
          ease: "back.out(1.7)",
        },
        "-=0.45",
      );
    },
    { scope, dependencies: [reduce] },
  );

  return (
    <div
      ref={scope}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* canto inferior-esquerdo */}
      <SakuraBranch />
      {/* canto inferior-direito (espelhado) */}
      <div className="absolute inset-0 -scale-x-100">
        <SakuraBranch />
      </div>
    </div>
  );
}
