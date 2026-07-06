"use client";

import { useState } from "react";
import type { Dish } from "../_data/dishes";

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
      {/* Navbar, Hero, Prato, Painel e Carrossel entram nas próximas tarefas.
          Referências temporárias para não quebrar o lint enquanto o estado
          ainda não é usado na UI: */}
      <span className="sr-only">{activeDish?.name}</span>
      <button className="sr-only" onClick={() => handleSelect(activeDish.id)}>select</button>
      <span className="sr-only">{activeTab}</span>
      <button className="sr-only" onClick={() => setActiveTab("ingredients")}>tab</button>
    </section>
  );
}
