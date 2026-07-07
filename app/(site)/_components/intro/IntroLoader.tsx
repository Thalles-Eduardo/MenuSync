"use client";

import { useProgress } from "@react-three/drei";

// Overlay de carregamento; some quando os assets terminam de carregar.
export default function IntroLoader() {
  const { progress, active } = useProgress();
  if (!active && progress >= 100) return null;

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6"
      style={{ backgroundColor: "var(--color-dark-blue)" }}
    >
      <h1
        className="text-5xl font-bold tracking-widest md:text-7xl"
        style={{
          fontFamily: "var(--font-ming), serif",
          color: "#f5e6c8",
          textShadow: "0 0 24px rgba(245,214,140,0.65)",
        }}
      >
        MENU SYNC
      </h1>
      <div className="h-1 w-56 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full bg-yellow transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs tracking-[0.25em] text-white/50">{Math.round(progress)}%</p>
    </div>
  );
}
