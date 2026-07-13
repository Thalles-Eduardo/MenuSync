# Roleta de seções — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a home de scroll vertical (Hero → Cardápio → Sobre) por um switcher de tela cheia controlado por uma roleta lateral, onde a seção atual desliza (tambor vertical) até a selecionada, reaproveitando o voo do prato como transição Hero↔Cardápio.

**Architecture:** Um shell `SectionStage` (client) detém `activeIndex` e `activeDishId`, empilha os 3 painéis (100vh cada) num track vertical dentro de um container `h-screen overflow-hidden`, e anima o `y` do track via GSAP ao trocar. A roleta (`SectionRoulette`) é apresentacional (desktop = tambor à direita; mobile = pills embaixo). Reveals das seções (sakura, sobre) passam a disparar ao ativar a seção, não mais por scroll.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, GSAP + @gsap/react (`useGSAP`).

---

## Convenções deste projeto (LER ANTES)

- **Sem framework de testes.** "Verificação" = `npx tsc --noEmit` + `npm run lint`
  (+ `npm run build` nas tasks finais) e checagem visual via CDP feita pelo
  controlador. Não existe `pytest`/jest; não invente testes.
- **NÃO rode git.** Subagents não executam nenhum comando git. O controlador
  cuida de commits (só docs). As mudanças ficam na working tree para revisão.
- **Preservar WIP:** nunca `git add -A`/`git commit -a`. (Vale pro controlador.)
- **Paleta (globals.css @theme):** `--color-brown #574c41`, `--color-salmon
  #e36b6b`, `--color-caramel #e3a56b`, `--color-yellow #e3c77b`,
  `--color-green #96875a`, `--color-dark-blue #2A2E37`. Fonte: `--font-eczar`.
- **Padrão de animação:** `useGSAP(() => {...}, { scope, dependencies })`, guarda
  `reduce = useMemo(() => typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches, [])`.
- Caminhos com `(site)` precisam de aspas no shell.

## File Structure

- **Create `app/(site)/_components/SectionRoulette.tsx`** — navegador
  apresentacional (tambor desktop + pills mobile). Sem estado próprio.
- **Create `app/(site)/_components/SectionStage.tsx`** — shell: estado
  (`activeIndex`, `activeDishId`), track dos 3 painéis, roleta, prato voador,
  slide GSAP, gating, reveals-on-activate.
- **Modify `app/(site)/_components/SakuraCorners.tsx`** — reveal por prop
  `active` em vez de `ScrollTrigger`.
- **Modify `app/(site)/_components/MenuBento.tsx`** — repassar `active` para
  `SakuraCorners`; garantir painel 100vh (já é `min-h-screen`).
- **Modify `app/(site)/_components/AboutSection.tsx`** — reveal por prop
  `active`; painel 100vh com scroll interno.
- **Modify `app/(site)/page.tsx`** — renderizar `Loader` + `SectionStage`.
- **`HomeExperience.tsx`** — fica no repo, mas deixa de ser usado pela page
  (não deletar: é WIP do usuário). Sua lógica de voo do prato é migrada (copiada)
  para o `SectionStage`.

Ordem das seções e ids (usada em todo o plano):
`0 = "inicio"` (Hero), `1 = "cardapio"` (MenuBento), `2 = "sobre"` (AboutSection).

---

## Task 1: `SectionRoulette` (navegador apresentacional)

**Files:**
- Create: `app/(site)/_components/SectionRoulette.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
"use client";

// Navegador de seções. Desktop: tambor vertical fixo na lateral direita.
// Mobile: barra inferior de pills. Apresentacional — não guarda estado.

export type RouletteItem = { id: string; label: string };

export default function SectionRoulette({
  items,
  activeIndex,
  onSelect,
}: {
  items: RouletteItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      onSelect(Math.min(items.length - 1, activeIndex + 1));
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      onSelect(Math.max(0, activeIndex - 1));
    }
  }

  return (
    <>
      {/* Desktop: tambor lateral direito */}
      <nav
        aria-label="Seções"
        onKeyDown={onKeyDown}
        className="pointer-events-auto fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-end gap-3 lg:flex"
      >
        {items.map((it, i) => {
          const active = i === activeIndex;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onSelect(i)}
              aria-current={active ? "true" : undefined}
              className={
                "group flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold tracking-wide backdrop-blur-sm transition-all duration-300 " +
                (active
                  ? "border-yellow/70 bg-yellow text-dark-blue scale-105"
                  : "border-white/20 bg-white/5 text-white/80 hover:border-yellow/50 hover:text-white")
              }
            >
              <span>{it.label}</span>
              <span
                aria-hidden="true"
                className={
                  "h-2 w-2 rounded-full transition " +
                  (active ? "bg-dark-blue" : "bg-yellow/70 group-hover:bg-yellow")
                }
              />
            </button>
          );
        })}
      </nav>

      {/* Mobile: pills embaixo */}
      <nav
        aria-label="Seções"
        className="pointer-events-auto fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2 border-t border-white/10 bg-dark-blue/80 px-4 py-3 backdrop-blur-sm lg:hidden"
      >
        {items.map((it, i) => {
          const active = i === activeIndex;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onSelect(i)}
              aria-current={active ? "true" : undefined}
              className={
                "rounded-full border px-4 py-2 text-sm font-semibold transition " +
                (active
                  ? "border-yellow/70 bg-yellow text-dark-blue"
                  : "border-white/20 bg-white/5 text-white/80")
              }
            >
              {it.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
```

- [ ] **Step 2: Verificar tipos e lint**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros; sem warnings novos de eslint.

---

## Task 2: Reveal-on-activate no `SakuraCorners` (+ prop em `MenuBento`)

Substitui o `ScrollTrigger` por um gatilho baseado em prop `active`, tocando o
reveal uma única vez quando o Cardápio fica ativo. Mantém a guarda de
reduced-motion (estado final visível sem animar).

**Files:**
- Modify: `app/(site)/_components/SakuraCorners.tsx`
- Modify: `app/(site)/_components/MenuBento.tsx`

- [ ] **Step 1: `SakuraCorners` recebe `active` e toca no activate**

Trocar a assinatura e o `useGSAP`. Remover o import/registro de `ScrollTrigger`.
Guardar um ref `played` para tocar só uma vez.

Assinatura nova:
```tsx
export default function SakuraCorners({ active }: { active: boolean }) {
```

Corpo do efeito (substitui o bloco `useGSAP` atual inteiro):
```tsx
const played = useRef(false);

useGSAP(
  () => {
    if (reduce || !active || played.current) return;
    played.current = true;

    const branches = gsap.utils.toArray<SVGPathElement>(
      ".sakura-branch",
      scope.current,
    );
    branches.forEach((p) => {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: len });
    });

    const tl = gsap.timeline();
    tl.from(".sakura-branch", {
      strokeDashoffset: (_i, el) => (el as SVGPathElement).getTotalLength(),
      duration: 0.8,
      ease: "power2.out",
    });
    tl.from(
      ".sakura-bloom",
      {
        scale: 0,
        autoAlpha: 0,
        rotation: -30,
        transformOrigin: "center center",
        stagger: 0.05,
        duration: 0.5,
        ease: "back.out(1.7)",
      },
      "-=0.45",
    );
  },
  { scope, dependencies: [reduce, active] },
);
```

Remover estas linhas do topo do arquivo (não usar mais ScrollTrigger):
```tsx
import { ScrollTrigger } from "gsap/ScrollTrigger";
// ...
gsap.registerPlugin(ScrollTrigger);
```
E remover o comentário sobre "bottom 90%".

> Importante: como o reveal usa `gsap.from`, o estado inicial (galho não
> desenhado, flores invisíveis) só é aplicado quando o efeito roda. Enquanto
> `active` for falso e `reduce` falso, as flores ficam **visíveis** (estado
> natural do SVG) — o que é aceitável, pois o painel Cardápio está fora de tela
> até ser ativado. O reveal aplica o "from" e anima ao ativar.

- [ ] **Step 2: `MenuBento` repassa `active` para `SakuraCorners`**

Assinatura nova de `MenuBento`:
```tsx
export default function MenuBento({
  activeDish,
  otherDishes,
  active = false,
}: {
  activeDish: Dish;
  otherDishes: Dish[];
  active?: boolean;
}) {
```

Trocar o uso do componente:
```tsx
<SakuraCorners active={active} />
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros.

---

## Task 3: Reveal-on-activate no `AboutSection` (+ painel 100vh com scroll interno)

**Files:**
- Modify: `app/(site)/_components/AboutSection.tsx`

- [ ] **Step 1: `AboutSection` recebe `active` e toca o reveal no activate**

Assinatura:
```tsx
export default function AboutSection({ active = false }: { active?: boolean }) {
```

Substituir o `useGSAP` atual (que usa `ScrollTrigger`) por:
```tsx
const played = useRef(false);
useGSAP(
  () => {
    if (reduce || !active || played.current) return;
    played.current = true;
    gsap.from(".about-reveal", {
      y: 28,
      opacity: 0,
      duration: 0.7,
      stagger: 0.12,
      ease: "power3.out",
    });
  },
  { scope, dependencies: [reduce, active] },
);
```

Adicionar `import { useRef } from "react";` se necessário (já importa
`useMemo, useRef`? conferir — hoje importa `useMemo, useRef`). Remover o import e
o `registerPlugin` de `ScrollTrigger` (não usados após a troca).

> Nota: `.about-reveal` some com `gsap.from` só quando o efeito roda. Como o
> painel Sobre está fora de tela até ativar, tudo bem exibir o estado final antes.

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros.

(O comportamento de painel 100vh + scroll interno é aplicado no `SectionStage`,
Task 4 — a `<section>` do About mantém sua altura natural e o wrapper do painel é
que recebe `h-screen overflow-y-auto`.)

---

## Task 4: `SectionStage` — empilhamento estático (troca instantânea)

Cria o shell com estado e layout, **sem** animação de slide/voo ainda: trocar de
seção apenas reposiciona o track instantaneamente. Liga reveals e a page.

**Files:**
- Create: `app/(site)/_components/SectionStage.tsx`
- Modify: `app/(site)/page.tsx`

- [ ] **Step 1: Criar `SectionStage` (versão estática)**

```tsx
"use client";

import { useMemo, useRef, useState } from "react";
import type { Dish } from "../_data/dishes";
import HeroShowcase from "./HeroShowcase";
import MenuBento from "./MenuBento";
import AboutSection from "./AboutSection";
import SectionRoulette, { type RouletteItem } from "./SectionRoulette";

const ITEMS: RouletteItem[] = [
  { id: "inicio", label: "Início" },
  { id: "cardapio", label: "Cardápio" },
  { id: "sobre", label: "Sobre" },
];

export default function SectionStage({ dishes }: { dishes: Dish[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeDishId, setActiveDishId] = useState(dishes[0]?.id ?? "");
  const activeDish = dishes.find((d) => d.id === activeDishId) ?? dishes[0];
  const otherDishes = dishes.filter((d) => d.id !== activeDish.id);

  const trackRef = useRef<HTMLDivElement>(null);

  // Versão estática: reposiciona o track sem animação.
  function goTo(index: number) {
    setActiveIndex(index);
  }

  const panelClass = "h-screen w-full shrink-0 overflow-hidden";

  return (
    <div className="stage-pin relative h-screen w-full overflow-hidden">
      <div
        ref={trackRef}
        className="flex h-full w-full flex-col"
        style={{ transform: `translateY(-${activeIndex * 100}vh)` }}
      >
        {/* Painel 0 — Início */}
        <div className={panelClass}>
          <HeroShowcase
            dishes={dishes}
            activeDishId={activeDish.id}
            onSelectDish={setActiveDishId}
          />
        </div>

        {/* Painel 1 — Cardápio */}
        <div className={panelClass}>
          <MenuBento
            activeDish={activeDish}
            otherDishes={otherDishes}
            active={activeIndex === 1}
          />
        </div>

        {/* Painel 2 — Sobre (rola internamente se exceder a viewport) */}
        <div className="h-screen w-full shrink-0 overflow-y-auto">
          <AboutSection active={activeIndex === 2} />
        </div>
      </div>

      <SectionRoulette
        items={ITEMS}
        activeIndex={activeIndex}
        onSelect={goTo}
      />
    </div>
  );
}
```

- [ ] **Step 2: Atualizar `page.tsx`**

```tsx
import SectionStage from "./_components/SectionStage";
import Loader from "./_components/Loader";
import { dishes } from "./_data/dishes";

export default function SiteHome() {
  return (
    <>
      <Loader />
      <SectionStage dishes={dishes} />
    </>
  );
}
```

- [ ] **Step 3: Verificar tipos/lint**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros.

- [ ] **Step 4: Verificação visual (controlador, CDP)**

Dev server em http://localhost:3000. Verificar em 1440×900:
- Só a Hero aparece no load (uma tela, sem scroll de página).
- Clicar "Cardápio" na roleta → aparece o Cardápio e a **sakura faz reveal**
  (galho desenha + flores) — não fica invisível.
- Clicar "Sobre" → aparece o Sobre; `.about-reveal` anima; se o conteúdo passa da
  tela, o painel **rola internamente**.
- Em 390×844: pills embaixo trocam as seções.

---

## Task 5: Slide animado do tambor (com gating)

Substitui a troca instantânea por deslize GSAP do track, com fallback instantâneo
para reduced-motion/touch/mobile.

**Files:**
- Modify: `app/(site)/_components/SectionStage.tsx`

- [ ] **Step 1: Gating + animação de slide**

Adicionar imports:
```tsx
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
```

Dentro do componente, calcular `enabled` (mesma heurística do HomeExperience) e
animar o track quando `activeIndex` muda:
```tsx
const enabled = useMemo(() => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    window.innerWidth >= 1024
  );
}, []);

useGSAP(
  () => {
    const track = trackRef.current;
    if (!track) return;
    const y = -activeIndex * window.innerHeight;
    if (!enabled) {
      gsap.set(track, { y });
      return;
    }
    gsap.to(track, { y, duration: 0.7, ease: "power3.inOut" });
  },
  { dependencies: [activeIndex, enabled] },
);
```

Remover o `style={{ transform: ... }}` do `trackRef` (agora o GSAP controla `y`).
O container do track fica:
```tsx
<div ref={trackRef} className="flex h-full w-full flex-col">
```

- [ ] **Step 2: Reposicionar no resize**

Adicionar um efeito que reaplica `y` quando a janela muda de tamanho (para o slide
usar a altura correta):
```tsx
useGSAP(
  () => {
    const onResize = () => {
      if (trackRef.current)
        gsap.set(trackRef.current, { y: -activeIndex * window.innerHeight });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  },
  { dependencies: [activeIndex] },
);
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit` e `npm run lint`; controlador via CDP confirma o
**deslize suave** entre seções (desktop) e troca instantânea em reduced-motion
(`--force-prefers-reduced-motion=reduce`).

---

## Task 6: Voo do prato na transição Início↔Cardápio

Migra a lógica do prato voador do `HomeExperience` para o `SectionStage`, agora
acionada pela transição entre os painéis 0 e 1 (não por scroll).

**Files:**
- Modify: `app/(site)/_components/SectionStage.tsx`

Referência de matemática das posições (track em coluna vertical, painéis de
`innerHeight`):
- Ao ir de 0→1 o track sobe `innerHeight`. O assento (`.bento-seat-img`), medido
  ANTES do slide (track em y=0), está em `seatRect.top ≈ innerHeight + offset`;
  ao final ele estará em `seatRect.top - innerHeight`. Logo, **destino Y do voo =
  `seatRect.top - innerHeight`**, destino X = `seatRect.left`.
- Ao ir de 1→0 (reverso) o track desce `innerHeight`. O prato do Hero
  (`.plate-img`), medido ANTES do slide (track em y=-innerHeight), está em
  `plateRect.top ≈ -innerHeight + offset`; ao final estará em
  `plateRect.top + innerHeight`. Origem = onde o prato do card está agora.

- [ ] **Step 1: Adicionar o elemento do prato voador**

Importar `Image from "next/image"` e renderizar, como irmão do track (dentro do
container raiz), um prato `fixed` oculto:
```tsx
<Image
  key={activeDish.id}
  src={activeDish.plate}
  alt=""
  aria-hidden="true"
  width={520}
  height={520}
  className="flying-plate pointer-events-none fixed left-0 top-0 z-[60] h-auto w-auto opacity-0 drop-shadow-2xl will-change-transform"
/>
```

- [ ] **Step 2: Timeline do voo, sincronizada com o slide**

Guardar o índice anterior para saber a direção:
```tsx
const prevIndex = useRef(activeIndex);
```

Trocar o efeito de slide (Task 5, Step 1) por uma versão que, quando a transição
é 0↔1 e `enabled`, roda o voo junto com o slide:
```tsx
useGSAP(
  () => {
    const track = trackRef.current;
    if (!track) return;
    const root = track.parentElement as HTMLElement;
    const from = prevIndex.current;
    const to = activeIndex;
    prevIndex.current = activeIndex;

    const y = -to * window.innerHeight;
    if (!enabled) {
      gsap.set(track, { y });
      return;
    }

    const slide = gsap.to(track, { y, duration: 0.7, ease: "power3.inOut" });

    const heroToBento = from === 0 && to === 1;
    const bentoToHero = from === 1 && to === 0;
    if (!heroToBento && !bentoToHero) return;

    const flyer = root.querySelector<HTMLElement>(".flying-plate");
    const heroPlate = root.querySelector<HTMLElement>(".plate-img");
    const seat = root.querySelector<HTMLElement>(".bento-seat-img");
    if (!flyer || !heroPlate || !seat) return;

    const vh = window.innerHeight;
    const r = (el: HTMLElement) => el.getBoundingClientRect();

    // Pontos de origem/destino em coordenadas de viewport, considerando o
    // deslocamento do track ao final do slide (ver bloco "Referência").
    let startRect: DOMRect, endTop: number, endLeft: number;
    if (heroToBento) {
      startRect = r(heroPlate);
      const s = r(seat);
      endTop = s.top - vh;
      endLeft = s.left;
    } else {
      startRect = r(seat);
      const p = r(heroPlate);
      endTop = p.top + vh;
      endLeft = p.left;
    }

    const tl = gsap.timeline();
    // esconde o prato "estático" da origem, mostra o flyer
    tl.set(flyer, {
      x: startRect.left,
      y: startRect.top,
      width: startRect.width,
      height: startRect.height,
      autoAlpha: 1,
    }, 0);
    tl.to(flyer, {
      x: endLeft,
      y: endTop,
      width: r(seat).width,
      height: r(seat).height,
      duration: 0.7,
      ease: "power3.inOut",
    }, 0);
    tl.to(flyer, { autoAlpha: 0, duration: 0.05 }, 0.68);

    // Sincroniza (mesma duração/ease do slide) — nada a fazer além de rodarem
    // juntas; `slide` já foi criada acima.
    void slide;
  },
  { dependencies: [activeIndex, enabled] },
);
```

> Nota de implementação (controlador ajusta no CDP se preciso): o prato do Hero
> (`.plate-img`) e o assento (`.bento-seat-img`) podem ter animações próprias de
> entrada/opacidade. Se aparecer "prato duplicado" durante o voo, esconder o
> `.plate-img`/`.bento-seat-img` durante a timeline e revelar no fim (como o
> `HomeExperience` faz com `autoAlpha`). Ver `HomeExperience.tsx` linhas ~78–105
> para o padrão de crossfade.

- [ ] **Step 3: Verificar (controlador, CDP)**

- Início→Cardápio: o prato **voa** da Hero e **pousa** no card grande; sem prato
  duplicado; ao final o prato do card fica visível.
- Cardápio→Início: o voo ocorre ao contrário.
- Outras trocas (Cardápio↔Sobre, Início→Sobre): só o deslize, sem voo.
- `npx tsc --noEmit` e `npm run lint` limpos.

---

## Task 7: Verificação final completa

**Files:** nenhuma edição nova (a menos que a verificação aponte ajustes).

- [ ] **Step 1: Build de produção**

Run: `npm run build`
Expected: build conclui sem erros de tipo/lint.

- [ ] **Step 2: Passada CDP completa (controlador)**

Desktop 1440×900:
- Load mostra só a Hero; sem scroll de página (a viewport não rola entre seções).
- Roleta troca entre as 3 seções com deslize; item ativo destacado com
  `aria-current`.
- Voo do prato em Início↔Cardápio.
- Reveal da sakura ao ativar Cardápio; reveal do Sobre ao ativar Sobre.
- Painel Sobre rola internamente quando excede a viewport.

Mobile 390×844:
- Pills embaixo; troca funciona; sem voo (gating), troca instantânea/sem quebra.

Reduced-motion (`--force-prefers-reduced-motion=reduce`):
- Troca instantânea; sakura e about em estado final visível; sem voo/deslize.

- [ ] **Step 3: Relatar ao usuário**

Resumo das mudanças + pontos que o usuário pediu para revisar ao final. Não
commitar código (apenas o usuário decide). Deixar `HomeExperience.tsx` no repo,
apenas sem uso pela page.

---

## Self-review (cobertura do spec)

- Modelo tela cheia / sem scroll → Task 4 (container `h-screen overflow-hidden`,
  page sem outras seções). ✔
- Seções Início/Cardápio/Sobre → Task 4 (`ITEMS`, 3 painéis). ✔
- Transição tambor vertical → Task 5 (slide GSAP do track). ✔
- Voo do prato reaproveitado (Início↔Cardápio) → Task 6. ✔
- Só clique / mobile pills → Task 1 (`SectionRoulette`). ✔
- A11y (botões, aria-current, teclado) → Task 1. ✔
- Reduced-motion instantâneo → Tasks 5/6 (gating). ✔
- Reveals on-activate (sakura, sobre) → Tasks 2/3, ligados no Stage (Task 4). ✔
- Sobre rola internamente → Task 4 (painel `overflow-y-auto`). ✔
- Fora de escopo (galeria, drag, deep-link) → não há tasks para eles. ✔
