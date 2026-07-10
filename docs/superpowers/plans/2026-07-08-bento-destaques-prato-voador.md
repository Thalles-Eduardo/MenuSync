# Bento "Destaques do cardápio" com prato voador — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar a seção "Destaques do cardápio" em bento grid, à qual se chega por uma coreografia de scroll (pin + scrub) onde o prato ativo do hero encolhe e viaja até a célula grande do bento enquanto os demais cards surgem.

**Architecture:** Um orquestrador client `HomeExperience` passa a ser dono do `activeDishId` (levantado do `HeroShowcase`, que vira controlado) e renderiza hero + `MenuBento`. Quando a animação está habilitada (desktop, ponteiro fino, sem reduced-motion), hero e bento viram **camadas de um palco pinado** e um `.flying-plate` de posição fixa é interpolado por ScrollTrigger da posição do prato do hero até o assento do card grande. Fora dessas condições, hero e bento são renderizados como seções empilhadas normais (mesmo componente, sem pin/voo).

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, GSAP + @gsap/react (ScrollTrigger).

**Verificação (este projeto não tem test runner):** cada task valida com `npm run lint`, `npx tsc --noEmit`, `npm run build` e screenshot. O hero é `min-h-screen`, então um screenshot de viewport simples não mostra o bento abaixo — use o **screenshot full-page via CDP** abaixo.

**Pré-requisito de verificação — criar o script de screenshot full-page (uma vez):**

Salvar em `scratchpad/shot.mjs` (fora do repo; use o diretório de scratchpad da sessão). O dev server deve estar em `http://localhost:3000`.

```js
// shot.mjs — full-page screenshot via CDP (Node 21+, global WebSocket)
import fs from "node:fs";
const [BROWSER_WS, URL, OUT] = process.argv.slice(2);
const ws = new WebSocket(BROWSER_WS);
let id = 1; const pending = new Map();
const call = (method, params = {}, session) => new Promise((res) => {
  const myId = id++; pending.set(myId, res);
  const msg = { id: myId, method, params }; if (session) msg.sessionId = session;
  ws.send(JSON.stringify(msg));
});
ws.onmessage = (ev) => { const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result || {}); pending.delete(m.id); } };
ws.onopen = async () => {
  const { targetId } = await call("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await call("Target.attachToTarget", { targetId, flatten: true });
  await call("Page.enable", {}, sessionId);
  await call("Page.navigate", { url: URL }, sessionId);
  await new Promise((r) => setTimeout(r, 4500));
  const { contentSize } = await call("Page.getLayoutMetrics", {}, sessionId);
  const width = Math.ceil(contentSize.width), height = Math.ceil(contentSize.height);
  const { data } = await call("Page.captureScreenshot",
    { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width, height, scale: 1 } }, sessionId);
  fs.writeFileSync(OUT, Buffer.from(data, "base64"));
  console.log("saved", OUT, width + "x" + height); ws.close(); process.exit(0);
};
ws.onerror = (e) => { console.error("ws error", e.message || e); process.exit(1); };
```

**Comando de screenshot full-page (dev server + Chrome com remote debugging):**

```bash
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
"$CHROME" --headless=new --disable-gpu --no-first-run --no-default-browser-check \
  --user-data-dir="$TEMP/cudd2" --force-prefers-reduced-motion --hide-scrollbars \
  --window-size=1440,900 --remote-debugging-port=9222 about:blank >/dev/null 2>&1 &
sleep 3
WS=$(curl -s http://localhost:9222/json/version | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).webSocketDebuggerUrl))")
node scratchpad/shot.mjs "$WS" "http://localhost:3000/" "$TEMP/verify.png"
# abrir $TEMP/verify.png. Mobile: repetir com --window-size=420,900.
# limpar: matar o chrome do porto 9222 ao final.
```

(`--force-prefers-reduced-motion` faz o Loader se auto-dispensar e força o caminho de fallback: hero seguido do bento em fluxo normal — valida o layout estático. O voo em si é verificado ao vivo.)

---

## File Structure

- Create: `app/(site)/_components/HomeExperience.tsx` — orquestrador client; dono de `activeDishId`; caminho fallback (empilhado) e caminho animado (palco pinado + flying-plate + ScrollTrigger).
- Create: `app/(site)/_components/MenuBento.tsx` — seção bento (cabeçalho + card grande + 3 cards + CTA).
- Modify: `app/(site)/_components/HeroShowcase.tsx` — vira controlado (recebe `activeDishId` + `onSelectDish`; remove o `useState` de `activeDishId`).
- Modify: `app/(site)/page.tsx` — renderiza `<HomeExperience dishes={dishes} />`.
- Reuse (sem alteração): `app/(site)/_components/AddToCartButton.tsx`, `app/(site)/_data/dishes.ts`.

---

## Task 1: Levantar `activeDishId` — HeroShowcase controlado + HomeExperience (só hero)

**Files:**
- Modify: `app/(site)/_components/HeroShowcase.tsx`
- Create: `app/(site)/_components/HomeExperience.tsx`
- Modify: `app/(site)/page.tsx`

- [ ] **Step 1: Tornar `HeroShowcase` controlado**

Em `app/(site)/_components/HeroShowcase.tsx`, trocar a assinatura e a origem de `activeDishId`.

Trocar:
```tsx
export default function HeroShowcase({ dishes }: { dishes: Dish[] }) {
  const [activeDishId, setActiveDishId] = useState(dishes[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<Tab>("reviews");

  const activeDish = dishes.find((d) => d.id === activeDishId) ?? dishes[0];

  function handleSelect(id: string) {
    setActiveDishId(id);
    setActiveTab("reviews");
  }
```
Por:
```tsx
export default function HeroShowcase({
  dishes,
  activeDishId,
  onSelectDish,
}: {
  dishes: Dish[];
  activeDishId: string;
  onSelectDish: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("reviews");

  const activeDish = dishes.find((d) => d.id === activeDishId) ?? dishes[0];

  function handleSelect(id: string) {
    onSelectDish(id);
    setActiveTab("reviews");
  }
```

(O `import { useState, ... } from "react"` continua necessário para `activeTab`; não removê-lo.)

- [ ] **Step 2: Criar `HomeExperience.tsx` (só o hero por enquanto)**

Criar `app/(site)/_components/HomeExperience.tsx`:
```tsx
"use client";

import { useState } from "react";
import type { Dish } from "../_data/dishes";
import HeroShowcase from "./HeroShowcase";

export default function HomeExperience({ dishes }: { dishes: Dish[] }) {
  const [activeDishId, setActiveDishId] = useState(dishes[0]?.id ?? "");
  const activeDish = dishes.find((d) => d.id === activeDishId) ?? dishes[0];

  return (
    <HeroShowcase
      dishes={dishes}
      activeDishId={activeDish.id}
      onSelectDish={setActiveDishId}
    />
  );
}
```

- [ ] **Step 3: Atualizar `page.tsx`**

Substituir o conteúdo de `app/(site)/page.tsx` por:
```tsx
import HomeExperience from "./_components/HomeExperience";
import Loader from "./_components/Loader";
import { dishes } from "./_data/dishes";

export default function SiteHome() {
  return (
    <>
      <Loader />
      <HomeExperience dishes={dishes} />
    </>
  );
}
```

- [ ] **Step 4: Lint + typecheck + build**

Run: `npm run lint && npx tsc --noEmit && npm run build`
Expected: sem erros; build "Compiled successfully".

- [ ] **Step 5: Screenshot de regressão do hero**

Com o dev server rodando, tirar o screenshot full-page (comando do cabeçalho). Confirmar que o hero está **idêntico** ao anterior (navbar + Teishoku + reviews + carrossel). Abrir `http://localhost:3000` e clicar nos pratos do carrossel para confirmar que a troca ainda funciona (agora via estado no `HomeExperience`).

- [ ] **Step 6: Commit**

```bash
git add "app/(site)/_components/HeroShowcase.tsx" "app/(site)/_components/HomeExperience.tsx" "app/(site)/page.tsx"
git commit -m "refactor(home): HeroShowcase controlado + HomeExperience owner do activeDishId"
```

---

## Task 2: `MenuBento` estático (layout) + render empilhado no HomeExperience

**Files:**
- Create: `app/(site)/_components/MenuBento.tsx`
- Modify: `app/(site)/_components/HomeExperience.tsx`

- [ ] **Step 1: Criar `MenuBento.tsx` (markup estático com as classes que o voo usará depois)**

Criar `app/(site)/_components/MenuBento.tsx`:
```tsx
"use client";

import Image from "next/image";
import type { Dish } from "../_data/dishes";
import AddToCartButton from "./AddToCartButton";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function DishCard({ dish }: { dish: Dish }) {
  return (
    <article className="bento-card group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition hover:bg-white/[0.07]">
      <div className="flex flex-1 items-center justify-center py-2">
        <Image
          src={dish.plate}
          alt={dish.name}
          width={220}
          height={220}
          className="h-auto w-[60%] max-w-[180px] drop-shadow-xl transition duration-500 group-hover:scale-105"
        />
      </div>
      <h3
        className="mt-2 text-xl font-bold md:text-2xl"
        style={{ fontFamily: "var(--font-eczar), serif" }}
      >
        {dish.name}
      </h3>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-lg font-medium" style={{ fontFamily: "var(--font-eczar), serif" }}>
          {brl.format(dish.price)}
        </span>
        <AddToCartButton />
      </div>
    </article>
  );
}

export default function MenuBento({
  activeDish,
  otherDishes,
}: {
  activeDish: Dish;
  otherDishes: Dish[];
}) {
  return (
    <section
      className="bento-section relative overflow-hidden px-8 py-24 text-white md:px-12 lg:py-28"
      style={{ backgroundColor: "var(--color-dark-blue)" }}
      aria-label="Destaques do cardápio"
    >
      <div className="mx-auto mb-14 max-w-6xl">
        <p className="text-sm font-semibold tracking-[0.25em] text-yellow uppercase">Cardápio</p>
        <h2
          className="mt-2 text-4xl font-bold md:text-6xl"
          style={{ fontFamily: "var(--font-eczar), serif" }}
        >
          Destaques do cardápio
        </h2>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
        {/* Card grande = prato ativo */}
        <article className="bento-big group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] p-8 backdrop-blur-sm sm:col-span-2 lg:col-span-2 lg:row-span-2">
          <div className="bento-plate-seat flex flex-1 items-center justify-center py-4">
            <Image
              src={activeDish.plate}
              alt={activeDish.name}
              width={520}
              height={520}
              priority
              className="bento-seat-img h-auto w-[70%] max-w-[360px] drop-shadow-2xl"
            />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-yellow">{activeDish.tagline}</p>
            <h3
              className="mt-1 text-4xl font-bold md:text-5xl"
              style={{ fontFamily: "var(--font-eczar), serif" }}
            >
              {activeDish.name}
            </h3>
            <div className="mt-4 flex items-center gap-6">
              <span className="text-2xl font-medium" style={{ fontFamily: "var(--font-eczar), serif" }}>
                {brl.format(activeDish.price)}
              </span>
              <AddToCartButton />
            </div>
          </div>
        </article>

        {/* Cards menores = outros pratos */}
        {otherDishes.slice(0, 3).map((dish) => (
          <DishCard key={dish.id} dish={dish} />
        ))}

        {/* Card CTA */}
        <a
          href="#"
          className="bento-cta group flex flex-col items-start justify-end rounded-2xl border border-yellow/30 bg-gradient-to-br from-salmon/20 to-transparent p-6 transition hover:border-yellow/60"
        >
          <span className="text-sm font-semibold tracking-wide text-yellow uppercase">Cardápio</span>
          <span
            className="mt-1 text-2xl font-bold leading-tight"
            style={{ fontFamily: "var(--font-eczar), serif" }}
          >
            Ver cardápio completo
          </span>
          <span className="mt-3 inline-flex items-center gap-1 text-white/80 transition group-hover:gap-2 group-hover:text-white">
            Explorar
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </a>
      </div>
    </section>
  );
}
```

Nota: se `text-yellow`/`text-salmon` não existirem como cores utilitárias no Tailwind v4 do projeto, `border-yellow/30`/`from-salmon/20` podem não compilar. Confirmar no Step 3 (build); se falharem, trocar por `border-white/20` e `from-white/10` (o build acusa classes inválidas apenas se forem `@apply`; classes utilitárias inexistentes simplesmente não geram estilo — então validar visualmente no screenshot).

- [ ] **Step 2: Renderizar `MenuBento` empilhado no `HomeExperience`**

Em `app/(site)/_components/HomeExperience.tsx`, adicionar o import e derivar `otherDishes`, renderizando hero + bento empilhados (o caminho animado entra na Task 3):
```tsx
"use client";

import { useState } from "react";
import type { Dish } from "../_data/dishes";
import HeroShowcase from "./HeroShowcase";
import MenuBento from "./MenuBento";

export default function HomeExperience({ dishes }: { dishes: Dish[] }) {
  const [activeDishId, setActiveDishId] = useState(dishes[0]?.id ?? "");
  const activeDish = dishes.find((d) => d.id === activeDishId) ?? dishes[0];
  const otherDishes = dishes.filter((d) => d.id !== activeDish.id);

  return (
    <>
      <HeroShowcase
        dishes={dishes}
        activeDishId={activeDish.id}
        onSelectDish={setActiveDishId}
      />
      <MenuBento activeDish={activeDish} otherDishes={otherDishes} />
    </>
  );
}
```

- [ ] **Step 3: Lint + typecheck + build**

Run: `npm run lint && npx tsc --noEmit && npm run build`
Expected: sem erros.

- [ ] **Step 4: Screenshot full-page desktop**

Comando do cabeçalho (`--window-size=1440,900`). Confirmar: abaixo do hero, o cabeçalho "Cardápio / Destaques do cardápio"; card grande à esquerda (prato ativo Teishoku, com preço + Adicionar); 3 cards menores (Sopa de Missô, Sushi 10 P/c, Okonomiyaki); card CTA "Ver cardápio completo". Fundo `--color-dark-blue`.

- [ ] **Step 5: Screenshot full-page mobile**

Repetir com `--window-size=420,900`. Confirmar empilhamento (card grande no topo, cards, CTA) sem barra horizontal.

- [ ] **Step 6: Commit**

```bash
git add "app/(site)/_components/MenuBento.tsx" "app/(site)/_components/HomeExperience.tsx"
git commit -m "feat(home): seção Destaques do cardápio (bento grid estático)"
```

---

## Task 3: Coreografia — palco pinado + prato voador (ScrollTrigger) + fallback

**Files:**
- Modify: `app/(site)/_components/HomeExperience.tsx`

- [ ] **Step 1: Confirmar ScrollTrigger no pacote gsap**

Run: `node -e "require('gsap/ScrollTrigger'); console.log('ok')"`
Expected: imprime `ok`.

- [ ] **Step 2: Reescrever `HomeExperience.tsx` com fallback + caminho animado**

Substituir todo o conteúdo de `app/(site)/_components/HomeExperience.tsx` por:
```tsx
"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Dish } from "../_data/dishes";
import HeroShowcase from "./HeroShowcase";
import MenuBento from "./MenuBento";

gsap.registerPlugin(ScrollTrigger);

const noopSubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export default function HomeExperience({ dishes }: { dishes: Dish[] }) {
  const [activeDishId, setActiveDishId] = useState(dishes[0]?.id ?? "");
  const activeDish = dishes.find((d) => d.id === activeDishId) ?? dishes[0];
  const otherDishes = dishes.filter((d) => d.id !== activeDish.id);

  const hydrated = useHydrated();
  const enabled = useMemo(() => {
    if (!hydrated || typeof window === "undefined") return false;
    return (
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      window.innerWidth >= 1024
    );
  }, [hydrated]);

  const stageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!enabled) return;
      const stage = stageRef.current;
      if (!stage) return;

      const pinWrap = stage.querySelector<HTMLElement>(".stage-pin");
      const heroLayer = stage.querySelector<HTMLElement>(".hero-layer");
      const bentoLayer = stage.querySelector<HTMLElement>(".bento-layer");
      const flyer = stage.querySelector<HTMLElement>(".flying-plate");
      const heroPlate = stage.querySelector<HTMLElement>(".plate-img");
      const seat = stage.querySelector<HTMLElement>(".bento-plate-seat");
      const seatImg = stage.querySelector<HTMLElement>(".bento-seat-img");
      if (!pinWrap || !heroLayer || !bentoLayer || !flyer || !heroPlate || !seat || !seatImg) return;

      // posiciona o flying-plate por cima de um alvo (rect medido em runtime)
      const placeAt = (target: HTMLElement) => {
        const r = target.getBoundingClientRect();
        return { x: r.left, y: r.top, width: r.width, height: r.height };
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          pin: pinWrap,
          pinSpacing: true,
          invalidateOnRefresh: true,
        },
      });

      // estado inicial do flyer = rect do prato do hero
      tl.set(flyer, { autoAlpha: 1 });
      tl.set(seatImg, { autoAlpha: 0 }, 0);
      tl.fromTo(
        flyer,
        {
          x: () => placeAt(heroPlate).x,
          y: () => placeAt(heroPlate).y,
          width: () => placeAt(heroPlate).width,
          height: () => placeAt(heroPlate).height,
          rotation: 0,
        },
        {
          x: () => placeAt(seat).x + (placeAt(seat).width - placeAt(seatImg).width) / 2,
          y: () => placeAt(seat).y + (placeAt(seat).height - placeAt(seatImg).height) / 2,
          width: () => placeAt(seatImg).width,
          height: () => placeAt(seatImg).height,
          rotation: 0,
          ease: "none",
        },
        0,
      );

      // hero some, bento aparece
      tl.to(heroLayer, { autoAlpha: 0, ease: "none" }, 0);
      tl.fromTo(bentoLayer, { autoAlpha: 0 }, { autoAlpha: 1, ease: "none" }, 0.15);

      // cards surgem em stagger
      tl.from(
        stage.querySelectorAll(".bento-card, .bento-cta"),
        { autoAlpha: 0, y: 30, stagger: 0.06, ease: "power2.out" },
        0.45,
      );

      // no fim, revela o prato pousado e esconde o flyer
      tl.set(seatImg, { autoAlpha: 1 }, 0.92);
      tl.set(flyer, { autoAlpha: 0 }, 0.93);

      // recomputar posições quando trocar de prato ou redimensionar
      ScrollTrigger.refresh();
    },
    { scope: stageRef, dependencies: [enabled, activeDishId] },
  );

  // Fallback: hero e bento empilhados, sem pin/voo
  if (!enabled) {
    return (
      <>
        <HeroShowcase dishes={dishes} activeDishId={activeDish.id} onSelectDish={setActiveDishId} />
        <MenuBento activeDish={activeDish} otherDishes={otherDishes} />
      </>
    );
  }

  // Caminho animado: palco pinado com camadas + flying-plate
  return (
    <div ref={stageRef} className="relative w-full overflow-x-hidden" style={{ height: "220vh" }}>
      <div className="stage-pin relative h-screen w-full overflow-hidden">
        <div className="hero-layer absolute inset-0">
          <HeroShowcase dishes={dishes} activeDishId={activeDish.id} onSelectDish={setActiveDishId} />
        </div>

        <div className="bento-layer absolute inset-0 overflow-hidden opacity-0">
          <MenuBento activeDish={activeDish} otherDishes={otherDishes} />
        </div>

        <Image
          key={activeDish.id}
          src={activeDish.plate}
          alt=""
          aria-hidden="true"
          width={520}
          height={520}
          className="flying-plate pointer-events-none fixed left-0 top-0 z-[60] h-auto w-auto opacity-0 drop-shadow-2xl will-change-transform"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Desligar o parallax de cursor do prato durante o voo**

O `HeroShowcase` aplica parallax via `quickTo` em `.plate-img` (só quando `pointer: fine`). No caminho animado o prato do hero fica sob o flyer, mas o parallax ainda moveria o `.plate-img` e desalinharia a medição inicial. Em `app/(site)/_components/HeroShowcase.tsx`, no `useGSAP` do parallax (o que adiciona `pointermove`/`pointerleave`), adicionar uma guarda: só ativar o parallax quando o hero **não** estiver dentro de um palco animado. Detectar via `closest`:

No início do callback do parallax (logo após `const el = scope.current; if (!el || !window.matchMedia("(pointer: fine)").matches) return;`), acrescentar:
```tsx
      // Dentro do palco animado (HomeExperience), o prato é controlado pelo scroll; sem parallax.
      if (el.closest(".stage-pin")) return;
```

- [ ] **Step 4: Lint + typecheck + build**

Run: `npm run lint && npx tsc --noEmit && npm run build`
Expected: sem erros. (Atenção a `react-hooks/exhaustive-deps` no `useGSAP`: as deps `[enabled, activeDishId]` estão declaradas; `dishes` é estável.)

- [ ] **Step 5: Screenshot de fallback (reduced-motion) — layout deve continuar completo**

Rodar o screenshot full-page (usa `--force-prefers-reduced-motion` → `enabled=false` → caminho empilhado). Confirmar hero + bento visíveis e completos (nada oculto). Isso garante que a degradação não deixa a página quebrada.

- [ ] **Step 6: Verificação AO VIVO do voo (manual, sem reduced-motion, viewport ≥ 1024)**

Abrir `http://localhost:3000/` num navegador real (desktop). Rolar a partir do hero e confirmar:
- o hero "trava" (pin) e some gradualmente;
- o `.flying-plate` parte da posição do prato do hero, **encolhe e viaja** até o assento do card grande do bento;
- os cards menores + CTA surgem em stagger;
- ao final, o prato aparece "pousado" no card grande e o flyer some (sem duplicidade);
- ao terminar o pin, a página continua no fluxo normal.
Trocar o prato no carrossel (no topo, antes de rolar) e confirmar que o bento e o prato que voa refletem o novo prato ativo. Redimensionar a janela e confirmar que o voo continua alinhado (graças a `invalidateOnRefresh`).

- [ ] **Step 7: Ajuste fino (iterativo)**

Se o voo começar desalinhado ou a curva de tempo parecer abrupta, ajustar: os offsets de `placeAt` (centralização no assento), os pontos de tempo do timeline (`0`, `0.15`, `0.45`, `0.92`), a altura do palco (`220vh` → mais alto = voo mais lento), e o `z-index` do flyer. Repetir Steps 4–6 até ficar fluido.

- [ ] **Step 8: Commit**

```bash
git add "app/(site)/_components/HomeExperience.tsx" "app/(site)/_components/HeroShowcase.tsx"
git commit -m "feat(home): prato voador do hero para o bento (pin + scrub ScrollTrigger)"
```

---

## Self-Review

**Spec coverage:**
- Orquestrador `HomeExperience` dono do `activeDishId` → Task 1 Step 2, Task 3 Step 2. ✓
- `HeroShowcase` controlado (activeDishId + onSelectDish) → Task 1 Step 1. ✓
- Nova seção `MenuBento` (bento) → Task 2 Step 1. ✓
- Reuso de `AddToCartButton` e `dishes.ts` → Task 2 Step 1. ✓
- Card grande = prato ativo (assento `.bento-plate-seat` + `.bento-seat-img`) + nome/preço/tagline/botão → Task 2 Step 1. ✓
- Cards menores (outros 3) imagem+nome+preço+botão → Task 2 Step 1 (`DishCard`). ✓
- Card CTA "Ver cardápio completo" → `#` placeholder → Task 2 Step 1. ✓
- Layout bento desktop (grande 2×2 + cards + CTA) / mobile empilhado → Task 2 Steps 1, 4, 5. ✓
- Prato voador `.flying-plate` fixo, medindo rects dos nós reais, `invalidateOnRefresh` → Task 3 Step 2. ✓
- Pin + scrub, hero some / bento aparece / cards em stagger / revela prato pousado e esconde flyer → Task 3 Step 2. ✓
- Desligar parallax de cursor durante o voo → Task 3 Step 3. ✓
- Fallback (reduced-motion / touch / <1024 / SSR) empilhado, nada oculto, hidratação segura (`useSyncExternalStore`) → Task 3 Step 2 (`enabled`, ramo `if (!enabled)`). ✓
- `overflow-x` contido → Task 3 Step 2 (`overflow-x-hidden` no palco). ✓
- Bento reage à troca de prato (deps `[enabled, activeDishId]` + `key` no flyer + derivação `activeDish`/`otherDishes`) → Task 3 Step 2. ✓
- Verificação lint/tsc/build/screenshot + ao vivo → todas as tasks. ✓

**Placeholder scan:** sem TBD/TODO; todo código está completo. O CTA `href="#"` é placeholder intencional documentado no spec §9.

**Type consistency:** `HeroShowcase` props `{ dishes, activeDishId, onSelectDish }` idênticas em Task 1 (definição), Task 2 e Task 3 (uso). `MenuBento` props `{ activeDish: Dish; otherDishes: Dish[] }` idênticas em Task 2 (definição) e Task 3 (uso). Classes/seletores usados pelo JS do Task 3 — `.stage-pin`, `.hero-layer`, `.bento-layer`, `.flying-plate`, `.plate-img` (já existe no `DishPlate`), `.bento-plate-seat`, `.bento-seat-img`, `.bento-card`, `.bento-cta` — todas definidas no markup dos Tasks 2 e 3. `useSyncExternalStore`/`useHydrated` seguem o padrão de `AtmosphereLayer`/`PlayVideoButton`.

**Riscos conhecidos (do spec §9):** medição do rect do prato do hero com parallax desligado (resolvido no Task 3 Step 3); refactor do hero para controlado (regressão coberta pelo Task 1 Step 5); bento-layer precisa caber em `h-screen` no caminho animado (ajuste fino no Task 3 Step 7 — se estourar, reduzir paddings/tamanhos das imagens do bento).
