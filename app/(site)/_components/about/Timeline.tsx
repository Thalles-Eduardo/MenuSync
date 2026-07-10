"use client";

import { useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MILESTONES } from "./about-data";

gsap.registerPlugin(ScrollTrigger);

export default function Timeline() {
  const scope = useRef<HTMLDivElement>(null);
  const reduce = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useGSAP(
    () => {
      if (reduce) return;
      gsap.fromTo(
        ".tl-progress",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: scope.current,
            start: "top 70%",
            end: "bottom 75%",
            scrub: true,
          },
        },
      );
      gsap.utils.toArray<HTMLElement>(".tl-item").forEach((item) => {
        gsap.from(item, {
          scrollTrigger: { trigger: item, start: "top 82%", once: true },
          y: 30,
          opacity: 0,
          scale: 0.96,
          duration: 0.6,
          ease: "power3.out",
        });
      });
    },
    { scope },
  );

  return (
    <div ref={scope} className="relative mx-auto mt-20 max-w-4xl">
      <div className="pointer-events-none absolute top-0 bottom-0 left-4 w-px bg-white/15 md:left-1/2 md:-translate-x-1/2">
        <div className="tl-progress absolute inset-0 origin-top bg-salmon" />
      </div>

      <ul className="space-y-14">
        {MILESTONES.map((m, i) => {
          const right = i % 2 === 1;
          return (
            <li key={m.year} className="tl-item relative md:grid md:grid-cols-2">
              <div
                className={`pl-12 md:pl-0 ${
                  right ? "md:col-start-2 md:pl-10 md:text-left" : "md:col-start-1 md:pr-10 md:text-right"
                }`}
              >
                <p className="text-2xl font-bold text-yellow" style={{ fontFamily: "var(--font-eczar), serif" }}>
                  {m.year}
                </p>
                <h3 className="mt-1 text-xl font-semibold">{m.title}</h3>
                <p className="mt-1 text-white/70">{m.text}</p>
              </div>
              <span className="absolute top-1 left-4 -translate-x-1/2 md:left-1/2">
                <span
                  className="block h-4 w-4 rounded-full border-2 border-salmon"
                  style={{ backgroundColor: "var(--color-dark-blue)" }}
                />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
