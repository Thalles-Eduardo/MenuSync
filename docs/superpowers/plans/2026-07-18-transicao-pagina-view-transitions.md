# Transição de página imperceptível (View Transitions API) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Navegação entre `/` e `/cardapio` com crossfade suave e navbar estável, usando a View Transitions API nativa do browser — sem flash/corte, sem dependência nova, sem trocar o React.

**Architecture:** Um `RouteTransitionProvider` (client, no root layout) expõe `navigate(href)` que embrulha `router.push` em `document.startViewTransition`, resolvendo a transição quando o `pathname` commita. Um `TransitionLink` substitui os `<Link>` de rota. CSS define o crossfade e `view-transition-name: navbar` mantém a navbar pinada. O `Loader` passa a tocar só uma vez por sessão.

**Tech Stack:** Next 16.2.9 (App Router), React 19.2.4 estável, TypeScript, Tailwind v4, styled-jsx, GSAP. **Sem framework de testes** — verificação = `npx tsc --noEmit` + `npm run lint` + `npm run build` + inspeção visual via CDP.

---

## Notas para o executor

- Caminhos com `(site)` são um route group do Next — em imports JS use o caminho
  literal com os parênteses (ex.: `./TransitionLink` a partir de dentro de
  `app/(site)/_components/`). Em comandos de shell/git no Windows, **aspas** em
  caminhos com parênteses.
- Este projeto trata `react-hooks/set-state-in-effect` como **erro**. `setState`
  dentro de `useGSAP` (layout effect do GSAP) já é usado no `Loader` hoje e não é
  sinalizado pela regra — pode manter. Não introduzir `setState` síncrono em
  `useEffect`/`useLayoutEffect` sem necessidade.
- Não há dev server garantido rodando; a Task de verificação sobe um.

## Estrutura de arquivos

- **Criar** `app/(site)/_components/RouteTransitionProvider.tsx` — provider client +
  hook `useRouteTransition`; dona a lógica de `startViewTransition`.
- **Criar** `app/(site)/_components/TransitionLink.tsx` — wrapper de `next/link` que
  chama `navigate`.
- **Editar** `app/layout.tsx` — montar o provider em volta de `{children}`.
- **Editar** `app/(site)/_components/Navbar.tsx` — logo vira `TransitionLink`; classe
  `navbar-vt` no `<nav>`.
- **Editar** `app/(site)/_components/HamburgerMenu.tsx` — `<Link>` de item vira
  `TransitionLink`.
- **Editar** `app/(site)/_components/MenuBento.tsx` — CTA vira `TransitionLink`.
- **Editar** `app/(site)/_components/ReservasCTA.tsx` — botão Reservar vira
  `TransitionLink`.
- **Editar** `app/globals.css` — regras `::view-transition-*` + `.navbar-vt`.
- **Editar** `app/(site)/_components/Loader.tsx` — once-per-session via
  `sessionStorage`.

---

### Task 1: RouteTransitionProvider + hook

**Files:**
- Create: `app/(site)/_components/RouteTransitionProvider.tsx`

- [ ] **Step 1: Criar o provider e o hook**

```tsx
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
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros (o arquivo ainda não é importado por ninguém, mas deve compilar).

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/_components/RouteTransitionProvider.tsx"
git commit -m "feat(transition): RouteTransitionProvider (View Transitions API)"
```

---

### Task 2: TransitionLink

**Files:**
- Create: `app/(site)/_components/TransitionLink.tsx`

- [ ] **Step 1: Criar o wrapper de Link**

```tsx
"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { useRouteTransition } from "./RouteTransitionProvider";

// Mesma superfície do next/link, mas href é sempre string (rotas do projeto).
type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

export default function TransitionLink({ href, onClick, ...rest }: Props) {
  const navigate = useRouteTransition();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    // Encadeia handler externo (ex.: fechar o menu) antes de decidir.
    onClick?.(e);

    // Deixa o browser cuidar de: default já prevenido, botão não-esquerdo,
    // modificadores (abrir em nova aba) e target explícito.
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      (rest.target && rest.target !== "_self")
    ) {
      return;
    }

    e.preventDefault();
    navigate(href);
  }

  return <Link href={href} onClick={handleClick} {...rest} />;
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/_components/TransitionLink.tsx"
git commit -m "feat(transition): TransitionLink wrapper de next/link"
```

---

### Task 3: Montar o provider no root layout

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Importar o provider**

No topo de `app/layout.tsx`, após os imports existentes (depois de `import localFont from "next/font/local";`), adicione:

```tsx
import RouteTransitionProvider from "./(site)/_components/RouteTransitionProvider";
```

- [ ] **Step 2: Envolver `{children}`**

Troque:

```tsx
      <body suppressHydrationWarning={true} className= "min-h-full flex flex-col">{children}</body>
```

por:

```tsx
      <body suppressHydrationWarning={true} className= "min-h-full flex flex-col">
        <RouteTransitionProvider>{children}</RouteTransitionProvider>
      </body>
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(transition): monta RouteTransitionProvider no root layout"
```

---

### Task 4: Navbar — logo com TransitionLink + classe navbar-vt

**Files:**
- Modify: `app/(site)/_components/Navbar.tsx`

- [ ] **Step 1: Trocar o import de Link por TransitionLink**

Troque:

```tsx
import Link from "next/link";
```

por:

```tsx
import TransitionLink from "./TransitionLink";
```

- [ ] **Step 2: Adicionar a classe `navbar-vt` ao `<nav>`**

Troque:

```tsx
    <nav className="fixed inset-x-0 top-0 z-[55] flex items-center justify-between px-6 py-6 md:px-12">
```

por:

```tsx
    <nav className="navbar-vt fixed inset-x-0 top-0 z-[55] flex items-center justify-between px-6 py-6 md:px-12">
```

- [ ] **Step 3: Trocar o `<Link>` do logo por `<TransitionLink>`**

Troque:

```tsx
      <Link
        href="/"
        className="text-2xl font-semibold tracking-wide text-white transition hover:opacity-90 md:text-3xl"
        style={{ fontFamily: "var(--font-eczar), serif" }}
      >
        Menu<span className="text-salmon">Sync</span>
      </Link>
```

por:

```tsx
      <TransitionLink
        href="/"
        className="text-2xl font-semibold tracking-wide text-white transition hover:opacity-90 md:text-3xl"
        style={{ fontFamily: "var(--font-eczar), serif" }}
      >
        Menu<span className="text-salmon">Sync</span>
      </TransitionLink>
```

- [ ] **Step 4: Verificar tipos e lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros; nenhum aviso de import não usado (`Link` foi removido).

- [ ] **Step 5: Commit**

```bash
git add "app/(site)/_components/Navbar.tsx"
git commit -m "feat(transition): logo da navbar usa TransitionLink + navbar-vt"
```

---

### Task 5: HamburgerMenu — item com TransitionLink

**Files:**
- Modify: `app/(site)/_components/HamburgerMenu.tsx`

- [ ] **Step 1: Trocar o import**

Troque:

```tsx
import Link from "next/link";
```

por:

```tsx
import TransitionLink from "./TransitionLink";
```

- [ ] **Step 2: Trocar o `<Link>` do item por `<TransitionLink>`**

Troque:

```tsx
              return (
                <Link key={it.label} href={it.href} className="item" onClick={() => setOpen(false)}>
                  {it.icon}
                  {it.label}
                </Link>
              );
```

por:

```tsx
              return (
                <TransitionLink key={it.label} href={it.href} className="item" onClick={() => setOpen(false)}>
                  {it.icon}
                  {it.label}
                </TransitionLink>
              );
```

- [ ] **Step 3: Verificar tipos e lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros; `Link` não é mais importado nem usado.

- [ ] **Step 4: Commit**

```bash
git add "app/(site)/_components/HamburgerMenu.tsx"
git commit -m "feat(transition): itens do menu hamburguer usam TransitionLink"
```

---

### Task 6: MenuBento — CTA com TransitionLink

**Files:**
- Modify: `app/(site)/_components/MenuBento.tsx`

- [ ] **Step 1: Trocar o import**

Troque (linha 4):

```tsx
import Link from "next/link";
```

por:

```tsx
import TransitionLink from "./TransitionLink";
```

- [ ] **Step 2: Trocar o `<Link>` do card CTA**

Troque:

```tsx
        <Link
          href="/cardapio"
          className="bento-cta group flex flex-col justify-between gap-6 rounded-2xl border border-yellow/30 bg-gradient-to-br from-salmon/20 to-transparent p-6 transition hover:border-yellow/60"
        >
```

por:

```tsx
        <TransitionLink
          href="/cardapio"
          className="bento-cta group flex flex-col justify-between gap-6 rounded-2xl border border-yellow/30 bg-gradient-to-br from-salmon/20 to-transparent p-6 transition hover:border-yellow/60"
        >
```

E o fechamento correspondente, troque `</Link>` (o que fecha esse card CTA, logo após o `</button>` do bento-cta) por `</TransitionLink>`.

- [ ] **Step 3: Verificar tipos e lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros; `Link` não é mais usado no arquivo.

- [ ] **Step 4: Commit**

```bash
git add "app/(site)/_components/MenuBento.tsx"
git commit -m "feat(transition): CTA do MenuBento usa TransitionLink"
```

---

### Task 7: ReservasCTA — botão Reservar com TransitionLink

**Files:**
- Modify: `app/(site)/_components/ReservasCTA.tsx`

- [ ] **Step 1: Trocar o import**

Troque (linha 4):

```tsx
import Link from "next/link";
```

por:

```tsx
import TransitionLink from "./TransitionLink";
```

- [ ] **Step 2: Trocar o `<Link>` do botão Reservar**

Troque:

```tsx
            <Link
              href="/reserva"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-yellow px-7 font-semibold text-dark-blue shadow-[5px_5px_18px_rgba(0,0,0,0.18)] transition-all duration-500 hover:bg-caramel active:scale-[0.97]"
            >
              Reservar mesa
            </Link>
```

por:

```tsx
            <TransitionLink
              href="/reserva"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-yellow px-7 font-semibold text-dark-blue shadow-[5px_5px_18px_rgba(0,0,0,0.18)] transition-all duration-500 hover:bg-caramel active:scale-[0.97]"
            >
              Reservar mesa
            </TransitionLink>
```

- [ ] **Step 3: Verificar tipos e lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros; `Link` não é mais usado no arquivo.

- [ ] **Step 4: Commit**

```bash
git add "app/(site)/_components/ReservasCTA.tsx"
git commit -m "feat(transition): botao Reservar usa TransitionLink"
```

---

### Task 8: CSS das View Transitions

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Acrescentar as regras ao final de `globals.css`**

Adicione ao final do arquivo:

```css
/* ---- View Transitions (transição de página imperceptível) ---- */
@media (prefers-reduced-motion: no-preference) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 350ms;
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
}

/* A navbar fixa é casada old/new pelo nome e permanece estável (sem flicker). */
.navbar-vt {
  view-transition-name: navbar;
}
```

- [ ] **Step 2: Verificar build (CSS válido)**

Run: `npm run build`
Expected: build conclui sem erro de CSS; rotas `/` e `/cardapio` compilam.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(transition): CSS de crossfade + navbar pinada (view-transition-name)"
```

---

### Task 9: Loader once-per-session

**Files:**
- Modify: `app/(site)/_components/Loader.tsx`

- [ ] **Step 1: Pular a intro quando já foi mostrada na sessão**

Troque o corpo do `useGSAP` (linhas 16–36 aprox.):

```tsx
  useGSAP(
    () => {
      // Sem movimento: revela a home imediatamente.
      if (reduce) {
        setDone(true);
        return;
      }

      const tl = gsap.timeline({ onComplete: () => setDone(true) });
      // Título surge pequeno e cresce até o tamanho normal...
      tl.fromTo(
        ".loader-word",
        { opacity: 0, scale: 0.55 },
        { opacity: 1, scale: 2, duration: 1.2, ease: "power3.out" }
      )
        // ...e só depois de terminar, o subtítulo aparece.
        .to(".loader-sub", { opacity: 1, duration: 0.6, ease: "power2.out" }, "+=0.15")
        .to(root.current, { opacity: 0, duration: 0.6, ease: "power2.inOut", delay: 0.5 });
    },
    { scope: root }
  );
```

por:

```tsx
  useGSAP(
    () => {
      // Intro toca uma única vez por sessão. Em navegações client-side (ex.:
      // voltar de /cardapio) ou com reduced-motion, revela a home na hora —
      // sem re-disparar a abertura, preservando a transição de página.
      const alreadyShown =
        typeof window !== "undefined" &&
        window.sessionStorage.getItem("loaderShown") === "1";

      if (reduce || alreadyShown) {
        setDone(true);
        return;
      }

      const tl = gsap.timeline({
        onComplete: () => {
          window.sessionStorage.setItem("loaderShown", "1");
          setDone(true);
        },
      });
      // Título surge pequeno e cresce até o tamanho normal...
      tl.fromTo(
        ".loader-word",
        { opacity: 0, scale: 0.55 },
        { opacity: 1, scale: 2, duration: 1.2, ease: "power3.out" }
      )
        // ...e só depois de terminar, o subtítulo aparece.
        .to(".loader-sub", { opacity: 1, duration: 0.6, ease: "power2.out" }, "+=0.15")
        .to(root.current, { opacity: 0, duration: 0.6, ease: "power2.inOut", delay: 0.5 });
    },
    { scope: root }
  );
```

- [ ] **Step 2: Verificar tipos e lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros. (O `setDone` dentro de `useGSAP` já existia e não é sinalizado
pela regra `set-state-in-effect`.)

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/_components/Loader.tsx"
git commit -m "feat(transition): Loader toca a intro apenas uma vez por sessao"
```

---

### Task 10: Verificação end-to-end (tsc/lint/build + CDP)

**Files:** nenhum (validação).

- [ ] **Step 1: Checagens estáticas**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: tudo limpo; `/` e `/cardapio` compilam como rotas.

- [ ] **Step 2: Subir o dev server**

Run (background): `npm run dev`
Aguardar `Ready` / `localhost:3000`.

- [ ] **Step 3: CDP — roteiro visual (headless Chrome, 1440×900)**

Adaptar o script de CDP existente em scratchpad
(`verify-navbar.mjs` / `verify-burger.mjs`) para:

1. Navegar `http://localhost:3000` (home).
2. `Runtime.evaluate`:
   - `typeof document.startViewTransition === "function"` → deve ser `true`.
   - `getComputedStyle(document.querySelector('nav.navbar-vt')).viewTransitionName`
     → deve ser `"navbar"`.
3. Abrir o hambúrguer, clicar **Cardápio** → esperar `location.pathname === "/cardapio"`.
   - Capturar screenshots em sequência (t0, t+120ms, t+300ms) para conferir o
     crossfade e a navbar imóvel. Confirmar ausência de fundo branco entre frames.
4. Clicar o logo → esperar `location.pathname === "/"`.
   - Confirmar que o `Loader` NÃO reaparece (nenhum elemento `z-[100]` de overlay
     com "MENU SYNC" visível): `!document.querySelector('.loader-word')`.
5. Ir para `/cardapio`, abrir menu, clicar **Sobre** → esperar `pathname === "/"`,
   `location.search === ""`, e a seção "Sobre" ativa
   (`nav[aria-label="Seções"] [aria-current="true"]` textContent = "Sobre").
6. Emular reduced-motion (`Emulation.setEmulatedMedia` com
   `{name:'prefers-reduced-motion', value:'reduce'}`), repetir `/`→`/cardapio` e
   confirmar navegação instantânea sem quebra (pathname muda, sem erro).

Salvar screenshots no scratchpad (`vt-*.png`) e revisar.

- [ ] **Step 4: Parar o dev server**

Run: `taskkill //F //IM node.exe` (notificação benigna de "background task failed" é esperada).

- [ ] **Step 5: Commit (se algum ajuste de código foi necessário na verificação)**

```bash
git add -A
git commit -m "test(transition): verificacao CDP da transicao de pagina"
```

Se nenhum código mudou (só screenshots no scratchpad, fora do repo), não há o que commitar.

---

## Self-review (cobertura da spec)

- Objetivo (crossfade + navbar estável): Tasks 1–4, 8. ✓
- `RouteTransitionProvider` (padrão canônico + fallback + guarda same-path):
  Task 1. ✓
- `TransitionLink` (respeita modificadores/target): Task 2. ✓
- Substituições de `<Link>` de rota (Navbar, HamburgerMenu, MenuBento, ReservasCTA):
  Tasks 4–7. ✓
- CSS (`::view-transition-*` + `.navbar-vt`): Task 8. ✓
- Loader once-per-session (hydration-safe via estado inicial `false` + decisão no
  layout effect do `useGSAP`): Task 9. ✓
- Verificação (tsc/lint/build + CDP + reduced-motion + deep-link): Task 10. ✓
- Fora de escopo (criar `/reserva`, morph de elemento compartilhado): não incluído,
  conforme spec. ✓
- Consistência de nomes: `useRouteTransition`, `navigate`, `finishRef`,
  `navbar-vt`, `loaderShown` usados de forma idêntica entre tasks. ✓
