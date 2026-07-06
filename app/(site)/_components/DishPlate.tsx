import Image from "next/image";
import type { Dish } from "../_data/dishes";

export default function DishPlate({ dish }: { dish: Dish }) {
  return (
    <div className="flex justify-center">
      <div className="drop-shadow-2xl [perspective:1000px]">
        <Image
          key={dish.id}
          src={dish.plate}
          alt={dish.name}
          width={520}
          height={520}
          priority
          className="plate-img h-auto w-[70vw] max-w-[520px] will-change-transform"
        />
      </div>
    </div>
  );
}
