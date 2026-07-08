"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import gsap from "gsap";

const noopSubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export default function PlayVideoButton({ src }: { src: string }) {
  const [open, setOpen] = useState(false);
  const mounted = useHydrated();
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Anima a entrada e trava o scroll do body enquanto aberto
  useEffect(() => {
    if (!open) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (!reduce && backdropRef.current && dialogRef.current) {
      gsap.fromTo(
        backdropRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.3, ease: "power2.out" },
      );
      gsap.fromTo(
        dialogRef.current,
        { autoAlpha: 0, y: 24, scale: 0.94 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out" },
      );
    }

    // tenta dar play automático (muted não é necessário pois é ação do usuário)
    videoRef.current?.play().catch(() => {});

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  function close() {
    videoRef.current?.pause();
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex cursor-pointer items-center gap-2 text-white/90 transition hover:text-white"
      >
        <Image src="/icons/play.svg" alt="" width={28} height={28} />
        <span>Play no vídeo</span>
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            ref={backdropRef}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label="Vídeo de preparo do prato"
          >
          <div
            ref={dialogRef}
            className="relative w-[92vw] max-w-6xl overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Fechar vídeo"
              className="absolute right-3 top-3 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <video
              ref={videoRef}
              src={src}
              controls
              playsInline
              className="max-h-[85vh] w-full bg-black object-contain"
            />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
