"use client";

import { useEffect, useMemo, useRef } from "react";

// Sakura decorativa na section Cardápio: vídeo de um galho de cerejeira
// desabrochando (fundo preto). Usamos `mix-blend-mode: screen` para recortar o
// preto e compor só o galho+flores sobre o fundo da section. Dois vídeos
// espelhados nos cantos inferiores (esq/dir). Toca quando a seção fica ativa.
//
// O arquivo é um "boomerang" (frente + reverso concatenados), então com `loop`
// nativo a floração cresce e depois volta no tempo, em loop contínuo e suave
// (reverse nativo de <video> não é confiável entre browsers).

const SRC = "/video/flowers-loop.webm";
const POSTER = "/video/flowers-poster.webp";
// Acelera a floração (o clipe original leva ~23s).
const SPEED = 3;

export default function SakuraCorners({ active }: { active: boolean }) {
  const reduce = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const leftRef = useRef<HTMLVideoElement>(null);
  const rightRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const vids = [leftRef.current, rightRef.current].filter(
      Boolean,
    ) as HTMLVideoElement[];

    // Reduced-motion: nada de reprodução — o poster (plena floração) já mostra
    // o estado final estático.
    //
    // O poster é aplicado aqui, e não no JSX: `reduce` é sempre false no
    // servidor, então `poster={reduce ? ... : undefined}` renderizava diferente
    // no cliente e quebrava a hidratação com prefers-reduced-motion.
    if (reduce) {
      vids.forEach((v) => {
        v.poster = POSTER;
        v.pause();
      });
      return;
    }

    if (active) {
      // (re)começa o brotar sempre que o Cardápio é ativado
      vids.forEach((v) => {
        v.currentTime = 0;
        v.playbackRate = SPEED;
        const p = v.play();
        if (p) p.catch(() => {});
      });
    } else {
      vids.forEach((v) => {
        v.pause();
        v.currentTime = 0;
      });
    }
  }, [active, reduce]);

  // `contrast` esmaga os quase-pretos do vídeo (VP8 não é #000 exato) para que o
  // `screen` não deixe um retângulo visível sobre o fundo preto, e dá mais punch
  // nas flores.
  const common =
    "absolute bottom-0 h-[70%] w-[45%] object-cover object-bottom [filter:contrast(1.12)] [mix-blend-mode:screen]";

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Vinhetas escuras nos cantos inferiores: como o `screen` compõe as flores
          sobre o que estiver atrás, sem elas as flores sobre a área caramelo do
          fundo ficam amareladas. Um backdrop dark-blue garante cores reais nos
          dois lados. */}
      <div className="absolute bottom-0 left-0 h-[70%] w-[45%] bg-[radial-gradient(125%_115%_at_12%_100%,var(--color-dark-blue)_48%,transparent_80%)]" />
      <div className="absolute bottom-0 right-0 h-[70%] w-[45%] bg-[radial-gradient(125%_115%_at_88%_100%,var(--color-dark-blue)_48%,transparent_80%)]" />

      {/* canto inferior-esquerdo */}
      <video
        ref={leftRef}
        className={`${common} left-0`}
        src={SRC}
        muted
        loop
        playsInline
        preload="auto"
      />
      {/* canto inferior-direito (espelhado) */}
      <video
        ref={rightRef}
        className={`${common} right-0 -scale-x-100`}
        src={SRC}
        muted
        loop
        playsInline
        preload="auto"
      />
    </div>
  );
}
