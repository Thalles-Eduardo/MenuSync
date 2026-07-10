"use client";

import { useState } from "react";
import type { Dish } from "../_data/dishes";
import HeroShowcase from "./HeroShowcase";

export default function HomeExperience({ dishes }: { dishes: Dish[] }) {
  const [activeDishId, setActiveDishId] = useState(dishes[0]?.id ?? "");

  return (
    <HeroShowcase
      dishes={dishes}
      activeDishId={activeDishId}
      onSelectDish={setActiveDishId}
    />
  );
}
