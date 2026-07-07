"use client";

import { useMemo, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Loader from "../Loader";
import IntroLoader from "./IntroLoader";

gsap.registerPlugin(ScrollTrigger);

// hidratação-safe: false no SSR e no 1º render do cliente, true depois.
const noopSubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export default function IntroExperience() {
  const hydrated = useHydrated();
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  const enabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.innerWidth < 1024;
    return !reduced && !coarse && !narrow;
  }, []);

  // O scroll dirige o tempo do vídeo (câmera atravessando os torii) e o flash no fim.
  useGSAP(
    () => {
      if (!enabled || !sectionRef.current) return;
      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        onUpdate: (self) => {
          const v = videoRef.current;
          if (v && Number.isFinite(v.duration) && v.duration > 0) {
            v.currentTime = self.progress * v.duration;
          }
          if (flashRef.current) {
            const f = gsap.utils.clamp(0, 1, (self.progress - 0.86) / 0.14);
            flashRef.current.style.opacity = String(f);
          }
        },
      });
      return () => st.kill();
    },
    { dependencies: [enabled, hydrated] }
  );

  if (!hydrated) return null; // evita mismatch de hidratação
  if (!enabled) return <Loader />; // fallback: intro em texto → hero

  return (
    <div ref={sectionRef} className="relative h-[400vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          src="/video/bgLoader.mp4"
          muted
          playsInline
          preload="auto"
        />
        <IntroLoader />
        <div
          ref={flashRef}
          className="pointer-events-none absolute inset-0 z-10 opacity-0"
          style={{
            background:
              "radial-gradient(circle at 50% 55%, #fff7e6 0%, #ffdca0 45%, #ffb066 100%)",
          }}
        />
        <button
          type="button"
          onClick={() => {
            const el = sectionRef.current;
            if (el) window.scrollTo({ top: el.offsetTop + el.offsetHeight, behavior: "smooth" });
          }}
          className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/30 bg-black/30 px-4 py-2 text-sm text-white/80 backdrop-blur transition hover:text-white"
        >
          Pular intro ↓
        </button>
      </div>
    </div>
  );
}
