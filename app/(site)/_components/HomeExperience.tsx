"use client";

import { useState } from "react";
import type { Dish } from "../_data/dishes";
import HeroShowcase from "./HeroShowcase";
import MenuBento from "./MenuBento";

export default function HomeExperience({ dishes }: { dishes: Dish[] }) {
  const [activeDishId, setActiveDishId] = useState(dishes[0]?.id ?? "");
  const activeDish = dishes.find((d) => d.id === activeDishId) ?? dishes[0];
  const otherDishes = dishes.filter((d) => d.id !== activeDish.id);

  return (
    <>
      <HeroShowcase
        dishes={dishes}
        activeDishId={activeDish.id}
        onSelectDish={setActiveDishId}
      />
      <MenuBento activeDish={activeDish} otherDishes={otherDishes} />
    </>
  );
}
