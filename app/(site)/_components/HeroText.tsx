import Image from "next/image";
import type { Dish } from "../_data/dishes";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function HeroText({ dish }: { dish: Dish }) {
  return (
    <div className="hero-text max-w-md">
      <p className="mb-3 text-sm font-semibold tracking-wide text-yellow">{dish.tagline}</p>

      <h1
        className="text-6xl leading-[0.95] font-bold md:text-7xl"
        style={{ fontFamily: "var(--font-ming), var(--font-eczar), serif" }}
      >
        {dish.name}
      </h1>

      <p className="mt-6 text-2xl font-medium">{brl.format(dish.price)}</p>

      <div className="mt-10 flex items-center gap-8">
        <button className="flex items-center gap-2 text-white/90 transition hover:text-white">
          <Image src="/icons/play.svg" alt="" width={28} height={28} />
          <span>Play no vídeo</span>
        </button>
        <button className="flex items-center gap-2 rounded-md bg-salmon px-5 py-3 font-semibold text-white transition hover:brightness-110">
          <Image src="/icons/cart.svg" alt="" width={20} height={20} />
          <span>Adicionar</span>
        </button>
      </div>
    </div>
  );
}
