"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Loader from "../Loader";
import IntroLoader from "./IntroLoader";

gsap.registerPlugin(ScrollTrigger);

const IntroScene = dynamic(() => import("./IntroScene"), { ssr: false, loading: () => null });

// hidratação-safe: false no SSR e no 1º render do cliente, true depois.
const noopSubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

class SafeBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function IntroExperience() {
  const hydrated = useHydrated();
  const progress = useRef(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  const enabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.innerWidth < 1024;
    return hasWebGL() && !reduced && !coarse && !narrow;
  }, []);

  useGSAP(
    () => {
      if (!enabled || !sectionRef.current) return;
      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          progress.current = self.progress;
          if (flashRef.current) {
            const f = gsap.utils.clamp(0, 1, (self.progress - 0.82) / 0.18);
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
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[color:var(--color-dark-blue)]">
        <SafeBoundary fallback={null}>
          <IntroScene progress={progress} />
        </SafeBoundary>
        <IntroLoader />
        <div
          ref={flashRef}
          className="pointer-events-none absolute inset-0 z-10 opacity-0"
          style={{
            background:
              "radial-gradient(circle at 50% 55%, #fff7e6 0%, #ffdca0 40%, #ffb066 100%)",
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
