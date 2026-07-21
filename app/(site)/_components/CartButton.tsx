"use client";

import Image from "next/image";
import TransitionLink from "./TransitionLink";
import { useCart } from "./CartProvider";

export default function CartButton() {
  const { count, hydrated } = useCart();
  // Só mostra o badge depois de hidratar, senão pisca "0" antes do storage chegar.
  const mostrarBadge = hydrated && count > 0;

  return (
    <TransitionLink
      href="/carrinho"
      aria-label={mostrarBadge ? `Carrinho, ${count} ${count === 1 ? "item" : "itens"}` : "Carrinho"}
      className="relative cursor-pointer opacity-90 transition hover:scale-110 hover:opacity-100"
    >
      <Image
        src="/icons/cart.svg"
        alt=""
        width={32}
        height={32}
        className="h-7 w-7 md:h-8 md:w-8"
      />
      {mostrarBadge && (
        <span
          aria-hidden="true"
          className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-salmon px-1 text-[11px] font-bold text-white"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </TransitionLink>
  );
}
