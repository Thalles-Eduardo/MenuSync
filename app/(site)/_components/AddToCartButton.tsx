"use client";

import { useRef } from "react";
import gsap from "gsap";

function CartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7.5 18C8.32843 18 9 18.6716 9 19.5C9 20.3284 8.32843 21 7.5 21C6.67157 21 6 20.3284 6 19.5C6 18.6716 6.67157 18 7.5 18Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M16.5 18.0001C17.3284 18.0001 18 18.6716 18 19.5001C18 20.3285 17.3284 21.0001 16.5 21.0001C15.6716 21.0001 15 20.3285 15 19.5001C15 18.6716 15.6716 18.0001 16.5 18.0001Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M2 3L2.26121 3.09184C3.5628 3.54945 4.2136 3.77826 4.58584 4.32298C4.95808 4.86771 4.95808 5.59126 4.95808 7.03836V9.76C4.95808 12.7016 5.02132 13.6723 5.88772 14.5862C6.75412 15.5 8.14857 15.5 10.9375 15.5H12M16.2404 15.5C17.8014 15.5 18.5819 15.5 19.1336 15.0504C19.6853 14.6008 19.8429 13.8364 20.158 12.3075L20.6578 9.88275C21.0049 8.14369 21.1784 7.27417 20.7345 6.69708C20.2906 6.12 18.7738 6.12 17.0888 6.12H11.0235M4.95808 6.12H7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 12.5L9 17.5L20 6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AddToCartButton({ compact = false }: { compact?: boolean }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);

  const handleClick = () => {
    if (busy.current || !btnRef.current) return;
    busy.current = true;

    const q = gsap.utils.selector(btnRef);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      gsap.set(q(".atc-idle"), { autoAlpha: 0 });
      gsap.set(q(".atc-done"), { autoAlpha: 1 });
      gsap.delayedCall(1.2, () => {
        gsap.set(q(".atc-done"), { autoAlpha: 0 });
        gsap.set(q(".atc-idle"), { autoAlpha: 1 });
        busy.current = false;
      });
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        busy.current = false;
      },
    });

    tl.to(q(".atc-idle"), { autoAlpha: 0, y: -6, duration: 0.2, ease: "power2.in" })
      // carrinho entra pela esquerda
      .fromTo(
        q(".atc-cart"),
        { autoAlpha: 0, x: -70 },
        { autoAlpha: 1, x: -8, duration: 0.55, ease: "power3.out" }
      )
      // item cai dentro do carrinho, com quique
      .fromTo(
        q(".atc-box"),
        { autoAlpha: 0, y: -22, scale: 0.5 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "bounce.out" },
        "-=0.15"
      )
      .to({}, { duration: 0.25 })
      // carrinho sai pela direita
      .to(q(".atc-cart"), { x: 95, autoAlpha: 0, duration: 0.5, ease: "power3.in" })
      .set(q(".atc-box"), { autoAlpha: 0 })
      // estado de sucesso
      .fromTo(
        q(".atc-done"),
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.35, ease: "back.out(2)" },
        "-=0.1"
      )
      .to(q(".atc-done"), { autoAlpha: 0, duration: 0.3, delay: 1.2 })
      // volta ao estado inicial
      .to(q(".atc-idle"), { autoAlpha: 1, y: 0, duration: 0.3 }, "-=0.05");
  };

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={handleClick}
      className={`relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-md bg-salmon font-semibold text-white transition hover:brightness-110 ${
        compact ? "h-11 min-w-[132px] px-4 text-sm" : "h-[52px] min-w-[170px] px-5"
      }`}
    >
      <span className="atc-idle inline-flex items-center gap-2">
        <CartIcon className="h-7 w-7" />
        <span>Adicionar</span>
      </span>

      <span className="atc-cart pointer-events-none absolute inset-0 flex items-center justify-center opacity-0">
        <span className="relative inline-flex">
          <CartIcon className="h-7 w-7" />
          <span className="atc-box absolute left-1/2 top-1 h-2.5 w-2.5 -translate-x-1/2 rounded-[2px] bg-white opacity-0" />
        </span>
      </span>

      <span className="atc-done pointer-events-none absolute inset-0 flex items-center justify-center gap-2 opacity-0">
        <CheckIcon className="h-6 w-6" />
        <span>Adicionado</span>
      </span>
    </button>
  );
}
