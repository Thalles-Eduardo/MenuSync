"use client";

import Image from "next/image";
import TransitionLink from "./TransitionLink";
import type { Dish } from "../_data/dishes";
import AddToCartButton from "./AddToCartButton";
import SakuraCorners from "./SakuraCorners";
import { brl } from "../_lib/price";

function DishCard({ dish }: { dish: Dish }) {
  return (
    <article className="bento-card group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm transition hover:bg-white/[0.07]">
      <div className="flex flex-1 items-center justify-center py-0.5">
        <Image
          src={dish.plate}
          alt={dish.name}
          width={220}
          height={220}
          className="h-auto w-[48%] max-w-[100px] drop-shadow-xl transition duration-500 group-hover:scale-105"
        />
      </div>
      <h3
        className="mt-2 text-lg font-bold md:text-xl"
        style={{ fontFamily: "var(--font-eczar), serif" }}
      >
        {dish.name}
      </h3>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span
          className="text-lg font-medium"
          style={{ fontFamily: "var(--font-eczar), serif" }}
        >
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
  active = false,
}: {
  activeDish: Dish;
  otherDishes: Dish[];
  active?: boolean;
}) {
  return (
    <section
      className="bento-section relative flex min-h-screen flex-col justify-center overflow-hidden bg-cover bg-center bg-no-repeat px-8 py-10 text-white md:px-12 lg:py-10"
      style={{
        backgroundColor: "var(--color-dark-blue)",
        backgroundImage: "url('/bgCardapioInk.webp')",
      }}
      aria-label="Destaques do cardápio"
    >
      <SakuraCorners active={active} />

      <div className="relative z-10 mb-8 w-full">
        <p className="text-sm font-semibold tracking-[0.25em] text-yellow uppercase">
          Cardápio
        </p>
        <h2
          className="mt-2 text-3xl font-bold md:text-5xl"
          style={{ fontFamily: "var(--font-eczar), serif" }}
        >
          <span className="text-salmon">Destaques do</span>  cardápio
        </h2>
      </div>

      <div className="relative z-10 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
        {/* Card grande = prato ativo */}
        <article className="bento-big group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm sm:col-span-2 lg:col-span-2 lg:row-span-2">
          <div className="bento-plate-seat flex flex-1 items-center justify-center py-2">
            <Image
              src={activeDish.plate}
              alt={activeDish.name}
              width={520}
              height={520}
              priority
              className="bento-seat-img h-auto w-[62%] max-w-[240px] drop-shadow-2xl"
            />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-yellow">
              {activeDish.tagline}
            </p>
            <h3
              className="mt-1 text-3xl font-bold md:text-4xl"
              style={{ fontFamily: "var(--font-eczar), serif" }}
            >
              {activeDish.name}
            </h3>
            <div className="mt-3 flex items-center gap-6">
              <span
                className="text-2xl font-medium"
                style={{ fontFamily: "var(--font-eczar), serif" }}
              >
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
        <TransitionLink
          href="/cardapio"
          className="bento-cta group flex flex-col justify-between gap-6 rounded-2xl border border-yellow/30 bg-gradient-to-br from-salmon/20 to-transparent p-6 transition hover:border-yellow/60"
        >
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold tracking-wide text-yellow uppercase">
              Cardápio
            </span>
            <span
              className="text-2xl font-bold leading-tight"
              style={{ fontFamily: "var(--font-eczar), serif" }}
            >
              Ver cardápio completo
            </span>
          </div>
          <button className="group/btn relative flex h-10 w-[130px] cursor-pointer items-center justify-center gap-2 rounded-[30px] border-none bg-yellow pl-2 font-semibold text-dark-blue shadow-[5px_5px_10px_rgba(0,0,0,0.25)] transition-all duration-500 hover:bg-caramel active:scale-[0.97] active:duration-200">
            <svg
              className="h-[22px] fill-dark-blue transition-transform duration-500 group-hover/btn:scale-110"
              viewBox="0 0 512 512"
              height="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M40 48C26.7 48 16 58.7 16 72v48c0 13.3 10.7 24 24 24H88c13.3 0 24-10.7 24-24V72c0-13.3-10.7-24-24-24H40zM192 64c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zM16 232v48c0 13.3 10.7 24 24 24H88c13.3 0 24-10.7 24-24V232c0-13.3-10.7-24-24-24H40c-13.3 0-24 10.7-24 24zM40 368c-13.3 0-24 10.7-24 24v48c0 13.3 10.7 24 24 24H88c13.3 0 24-10.7 24-24V392c0-13.3-10.7-24-24-24H40z"></path>
            </svg>
            Explore
          </button>
        </TransitionLink>
      </div>
    </section>
  );
}
