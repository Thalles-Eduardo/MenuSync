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

      const group = root.querySelector<HTMLElement>(".carry-group");
      const heroPlate = root.querySelector<HTMLElement>(".plate-img");
      const plateAnchor = root.querySelector<HTMLElement>(".plate-anchor");
      const seat = root.querySelector<HTMLElement>(".bento-seat-img");
      if (!group || !heroPlate || !plateAnchor || !seat) return;

      // Tamanho-base do grupo (px, definido no CSS). A escala cuida do encolhimento.
      const BASE = 560;

      const rect = (el: HTMLElement) => el.getBoundingClientRect();
      const absTop = (el: HTMLElement) => rect(el).top + window.scrollY;
      const absLeft = (el: HTMLElement) => rect(el).left + window.scrollX;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => "+=" + window.innerHeight,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      const startScroll = () => tl.scrollTrigger?.start ?? 0;
      const endScroll = () => startScroll() + window.innerHeight;

      tl.set(seat, { autoAlpha: 0 }, 0);

      // Handoff de entrada: o prato do hero some, o grupo assume no mesmo lugar.
      tl.fromTo(plateAnchor, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.05, ease: "none" }, 0);
      tl.fromTo(group, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05, ease: "none" }, 0);

      // Carregar: o grupo viaja (x/y absoluto) e escala do tamanho do prato do hero
      // até o tamanho do assento do card. Coords absolutas = à prova de refresh.
      tl.fromTo(
        group,
        {
          x: () => absLeft(heroPlate),
          y: () => absTop(heroPlate) - startScroll(),
          scale: () => rect(heroPlate).width / BASE,
        },
        {
          x: () => absLeft(seat),
          y: () => absTop(seat) - endScroll(),
          scale: () => rect(seat).width / BASE,
          ease: "none",
          duration: 1,
        },
        0,
      );

      // Pouso: revela o prato no card e oculta o grupo (handoff de saída).
      tl.to(seat, { autoAlpha: 1, duration: 0.05, ease: "none" }, 0.95);
      tl.to(group, { autoAlpha: 0, duration: 0.05, ease: "none" }, 0.95);
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

      <div className="carry-group pointer-events-none invisible fixed left-0 top-0 z-[60] origin-top-left will-change-transform">
        <Image
          key={activeDish.id}
          src={activeDish.plate}
          alt=""
          aria-hidden="true"
          fill
          sizes="560px"
          className="flying-plate object-contain drop-shadow-2xl"
        />
        <span className="hand hand-left" aria-hidden="true" />
        <span className="hand hand-right" aria-hidden="true" />
      </div>

      <style jsx>{`
        .carry-group {
          width: 560px;
          height: 560px;
        }
        .hand {
          position: absolute;
          width: 62%;
          aspect-ratio: 1 / 1;
          bottom: -6%;
          background-image: url("/hands.png");
          background-repeat: no-repeat;
          background-size: 200% 100%;
          opacity: 0;
          filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.35));
          will-change: transform, opacity;
        }
        .hand-left {
          left: -20%;
          background-position: 0% 50%;
        }
        .hand-right {
          right: -20%;
          background-position: 100% 50%;
        }
      `}</style>
    </div>
  );
}
