"use client";

import { useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function Loader() {
  const [done, setDone] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const reduce = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useGSAP(
    () => {
      // Sem movimento: revela a home imediatamente.
      if (reduce) {
        setDone(true);
        return;
      }

      const tl = gsap.timeline({ onComplete: () => setDone(true) });
      tl.to(".loader-word", { opacity: 1, duration: 1.1, ease: "power2.out" })
        .to(".loader-sub", { opacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.4")
        .to(root.current, { opacity: 0, duration: 0.6, ease: "power2.inOut", delay: 0.5 });
    },
    { scope: root }
  );

  if (done) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: "var(--color-dark-blue)" }}
      aria-hidden="true"
    >
      <span
        className="loader-word text-5xl tracking-wide text-white opacity-0 md:text-7xl lg:text-8xl"
        style={{
          fontFamily: "var(--font-ming), serif",
          textShadow:
            "0 0 12px rgba(255,255,255,.95), 0 0 32px rgba(255,255,255,.7), 0 0 64px rgba(255,255,255,.45)",
        }}
      >
        MENU SYNC
      </span>

      <span className="loader-sub mt-8 text-sm tracking-[0.25em] text-white/80 underline underline-offset-4 opacity-0">
        todos os direitos reservados Menu Sync©
      </span>
    </div>
  );
}
