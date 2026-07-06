import Image from "next/image";
import type { Dish } from "../_data/dishes";

type Props = {
  dishes: Dish[];
  activeId: string;
  onSelect: (id: string) => void;
};

export default function DishCarousel({ dishes, activeId, onSelect }: Props) {
  return (
    <ul className="flex items-start justify-center gap-8">
      {dishes.map((dish) => {
        const isActive = dish.id === activeId;
        return (
          <li key={dish.id} className="dish-thumb w-28 text-center">
            <button
              onClick={() => onSelect(dish.id)}
              aria-pressed={isActive}
              className="group flex flex-col items-center gap-2"
            >
              <span
                className={`overflow-hidden rounded-full border-2 transition duration-300 group-hover:scale-105 ${
                  isActive ? "border-salmon" : "border-white/40"
                }`}
              >
                <Image src={dish.thumb} alt={dish.name} width={80} height={80} className="h-20 w-20 object-cover" />
              </span>
              <span className={`text-sm ${isActive ? "text-white" : "text-white/70"}`}>{dish.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
