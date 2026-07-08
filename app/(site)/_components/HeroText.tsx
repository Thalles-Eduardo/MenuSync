import type { Dish } from "../_data/dishes";
import AddToCartButton from "./AddToCartButton";
import PlayVideoButton from "./PlayVideoButton";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function HeroText({ dish }: { dish: Dish }) {
  return (
    <div className="hero-text max-w-md">
      <p className="text-sm font-semibold tracking-wide text-yellow">{dish.tagline}</p>
      <h1
        className="text-6xl leading-[1.3] font-bold md:text-9xl"
        style={{ fontFamily: "var(--font-eczar), serif" }}
      >
        {dish.name}
      </h1>

      <p className="mt-6 font-medium" style={{ fontFamily: "var(--font-eczar), serif" }}>
        {brl.format(dish.price)}
      </p>

      <div className="mt-10 flex items-center gap-8">
        {dish.video && <PlayVideoButton src={dish.video} />}
        <AddToCartButton />
      </div>
    </div>
  );
}
