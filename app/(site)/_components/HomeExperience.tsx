"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Dish } from "../_data/dishes";
import HeroShowcase from "./HeroShowcase";
import MenuBento from "./MenuBento";

gsap.registerPlugin(ScrollTrigger);

const noopSubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export default function HomeExperience({ dishes }: { dishes: Dish[] }) {
  const [activeDishId, setActiveDishId] = useState(dishes[0]?.id ?? "");
  const activeDish = dishes.find((d) => d.id === activeDishId) ?? dishes[0];
  const otherDishes = dishes.filter((d) => d.id !== activeDish.id);

  const hydrated = useHydrated();
  const enabled = useMemo(() => {
    if (!hydrated || typeof window === "undefined") return false;
    return (
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      window.innerWidth >= 1024
    );
  }, [hydrated]);

  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!enabled) return;
      const root = rootRef.current;
      if (!root) return;

      const flyer = root.querySelector<HTMLElement>(".flying-plate");
      const heroPlate = root.querySelector<HTMLElement>(".plate-img");
      const seat = root.querySelector<HTMLElement>(".bento-seat-img");
      if (!flyer || !heroPlate || !seat) return;

      // O voo é uma "entrada": o prato descola do hero e pousa no card grande do
      // bento ao longo de ~1 tela de scroll. Depois o bento inteiro rola normal.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => "+=" + window.innerHeight,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      // Posições ABSOLUTAS (no documento), independentes do scroll atual — evita que um
      // refresh no meio da rolagem recapture o rect numa posição errada. Converto para
      // coordenada de viewport subtraindo o scroll conhecido no início/fim do voo.
      const rect = (el: HTMLElement) => el.getBoundingClientRect();
      const absTop = (el: HTMLElement) => rect(el).top + window.scrollY;
      const absLeft = (el: HTMLElement) => rect(el).left + window.scrollX;
      const startScroll = () => tl.scrollTrigger?.start ?? 0;
      const endScroll = () => startScroll() + window.innerHeight;

      // Crossfade no início: o prato real do hero some, o flyer assume no mesmo lugar.
      tl.set(flyer, { autoAlpha: 0 }, 0);
      tl.set(seat, { autoAlpha: 0 }, 0);
      tl.to(heroPlate, { autoAlpha: 0, duration: 0.05, ease: "none" }, 0);
      tl.to(flyer, { autoAlpha: 1, duration: 0.05, ease: "none" }, 0);

      // O voo: da posição do prato do hero (no topo) até a do assento (no fim do voo).
      tl.fromTo(
        flyer,
        {
          x: () => absLeft(heroPlate),
          y: () => absTop(heroPlate) - startScroll(),
          width: () => rect(heroPlate).width,
          height: () => rect(heroPlate).height,
        },
        {
          x: () => absLeft(seat),
          y: () => absTop(seat) - endScroll(),
          width: () => rect(seat).width,
          height: () => rect(seat).height,
          ease: "none",
          duration: 1,
        },
        0,
      );

      // No fim, revela o prato pousado no card e oculta o flyer (handoff).
      tl.to(seat, { autoAlpha: 1, duration: 0.05, ease: "none" }, 0.95);
      tl.to(flyer, { autoAlpha: 0, duration: 0.05, ease: "none" }, 0.95);
    },
    { scope: rootRef, dependencies: [enabled, activeDishId] },
  );

  // Fallback: hero e bento empilhados, sem voo (mobile / touch / reduced-motion / SSR).
  if (!enabled) {
    return (
      <>
        <HeroShowcase dishes={dishes} activeDishId={activeDish.id} onSelectDish={setActiveDishId} />
        <MenuBento activeDish={activeDish} otherDishes={otherDishes} />
      </>
    );
  }

  // Caminho animado: hero e bento em fluxo normal + flyer fixo que faz o voo.
  // A classe `stage-pin` no root desliga o parallax do prato do hero durante o voo.
  return (
    <div ref={rootRef} className="stage-pin relative w-full overflow-x-hidden">
      <HeroShowcase dishes={dishes} activeDishId={activeDish.id} onSelectDish={setActiveDishId} />
      <MenuBento activeDish={activeDish} otherDishes={otherDishes} />
      <Image
        key={activeDish.id}
        src={activeDish.plate}
        alt=""
        aria-hidden="true"
        width={520}
        height={520}
        className="flying-plate pointer-events-none fixed left-0 top-0 z-[60] h-auto w-auto opacity-0 drop-shadow-2xl will-change-transform"
      />
    </div>
  );
}
