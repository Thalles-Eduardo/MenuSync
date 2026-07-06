"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";

// Carrega three/R3F só no cliente e fora do bundle inicial.
const AtmosphereScene = dynamic(() => import("./AtmosphereScene"), {
  ssr: false,
  loading: () => null,
});

// Retorna false no SSR e no primeiro render do cliente; true após a hidratação.
// Evita mismatch de hidratação sem usar setState em efeito.
const noopSubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

// Se a cena WebGL falhar em runtime, engole o erro e some — nunca quebra a hero.
class SafeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function AtmosphereLayer() {
  const pointer = useRef({ x: 0.5, y: 0.5 });
  const hydrated = useHydrated();

  const { enabled, reduced, finePointer } = useMemo(() => {
    if (typeof window === "undefined") {
      return { enabled: false, reduced: true, finePointer: false };
    }
    return {
      enabled: hasWebGL(),
      reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      finePointer: window.matchMedia("(pointer: fine)").matches,
    };
  }, []);

  useEffect(() => {
    if (!finePointer) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = e.clientX / window.innerWidth;
      pointer.current.y = e.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [finePointer]);

  if (!hydrated || !enabled) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      <SafeBoundary>
        <AtmosphereScene pointer={pointer} reduced={reduced} interactive={finePointer} />
      </SafeBoundary>
    </div>
  );
}
