"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Dish } from "../_data/dishes";
import HeroShowcase from "./HeroShowcase";
import MenuBento from "./MenuBento";
import AboutSection from "./AboutSection";
import ReservasCTA from "./ReservasCTA";
import FooterSection from "./FooterSection";
import SectionRoulette, { type RouletteItem } from "./SectionRoulette";
import Navbar from "./Navbar";

const ITEMS: RouletteItem[] = [
  { id: "inicio", label: "Início" },
  { id: "cardapio", label: "Cardápio" },
  { id: "sobre", label: "Sobre" },
  { id: "reservas", label: "Reservas" },
  { id: "contato", label: "Contato" },
];

export default function SectionStage({ dishes }: { dishes: Dish[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeDishId, setActiveDishId] = useState(dishes[0]?.id ?? "");
  const activeDish = dishes.find((d) => d.id === activeDishId) ?? dishes[0];
  const otherDishes = dishes.filter((d) => d.id !== activeDish.id);

  // Deep-link: /?section=<id> abre a roleta já na seção certa (ex.: vindo de
  // /cardapio pelo menu). Roda uma vez no mount; depois limpa a query para o
  // refresh não re-saltar.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("section");
    if (id) {
      const i = ITEMS.findIndex((it) => it.id === id);
      // Sincronização única com a URL no mount (deep-link vindo de /cardapio):
      // é intencional e roda uma vez — não é um loop de renders em cascata.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (i > 0) setActiveIndex(i);
    }
    if (params.has("section")) {
      history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const trackRef = useRef<HTMLDivElement>(null);
  const prevIndex = useRef(0);

  const enabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      window.innerWidth >= 1024
    );
  }, []);

  // Desliza o track até a seção ativa; entre Início↔Cardápio, o prato voa junto.
  useGSAP(
    () => {
      const track = trackRef.current;
      if (!track) return;
      const root = track.parentElement as HTMLElement;
      const from = prevIndex.current;
      const to = activeIndex;
      prevIndex.current = to;

      const y = -to * window.innerHeight;
      if (!enabled) {
        gsap.set(track, { y });
        return;
      }

      gsap.to(track, { y, duration: 0.7, ease: "power3.inOut" });

      const heroToBento = from === 0 && to === 1;
      const bentoToHero = from === 1 && to === 0;
      if (!heroToBento && !bentoToHero) return;

      const flyer = root.querySelector<HTMLElement>(".flying-plate");
      const heroPlate = root.querySelector<HTMLElement>(".plate-img");
      const seat = root.querySelector<HTMLElement>(".bento-seat-img");
      if (!flyer || !heroPlate || !seat) return;

      const vh = window.innerHeight;
      const rect = (el: HTMLElement) => el.getBoundingClientRect();

      let startRect: DOMRect;
      let endTop: number;
      let endLeft: number;
      if (heroToBento) {
        startRect = rect(heroPlate);
        const s = rect(seat);
        endTop = s.top - vh;
        endLeft = s.left;
      } else {
        startRect = rect(seat);
        const p = rect(heroPlate);
        endTop = p.top + vh;
        endLeft = p.left;
      }
      const endSize = heroToBento ? rect(seat) : rect(heroPlate);
      const landOn = heroToBento ? seat : heroPlate;
      const source = heroToBento ? heroPlate : seat;

      const tl = gsap.timeline();
      // esconde prato de origem e destino; só o flyer aparece durante o voo
      tl.set(heroPlate, { autoAlpha: 0 }, 0);
      tl.set(seat, { autoAlpha: 0 }, 0);
      tl.set(
        flyer,
        {
          x: startRect.left,
          y: startRect.top,
          width: startRect.width,
          height: startRect.height,
          autoAlpha: 1,
        },
        0,
      );
      tl.to(
        flyer,
        {
          x: endLeft,
          y: endTop,
          width: endSize.width,
          height: endSize.height,
          duration: 0.7,
          ease: "power3.inOut",
        },
        0,
      );
      // handoff: revela o prato de destino e some o flyer
      tl.set(landOn, { autoAlpha: 1 }, 0.66);
      tl.to(flyer, { autoAlpha: 0, duration: 0.05 }, 0.68);
      // restaura o prato de origem (fora de cena) para visitas futuras
      tl.set(source, { autoAlpha: 1 }, ">");
    },
    { dependencies: [activeIndex, enabled] },
  );

  // Reposiciona (sem animar) quando a janela muda de tamanho.
  useGSAP(
    () => {
      const onResize = () => {
        if (trackRef.current)
          gsap.set(trackRef.current, { y: -activeIndex * window.innerHeight });
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    },
    { dependencies: [activeIndex] },
  );

  function goTo(index: number) {
    setActiveIndex(index);
  }

  // Painéis de 100vh. No desktop o conteúdo cabe (sem scroll); no mobile, se a
  // seção for mais alta que a tela, o próprio painel rola. `pb` no mobile evita
  // que o conteúdo final fique atrás da barra de pills.
  const panelClass = "h-screen w-full shrink-0 overflow-y-auto pb-24 lg:pb-0";

  return (
    <div className="stage-pin relative h-screen w-full overflow-hidden">
      <Navbar onSelectSection={goTo} />
      <div ref={trackRef} className="flex h-full w-full flex-col">
        {/* Painel 0 — Início */}
        <div className={panelClass}>
          <HeroShowcase
            dishes={dishes}
            activeDishId={activeDish.id}
            onSelectDish={setActiveDishId}
          />
        </div>

        {/* Painel 1 — Cardápio */}
        <div className={panelClass}>
          <MenuBento
            activeDish={activeDish}
            otherDishes={otherDishes}
            active={activeIndex === 1}
          />
        </div>

        {/* Painel 2 — Sobre (rola internamente se exceder a viewport) */}
        <div className={panelClass}>
          <AboutSection active={activeIndex === 2} />
        </div>

        {/* Painel 3 — Reservas (CTA) */}
        <div className={panelClass}>
          <ReservasCTA active={activeIndex === 3} />
        </div>

        {/* Painel 4 — Contato (cupom + footer) */}
        <div className={panelClass}>
          <FooterSection active={activeIndex === 4} onNavigate={goTo} />
        </div>
      </div>

      {/* Prato voador (overlay) — usado na transição Início↔Cardápio */}
      <Image
        key={activeDish.id}
        src={activeDish.plate}
        alt=""
        aria-hidden="true"
        width={520}
        height={520}
        className="flying-plate pointer-events-none fixed left-0 top-0 z-[60] h-auto w-auto opacity-0 drop-shadow-2xl will-change-transform"
      />

      <SectionRoulette items={ITEMS} activeIndex={activeIndex} onSelect={goTo} />
    </div>
  );
}
