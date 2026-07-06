"use client";

import { useState } from "react";
import type { Dish } from "../_data/dishes";
import Navbar from "./Navbar";
import HeroText from "./HeroText";
import DishPlate from "./DishPlate";
import DishCarousel from "./DishCarousel";
import ReviewsPanel from "./ReviewsPanel";

type Tab = "reviews" | "ingredients";

export default function HeroShowcase({ dishes }: { dishes: Dish[] }) {
  const [activeDishId, setActiveDishId] = useState(dishes[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<Tab>("reviews");

  const activeDish = dishes.find((d) => d.id === activeDishId) ?? dishes[0];

  function handleSelect(id: string) {
    setActiveDishId(id);
    setActiveTab("reviews");
  }

  return (
    <section
      className="relative min-h-screen w-full overflow-hidden bg-cover bg-center text-white"
      style={{ backgroundImage: "url('/bgHero.webp')" }}
      aria-label={`Prato em destaque: ${activeDish?.name}`}
    >
      <Navbar />

      <div className="relative z-10 grid grid-cols-1 items-center gap-8 px-8 pt-4 pb-40 md:px-12 lg:grid-cols-[1fr_1.1fr_1fr]">
        <HeroText dish={activeDish} />

        {/* Prato central (Task 6) e Painel (Task 8) entram aqui */}
        <DishPlate dish={activeDish} />
        <ReviewsPanel dish={activeDish} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="absolute bottom-10 left-0 right-0 z-10 lg:right-[32%]">
        <DishCarousel dishes={dishes} activeId={activeDish.id} onSelect={handleSelect} />
      </div>
    </section>
  );
}
