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

  const stageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!enabled) return;
      const stage = stageRef.current;
      if (!stage) return;

      const pinWrap = stage.querySelector<HTMLElement>(".stage-pin");
      const heroLayer = stage.querySelector<HTMLElement>(".hero-layer");
      const bentoLayer = stage.querySelector<HTMLElement>(".bento-layer");
      const flyer = stage.querySelector<HTMLElement>(".flying-plate");
      const heroPlate = stage.querySelector<HTMLElement>(".plate-img");
      const seat = stage.querySelector<HTMLElement>(".bento-plate-seat");
      const seatImg = stage.querySelector<HTMLElement>(".bento-seat-img");
      if (!pinWrap || !heroLayer || !bentoLayer || !flyer || !heroPlate || !seat || !seatImg) return;

      const placeAt = (target: HTMLElement) => {
        const r = target.getBoundingClientRect();
        return { x: r.left, y: r.top, width: r.width, height: r.height };
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          pin: pinWrap,
          pinSpacing: true,
          invalidateOnRefresh: true,
        },
      });

      tl.set(flyer, { autoAlpha: 1 });
      tl.set(seatImg, { autoAlpha: 0 }, 0);
      tl.fromTo(
        flyer,
        {
          x: () => placeAt(heroPlate).x,
          y: () => placeAt(heroPlate).y,
          width: () => placeAt(heroPlate).width,
          height: () => placeAt(heroPlate).height,
          rotation: 0,
        },
        {
          x: () => placeAt(seat).x + (placeAt(seat).width - placeAt(seatImg).width) / 2,
          y: () => placeAt(seat).y + (placeAt(seat).height - placeAt(seatImg).height) / 2,
          width: () => placeAt(seatImg).width,
          height: () => placeAt(seatImg).height,
          rotation: 0,
          ease: "none",
        },
        0,
      );

      tl.to(heroLayer, { autoAlpha: 0, ease: "none" }, 0);
      tl.fromTo(bentoLayer, { autoAlpha: 0 }, { autoAlpha: 1, ease: "none" }, 0.15);

      tl.from(
        stage.querySelectorAll(".bento-card, .bento-cta"),
        { autoAlpha: 0, y: 30, stagger: 0.06, ease: "power2.out" },
        0.45,
      );

      tl.set(seatImg, { autoAlpha: 1 }, 0.92);
      tl.set(flyer, { autoAlpha: 0 }, 0.93);

      ScrollTrigger.refresh();
    },
    { scope: stageRef, dependencies: [enabled, activeDishId] },
  );

  if (!enabled) {
    return (
      <>
        <HeroShowcase dishes={dishes} activeDishId={activeDish.id} onSelectDish={setActiveDishId} />
        <MenuBento activeDish={activeDish} otherDishes={otherDishes} />
      </>
    );
  }

  return (
    <div ref={stageRef} className="relative w-full overflow-x-hidden" style={{ height: "220vh" }}>
      <div className="stage-pin relative h-screen w-full overflow-hidden">
        <div className="hero-layer absolute inset-0">
          <HeroShowcase dishes={dishes} activeDishId={activeDish.id} onSelectDish={setActiveDishId} />
        </div>

        <div className="bento-layer absolute inset-0 overflow-hidden opacity-0">
          <MenuBento activeDish={activeDish} otherDishes={otherDishes} />
        </div>

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
    </div>
  );
}
