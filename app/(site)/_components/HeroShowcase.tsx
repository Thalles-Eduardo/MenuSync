"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Dish } from "../_data/dishes";
import AtmosphereLayer from "./AtmosphereLayer";
import Navbar from "./Navbar";
import HeroText from "./HeroText";
import DishPlate from "./DishPlate";
import DishCarousel from "./DishCarousel";
import ReviewsPanel from "./ReviewsPanel";

type Tab = "reviews" | "ingredients";

export default function HeroShowcase({
  dishes,
  activeDishId,
  onSelectDish,
}: {
  dishes: Dish[];
  activeDishId: string;
  onSelectDish: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("reviews");

  const activeDish = dishes.find((d) => d.id === activeDishId) ?? dishes[0];

  function handleSelect(id: string) {
    onSelectDish(id);
    setActiveTab("reviews");
  }

  const scope = useRef<HTMLElement>(null);
  const hasMounted = useRef(false);
  const reduce = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  // Marca o fim do primeiro render (roda depois dos useGSAP/useLayoutEffect),
  // para que as animações de troca não atropelem a animação de entrada no mount.
  useEffect(() => {
    hasMounted.current = true;
  }, []);

  // Entrada (uma vez, no mount)
  useGSAP(
    () => {
      if (reduce) return;
      const tl = gsap.timeline({
        defaults: { ease: "power3.out", duration: 0.7 },
      });
      tl.from(".hero-text", { x: -40, opacity: 0 })
        .from(".plate-img", { scale: 0.8, rotate: -8, opacity: 0 }, "-=0.4")
        .from(".dish-thumb", { y: 30, opacity: 0, stagger: 0.08 }, "-=0.3")
        .from(".review-card", { y: 20, opacity: 0, stagger: 0.06 }, "-=0.5");
    },
    { scope },
  );

  // Troca de prato
  useGSAP(
    () => {
      if (reduce || !hasMounted.current) return;
      gsap.fromTo(
        ".plate-img",
        { scale: 0.85, rotate: -8, opacity: 0, filter: "blur(14px)" },
        {
          scale: 1,
          rotate: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.6,
          ease: "power3.out",
        },
      );
      gsap.fromTo(
        ".hero-text",
        { x: -20, opacity: 0.4 },
        { x: 0, opacity: 1, duration: 0.4, ease: "power2.out" },
      );
    },
    { scope, dependencies: [activeDishId] },
  );

  // Troca de aba (stagger nos cards)
  useGSAP(
    () => {
      if (reduce || !hasMounted.current) return;
      gsap.from(".review-card", {
        y: 12,
        opacity: 0,
        stagger: 0.05,
        duration: 0.35,
        ease: "power2.out",
      });
    },
    { scope, dependencies: [activeTab] },
  );

  // Parallax + tilt 3D do prato seguindo o cursor (só em ponteiro fino / mouse)
  useGSAP(
    () => {
      if (reduce) return;
      const el = scope.current;
      if (!el || !window.matchMedia("(pointer: fine)").matches) return;
      const plate = el.querySelector<HTMLElement>(".plate-img");
      if (!plate) return;

      const xTo = gsap.quickTo(plate, "x", { duration: 0.7, ease: "power3" });
      const yTo = gsap.quickTo(plate, "y", { duration: 0.7, ease: "power3" });
      const rxTo = gsap.quickTo(plate, "rotationX", {
        duration: 0.7,
        ease: "power3",
      });
      const ryTo = gsap.quickTo(plate, "rotationY", {
        duration: 0.7,
        ease: "power3",
      });

      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        xTo(nx * 30);
        yTo(ny * 22);
        ryTo(nx * 12);
        rxTo(-ny * 12);
      };
      const onLeave = () => {
        xTo(0);
        yTo(0);
        rxTo(0);
        ryTo(0);
      };

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      return () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope, dependencies: [activeDishId] },
  );

  return (
    <section
      ref={scope}
      className="relative min-h-screen w-full overflow-x-hidden bg-cover bg-center text-white"
      style={{ backgroundImage: "url('/bgHero.webp')" }}
      aria-label={`Prato em destaque: ${activeDish?.name}`}
    >
      <AtmosphereLayer />

      <Navbar />

      <div className="relative z-10 grid grid-cols-1 items-center gap-8 px-8 pt-4 pb-40 md:px-12 lg:grid-cols-[1fr_1.1fr_1fr]">
        <HeroText dish={activeDish} />

        <DishPlate dish={activeDish} />
        <ReviewsPanel
          dish={activeDish}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      <div className="static mt-8 px-8 pb-10 lg:absolute lg:bottom-10 lg:left-0 lg:right-[32%] lg:mt-0 lg:px-0 z-10">
        <DishCarousel
          dishes={dishes}
          activeId={activeDish.id}
          onSelect={handleSelect}
        />
      </div>
    </section>
  );
}
