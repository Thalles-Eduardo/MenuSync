# Sakura Brotando (section Cardápio) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ao entrar (scroll) na section "Destaques do cardápio", dois ramos de sakura brotam dos cantos inferiores — o galho se desenha e as flores desabrocham em stagger.

**Architecture:** Um componente isolado novo (`SakuraCorners.tsx`) renderiza dois ramos de sakura em SVG inline (esquerdo + direito espelhado), sobrepostos à section com `pointer-events-none` e z-index atrás dos cards. A animação usa GSAP + ScrollTrigger (`once: true`), com o galho desenhado via `stroke-dashoffset` (sem plugin pago) e as flores em stagger; há guarda de `prefers-reduced-motion`.

**Tech Stack:** Next.js 16 (App Router, client component), React 19, TypeScript, Tailwind v4, GSAP + `@gsap/react` (`useGSAP`), `gsap/ScrollTrigger`. SVG inline.

---

## Notas de verificação (projeto sem testes)

Não há framework de testes. Cada task verifica com:
- `npx tsc --noEmit` (sem erros)
- `npm run lint` (limpo)
- `npm run build` (só na última task)

A **verificação visual via CDP** (screenshots de meio de animação, estado final, mobile e reduced-motion) é feita pelo **controlador** (sessão principal) entre as tasks, não pelo subagente. O subagente deve reportar após passar `tsc`/`lint` e parar para revisão.

**Restrição de commits (IMPORTANTE):** o repositório tem WIP não commitado do usuário. Cada commit deve usar **`git add <caminho exato>`** apenas dos arquivos desta feature. NUNCA `git add -A`, `git add .` nem `git commit -a`. Após cada commit, confirmar que o WIP do usuário segue não commitado (`git status --short`).

---

## Task 1: Componente SakuraCorners (SVG estático) + fiação no MenuBento

Cria o componente com os dois ramos e flores **sem animação ainda** (estado final visível), e o pluga na section com o z-index correto. Assim dá para validar visualmente a geometria/posição antes de animar.

**Files:**
- Create: `app/(site)/_components/SakuraCorners.tsx`
- Modify: `app/(site)/_components/MenuBento.tsx`

- [ ] **Step 1: Criar `SakuraCorners.tsx` (versão estática)**

Create `app/(site)/_components/SakuraCorners.tsx`:

```tsx
"use client";

// Sakura decorativa nos cantos inferiores da section Cardápio.
// Versão estática (sem animação) — a animação entra na Task 2.

const CREAM = "#fbf3ec";

// Ângulos das 5 pétalas de cada flor (graus).
const PETAL_ANGLES = [0, 72, 144, 216, 288] as const;

// Posições das flores ao longo do galho, no sistema de coordenadas do viewBox
// (0 0 200 320). Origem do galho = canto inferior-esquerdo; sobe curvando pra dentro.
const BLOOMS = [
  { x: 26, y: 300, s: 1.0, r: -8 },
  { x: 30, y: 250, s: 0.82, r: 14 },
  { x: 42, y: 208, s: 1.1, r: -18 },
  { x: 60, y: 170, s: 0.78, r: 22 },
  { x: 82, y: 134, s: 1.0, r: -6 },
  { x: 104, y: 104, s: 0.72, r: 16 },
] as const;

function Blossom({ x, y, s, r }: { x: number; y: number; s: number; r: number }) {
  // Grupo externo (estático): posiciona, inclina e dimensiona a flor.
  // Grupo interno (.sakura-bloom): alvo da animação GSAP na Task 2.
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <g className="sakura-bloom">
        {PETAL_ANGLES.map((a) => (
          <path
            key={a}
            d="M0 0 C -4 -6 -4 -13 -1.6 -17 L 0 -14.5 L 1.6 -17 C 4 -13 4 -6 0 0 Z"
            transform={`rotate(${a})`}
            fill={CREAM}
          />
        ))}
        {PETAL_ANGLES.map((a) => (
          <circle
            key={`st-${a}`}
            cx="0"
            cy="-5.5"
            r="1"
            fill="var(--color-yellow)"
            transform={`rotate(${a})`}
          />
        ))}
        <circle cx="0" cy="0" r="2.6" fill="var(--color-salmon)" />
      </g>
    </g>
  );
}

function SakuraBranch() {
  return (
    <svg
      viewBox="0 0 200 320"
      className="absolute bottom-0 left-0 h-[35%] w-auto"
      fill="none"
      aria-hidden="true"
    >
      <path
        className="sakura-branch"
        d="M18 322 C 34 276 16 232 46 202 C 70 178 78 150 104 96"
        stroke="var(--color-brown)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        className="sakura-branch"
        d="M46 202 C 40 190 30 184 20 182"
        stroke="var(--color-brown)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {BLOOMS.map((b, i) => (
        <Blossom key={i} {...b} />
      ))}
    </svg>
  );
}

export default function SakuraCorners() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* canto inferior-esquerdo */}
      <SakuraBranch />
      {/* canto inferior-direito (espelhado) */}
      <div className="absolute inset-0 -scale-x-100">
        <SakuraBranch />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Plugar `<SakuraCorners />` no MenuBento e ajustar z-index**

Modify `app/(site)/_components/MenuBento.tsx`.

Adicionar o import junto aos outros imports do topo (após `import AddToCartButton from "./AddToCartButton";`):

```tsx
import SakuraCorners from "./SakuraCorners";
```

Na `<section ... aria-label="Destaques do cardápio">`, inserir `<SakuraCorners />` como **primeira filha**, imediatamente após a tag de abertura da section e antes do `<div className="mx-auto mb-14 max-w-6xl">`:

```tsx
      aria-label="Destaques do cardápio"
    >
      <SakuraCorners />

      <div className="mx-auto mb-14 max-w-6xl">
```

Adicionar `relative z-10` aos **dois** wrappers de conteúdo para que fiquem acima das flores:

- Header — de:
  ```tsx
      <div className="mx-auto mb-14 max-w-6xl">
  ```
  para:
  ```tsx
      <div className="relative z-10 mx-auto mb-14 max-w-6xl">
  ```

- Grid — de:
  ```tsx
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
  ```
  para:
  ```tsx
      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
  ```

- [ ] **Step 3: Verificar tipos e lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros de tipo; lint sem novos erros (avisos pré-existentes de canonização de classe no MenuBento são aceitáveis).

- [ ] **Step 4: Commit (apenas os arquivos da feature)**

```bash
git add "app/(site)/_components/SakuraCorners.tsx" "app/(site)/_components/MenuBento.tsx"
git commit -m "feat(cardapio): sakura estática nos cantos (SVG, sem animação)"
```

Depois: `git status --short` e confirmar que o WIP do usuário segue não commitado.

- [ ] **Step 5: PARAR para revisão do controlador**

Reportar que `tsc`/`lint` passaram. O controlador roda a verificação CDP: dois ramos de sakura visíveis nos cantos inferiores (esquerdo + direito espelhado), flores com pétala creme/miolo salmão/estames amarelos, cards do cardápio não cobertos e ainda clicáveis.

---

## Task 2: Animação de reveal (galho desenha + flores em stagger)

Adiciona GSAP + ScrollTrigger ao `SakuraCorners.tsx`: o galho se desenha via `stroke-dashoffset` e as flores desabrocham em stagger, com guarda de `prefers-reduced-motion`.

**Files:**
- Modify: `app/(site)/_components/SakuraCorners.tsx`

- [ ] **Step 1: Substituir `SakuraCorners.tsx` pela versão com animação**

Reescrever `app/(site)/_components/SakuraCorners.tsx` inteiro com o conteúdo abaixo (mantém `Blossom` e `SakuraBranch` idênticos à Task 1; muda só o componente default, que ganha `useGSAP`):

```tsx
"use client";

import { useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// Sakura decorativa nos cantos inferiores da section Cardápio, com reveal ao scroll.

gsap.registerPlugin(ScrollTrigger);

const CREAM = "#fbf3ec";

// Ângulos das 5 pétalas de cada flor (graus).
const PETAL_ANGLES = [0, 72, 144, 216, 288] as const;

// Posições das flores ao longo do galho, no sistema de coordenadas do viewBox
// (0 0 200 320). Origem do galho = canto inferior-esquerdo; sobe curvando pra dentro.
const BLOOMS = [
  { x: 26, y: 300, s: 1.0, r: -8 },
  { x: 30, y: 250, s: 0.82, r: 14 },
  { x: 42, y: 208, s: 1.1, r: -18 },
  { x: 60, y: 170, s: 0.78, r: 22 },
  { x: 82, y: 134, s: 1.0, r: -6 },
  { x: 104, y: 104, s: 0.72, r: 16 },
] as const;

function Blossom({ x, y, s, r }: { x: number; y: number; s: number; r: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <g className="sakura-bloom">
        {PETAL_ANGLES.map((a) => (
          <path
            key={a}
            d="M0 0 C -4 -6 -4 -13 -1.6 -17 L 0 -14.5 L 1.6 -17 C 4 -13 4 -6 0 0 Z"
            transform={`rotate(${a})`}
            fill={CREAM}
          />
        ))}
        {PETAL_ANGLES.map((a) => (
          <circle
            key={`st-${a}`}
            cx="0"
            cy="-5.5"
            r="1"
            fill="var(--color-yellow)"
            transform={`rotate(${a})`}
          />
        ))}
        <circle cx="0" cy="0" r="2.6" fill="var(--color-salmon)" />
      </g>
    </g>
  );
}

function SakuraBranch() {
  return (
    <svg
      viewBox="0 0 200 320"
      className="absolute bottom-0 left-0 h-[35%] w-auto"
      fill="none"
      aria-hidden="true"
    >
      <path
        className="sakura-branch"
        d="M18 322 C 34 276 16 232 46 202 C 70 178 78 150 104 96"
        stroke="var(--color-brown)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        className="sakura-branch"
        d="M46 202 C 40 190 30 184 20 182"
        stroke="var(--color-brown)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {BLOOMS.map((b, i) => (
        <Blossom key={i} {...b} />
      ))}
    </svg>
  );
}

export default function SakuraCorners() {
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

      // Prepara cada path do galho para o efeito de "desenhar" (stroke-dashoffset).
      const branches = gsap.utils.toArray<SVGPathElement>(
        ".sakura-branch",
        scope.current,
      );
      branches.forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: 0 });
      });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: scope.current, start: "top 70%", once: true },
      });

      // 1) galho cresce
      tl.from(".sakura-branch", {
        strokeDashoffset: (_i, el) => (el as SVGPathElement).getTotalLength(),
        duration: 0.8,
        ease: "power2.out",
      });

      // 2) flores desabrocham em stagger, começando enquanto o galho ainda desenha
      tl.from(
        ".sakura-bloom",
        {
          scale: 0,
          autoAlpha: 0,
          rotation: -30,
          transformOrigin: "center center",
          stagger: 0.12,
          duration: 0.5,
          ease: "back.out(1.7)",
        },
        "-=0.45",
      );
    },
    { scope, dependencies: [reduce] },
  );

  return (
    <div
      ref={scope}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* canto inferior-esquerdo */}
      <SakuraBranch />
      {/* canto inferior-direito (espelhado) */}
      <div className="absolute inset-0 -scale-x-100">
        <SakuraBranch />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos, lint e build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: sem erros de tipo; lint sem novos erros; build conclui com sucesso.

- [ ] **Step 3: Commit (apenas o arquivo da feature)**

```bash
git add "app/(site)/_components/SakuraCorners.tsx"
git commit -m "feat(cardapio): reveal animado da sakura (galho desenha + flores em stagger)"
```

Depois: `git status --short` e confirmar que o WIP do usuário segue não commitado.

- [ ] **Step 4: PARAR para revisão do controlador**

Reportar que `tsc`/`lint`/`build` passaram. O controlador roda a verificação CDP:
- screenshot no **meio** da animação (galho parcialmente desenhado, flores abrindo em sequência);
- screenshot no **estado final** (dois ramos completos, ~5–6 flores cada, espelhados);
- **mobile** (~390px): ramos proporcionais, sem estourar layout;
- **reduced-motion** (`--force-prefers-reduced-motion=reduce`): estado final visível, sem animação;
- cards seguem clicáveis (flores `pointer-events-none`).

---

## Self-Review (feito pelo autor do plano)

**Cobertura do spec:**
- Componente isolado `SakuraCorners.tsx` → Task 1. ✓
- Fiação no `MenuBento` + z-index (`relative z-10` nos wrappers, `<SakuraCorners/>` primeira filha) → Task 1. ✓
- Dois ramos espelhados, `pointer-events-none`, clip nas bordas (`overflow-hidden`) → Task 1. ✓
- Flor: 5 pétalas creme, miolo salmão (`--color-salmon`), estames amarelos (`--color-yellow`), galho marrom (`--color-brown`) → Task 1 (`Blossom`/`SakuraBranch`). ✓
- Alcance médio (~35% da altura, ~5–6 flores) → `h-[35%]` + 6 itens em `BLOOMS`. ✓
- Galho desenha via `stroke-dashoffset` com `getTotalLength()`, sem plugin pago → Task 2. ✓
- Flores em stagger com `back.out`, sobrepostas ao desenho do galho → Task 2. ✓
- ScrollTrigger `top 70%`, `once: true` → Task 2. ✓
- Guarda `prefers-reduced-motion` (estado natural do SVG = final visível) → Task 2. ✓
- Verificação tsc/lint/build + CDP (meio/final/mobile/reduced-motion/cliques) → passos de verificação das duas tasks. ✓

**Placeholder scan:** sem TBD/TODO; todo código está completo e explícito. ✓

**Consistência de tipos/nomes:** classes `.sakura-branch` e `.sakura-bloom` idênticas entre markup e seletores GSAP; `Blossom`/`SakuraBranch` inalterados entre as tasks; `BLOOMS`/`PETAL_ANGLES`/`CREAM` consistentes. ✓
