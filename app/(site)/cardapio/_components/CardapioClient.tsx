"use client";

import { useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { CategoriaDTO, ProdutoDTO } from "@/lib/catalogo/queries";
import SakuraCorners from "../../_components/SakuraCorners";
import Navbar from "../../_components/Navbar";
import MenuItemCard from "./MenuItemCard";

type Props = {
  categorias: CategoriaDTO[];
  produtos: (ProdutoDTO & { categorySlug: string })[];
};

export default function CardapioClient({ categorias, produtos }: Props) {
  const scope = useRef<HTMLDivElement>(null);
  const reduce = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  // A aba inicial vem da primeira categoria por `position`, nao de "sushi"
  // hardcoded: as categorias agora sao editaveis no banco.
  const [active, setActive] = useState(categorias[0]?.slug ?? "");

  const items = useMemo(
    () => produtos.filter((p) => p.categorySlug === active),
    [produtos, active],
  );

  useGSAP(
    () => {
      if (reduce) return;
      // fromTo (não `from`) com estado final explícito: em React Strict Mode o
      // efeito é invocado duas vezes no mount e um `from` leria a opacidade
      // transitória (meio-revert) como destino, deixando os cards travados < 1.
      gsap.fromTo(
        ".menu-card",
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "power3.out" },
      );
    },
    { scope, dependencies: [active] },
  );

  return (
    <div
      ref={scope}
      className="relative min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat px-8 pt-28 pb-10 text-white md:px-12"
      style={{
        backgroundColor: "var(--color-dark-blue)",
        backgroundImage: "url('/bgCardapioInk.webp')",
      }}
    >
      <SakuraCorners active />
      <div
        className="pointer-events-none absolute inset-0 bg-dark-blue/70"
        aria-hidden="true"
      />

      <div className="relative z-10">
        <Navbar />

        <div className="mt-10">
          <p className="text-sm font-semibold tracking-[0.25em] text-yellow uppercase">
            メニュー · Cardápio
          </p>
          <h1
            className="mt-2 text-5xl font-bold md:text-7xl"
            style={{ fontFamily: "var(--font-eczar), serif" }}
          >
            Menu
          </h1>
        </div>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:gap-12">
          {/* Rail de categorias (vertical em lg, horizontal com scroll em telas menores) */}
          <nav aria-label="Categorias" className="lg:w-48 lg:shrink-0">
            <ul className="flex gap-4 overflow-x-auto pb-2 lg:flex-col lg:gap-3 lg:overflow-visible lg:pb-0">
              {categorias.map((c) => {
                const isActive = c.slug === active;
                return (
                  <li key={c.slug} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setActive(c.slug)}
                      aria-current={isActive ? "true" : undefined}
                      className={`relative cursor-pointer whitespace-nowrap pb-2 text-base transition-colors duration-300
                        after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full
                        after:bg-yellow after:origin-left after:transition-transform after:duration-500 after:ease-out
                        ${
                          isActive
                            ? "font-semibold text-yellow after:scale-x-100"
                            : "text-white/70 hover:text-caramel after:scale-x-0"
                        }
                      `}
                    >
                      {c.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Grid de itens filtrados */}
          <div className="flex-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {items.map((item) => (
                <MenuItemCard key={item.slug} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
