"use client";

import { useMemo, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Loader from "../Loader";
import IntroLoader from "./IntroLoader";

gsap.registerPlugin(ScrollTrigger);

const GATE_COUNT = 7;
const GATES = Array.from({ length: GATE_COUNT }, (_, i) => i);

// hidratação-safe: false no SSR e no 1º render do cliente, true depois.
const noopSubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

// Silhueta de torii (portão japonês) — vetor, escala/recolor sem perda.
function ToriiSvg() {
  return (
    <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
      {/* kasagi (viga superior, pontas erguidas) */}
      <path d="M14 30 Q100 46 186 30 L186 44 Q100 60 14 44 Z" fill="currentColor" />
      {/* nuki (viga inferior) */}
      <rect x="38" y="62" width="124" height="11" rx="1" fill="currentColor" />
      {/* pilares */}
      <rect x="56" y="40" width="12" height="108" rx="1" fill="currentColor" />
      <rect x="132" y="40" width="12" height="108" rx="1" fill="currentColor" />
      {/* gakuzuka (strut central) */}
      <rect x="94" y="46" width="12" height="18" fill="currentColor" />
    </svg>
  );
}

export default function IntroExperience() {
  const hydrated = useHydrated();
  const sectionRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  const enabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.innerWidth < 1024;
    return !reduced && !coarse && !narrow;
  }, []);

  // O vídeo do lago toca solto (fluido); o scroll dirige os portões surgindo
  // e passando pela câmera (transform/opacity = suave), e o flash no fim.
  useGSAP(
    () => {
      if (!enabled || !sectionRef.current) return;
      const gates = gsap.utils.toArray<HTMLElement>(".intro-gate");
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
        },
      });

      gates.forEach((el, i) => {
        const g = gsap.timeline();
        g.fromTo(
          el,
          { scale: 0.15, opacity: 0, xPercent: -50, yPercent: -50 },
          { scale: 1.15, opacity: 1, duration: 0.5, ease: "power1.out" }
        ).to(el, { scale: 4, opacity: 0, duration: 0.5, ease: "power2.in" });
        tl.add(g, i * 0.5);
      });

      if (flashRef.current) {
        tl.fromTo(
          flashRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.5, ease: "power2.in" },
          ">-0.25"
        );
      }

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { dependencies: [enabled, hydrated], scope: sectionRef }
  );

  if (!hydrated) return null; // evita mismatch de hidratação
  if (!enabled) return <Loader />; // fallback: intro em texto → hero

  return (
    <div ref={sectionRef} className="relative h-[400vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/video/lake.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />

        {/* Corredor de portões que surgem e passam conforme o scroll */}
        <div className="pointer-events-none absolute inset-0">
          {GATES.map((i) => (
            <div
              key={i}
              className="intro-gate absolute left-1/2 top-1/2 w-[42vmin] max-w-[380px] text-[#d6402b] opacity-0 will-change-transform drop-shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
            >
              <ToriiSvg />
            </div>
          ))}
        </div>

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
