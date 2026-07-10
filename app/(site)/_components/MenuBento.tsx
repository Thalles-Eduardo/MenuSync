"use client";

import Image from "next/image";
import type { Dish } from "../_data/dishes";
import AddToCartButton from "./AddToCartButton";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function DishCard({ dish }: { dish: Dish }) {
  return (
    <article className="bento-card group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition hover:bg-white/[0.07]">
      <div className="flex flex-1 items-center justify-center py-2">
        <Image
          src={dish.plate}
          alt={dish.name}
          width={220}
          height={220}
          className="h-auto w-[60%] max-w-[180px] drop-shadow-xl transition duration-500 group-hover:scale-105"
        />
      </div>
      <h3
        className="mt-2 text-xl font-bold md:text-2xl"
        style={{ fontFamily: "var(--font-eczar), serif" }}
      >
        {dish.name}
      </h3>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-lg font-medium" style={{ fontFamily: "var(--font-eczar), serif" }}>
          {brl.format(dish.price)}
        </span>
        <AddToCartButton />
      </div>
    </article>
  );
}

export default function MenuBento({
  activeDish,
  otherDishes,
}: {
  activeDish: Dish;
  otherDishes: Dish[];
}) {
  return (
    <section
      className="bento-section relative overflow-hidden px-8 py-24 text-white md:px-12 lg:py-28"
      style={{ backgroundColor: "var(--color-dark-blue)" }}
      aria-label="Destaques do cardápio"
    >
      <div className="mx-auto mb-14 max-w-6xl">
        <p className="text-sm font-semibold tracking-[0.25em] text-yellow uppercase">Cardápio</p>
        <h2
          className="mt-2 text-4xl font-bold md:text-6xl"
          style={{ fontFamily: "var(--font-eczar), serif" }}
        >
          Destaques do cardápio
        </h2>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
        {/* Card grande = prato ativo */}
        <article className="bento-big group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] p-8 backdrop-blur-sm sm:col-span-2 lg:col-span-2 lg:row-span-2">
          <div className="bento-plate-seat flex flex-1 items-center justify-center py-4">
            <Image
              src={activeDish.plate}
              alt={activeDish.name}
              width={520}
              height={520}
              priority
              className="bento-seat-img h-auto w-[70%] max-w-[360px] drop-shadow-2xl"
            />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-yellow">{activeDish.tagline}</p>
            <h3
              className="mt-1 text-4xl font-bold md:text-5xl"
              style={{ fontFamily: "var(--font-eczar), serif" }}
            >
              {activeDish.name}
            </h3>
            <div className="mt-4 flex items-center gap-6">
              <span className="text-2xl font-medium" style={{ fontFamily: "var(--font-eczar), serif" }}>
                {brl.format(activeDish.price)}
              </span>
              <AddToCartButton />
            </div>
          </div>
        </article>

        {/* Cards menores = outros pratos */}
        {otherDishes.slice(0, 3).map((dish) => (
          <DishCard key={dish.id} dish={dish} />
        ))}

        {/* Card CTA */}
        <a
          href="#"
          className="bento-cta group flex flex-col items-start justify-end rounded-2xl border border-yellow/30 bg-gradient-to-br from-salmon/20 to-transparent p-6 transition hover:border-yellow/60"
        >
          <span className="text-sm font-semibold tracking-wide text-yellow uppercase">Cardápio</span>
          <span
            className="mt-1 text-2xl font-bold leading-tight"
            style={{ fontFamily: "var(--font-eczar), serif" }}
          >
            Ver cardápio completo
          </span>
          <span className="mt-3 inline-flex items-center gap-1 text-white/80 transition group-hover:gap-2 group-hover:text-white">
            Explorar
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </a>
      </div>
    </section>
  );
}
