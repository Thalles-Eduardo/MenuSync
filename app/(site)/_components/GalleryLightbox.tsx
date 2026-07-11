"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import gsap from "gsap";
import type { GalleryImage } from "../_data/gallery";

const noopSubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

type Props = {
  images: GalleryImage[];
  openIndex: number | null;
  onOpenIndexChange: (index: number | null) => void;
};

export default function GalleryLightbox({ images, openIndex, onOpenIndexChange }: Props) {
  const mounted = useHydrated();
  const open = openIndex !== null;
  const n = images.length;
  const dialogRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (!reduce && backdropRef.current && dialogRef.current) {
      gsap.fromTo(backdropRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: "power2.out" });
      gsap.fromTo(
        dialogRef.current,
        { autoAlpha: 0, scale: 0.96 },
        { autoAlpha: 1, scale: 1, duration: 0.35, ease: "power3.out" },
      );
    }

    dialogRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenIndexChange(null);
      else if (e.key === "ArrowRight") onOpenIndexChange(((openIndex as number) + 1) % n);
      else if (e.key === "ArrowLeft") onOpenIndexChange(((openIndex as number) - 1 + n) % n);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, openIndex, n, onOpenIndexChange]);

  if (!open || !mounted) return null;

  const img = images[openIndex as number];
  const go = (dir: number) => onOpenIndexChange((((openIndex as number) + dir) % n + n) % n);

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={() => onOpenIndexChange(null)}
      role="dialog"
      aria-modal="true"
      aria-label={`Foto: ${img.caption}`}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative flex max-h-[88vh] w-[92vw] max-w-5xl flex-col outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onOpenIndexChange(null)}
          aria-label="Fechar"
          className="absolute -top-12 right-0 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="relative h-[72vh] w-full">
          <Image
            key={img.src}
            src={img.src}
            alt={img.alt}
            fill
            sizes="92vw"
            className="rounded-xl object-contain"
            priority
          />
        </div>

        <p className="mt-4 text-center text-sm text-white/80">{img.caption}</p>

        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Foto anterior"
          className="absolute top-1/2 -left-4 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:-left-16"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Próxima foto"
          className="absolute top-1/2 -right-4 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:-right-16"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>,
    document.body,
  );
}
