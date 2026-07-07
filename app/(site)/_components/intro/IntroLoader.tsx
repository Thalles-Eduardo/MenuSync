"use client";

import { useEffect, useState } from "react";

// Cobertura de marca no início da intro: MENU SYNC com glow, fade e some.
// Independente de progresso de assets (a cena é procedural + vídeo leve).
export default function IntroLoader() {
  const [leaving, setLeaving] = useState(false);
  const [done, setDone] = useState(false);

  // Só é montado quando a intro 3D está ativa (motion habilitado), então não
  // precisa tratar reduced-motion aqui — esse caso já cai no fallback.
  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 1300);
    const t2 = setTimeout(() => setDone(true), 1950);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (done) return null;

  return (
    <div
      className={`absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-700 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
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
    </div>
  );
}
