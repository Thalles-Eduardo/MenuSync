"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { useRouteTransition } from "./RouteTransitionProvider";

// Mesma superfície do next/link, mas href é sempre string (rotas do projeto).
type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

export default function TransitionLink({ href, onClick, ...rest }: Props) {
  const navigate = useRouteTransition();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    // Encadeia handler externo (ex.: fechar o menu) antes de decidir.
    onClick?.(e);

    // Deixa o browser cuidar de: default já prevenido, botão não-esquerdo,
    // modificadores (abrir em nova aba) e target explícito.
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      (rest.target && rest.target !== "_self")
    ) {
      return;
    }

    e.preventDefault();
    navigate(href);
  }

  return <Link href={href} onClick={handleClick} {...rest} />;
}
