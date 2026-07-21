"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

// Contexto que carrega a função de navegação com View Transition.
const RouteTransitionContext = createContext<(href: string) => void>(() => {});

export const useRouteTransition = () => useContext(RouteTransitionContext);

export default function RouteTransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // Resolver da transição em andamento: chamado quando a nova rota commita.
  const finishRef = useRef<(() => void) | null>(null);

  // Quando o pathname muda (nova rota renderizada), fechamos a promise para o
  // browser capturar o snapshot novo e concluir o crossfade.
  useEffect(() => {
    finishRef.current?.();
    finishRef.current = null;
  }, [pathname]);

  const navigate = useCallback(
    (href: string) => {
      const targetPath = href.split(/[?#]/)[0];
      const doc = document as Document & {
        startViewTransition?: (cb: () => Promise<void> | void) => unknown;
      };

      // Fallback: sem suporte à API, ou navegação que não muda o pathname
      // (a promise nunca resolveria) → navegação instantânea.
      if (
        typeof doc.startViewTransition !== "function" ||
        targetPath === pathname
      ) {
        router.push(href);
        return;
      }

      doc.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            finishRef.current = resolve;
            router.push(href);
          }),
      );
    },
    [router, pathname],
  );

  return (
    <RouteTransitionContext.Provider value={navigate}>
      {children}
    </RouteTransitionContext.Provider>
  );
}
