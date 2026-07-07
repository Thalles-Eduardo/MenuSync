# Pratos em destaque — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar a seção "Pratos em destaque" na home, abaixo do hero, em layout zig-zag alternado com reveal por scroll.

**Architecture:** Novo componente client `FeaturedDishes.tsx` recebe `dishes` como prop (mesmo padrão de `HeroShowcase`) e é montado em `page.tsx` após o hero. Reaproveita `_data/dishes.ts` e o componente `AddToCartButton`. Reveal com GSAP ScrollTrigger, degradando com `prefers-reduced-motion`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, GSAP + @gsap/react (ScrollTrigger).

**Verificação (este projeto não tem test runner):** cada task valida com `npm run lint`, `npx tsc --noEmit` e screenshot headless. Comando de screenshot de referência (dev server em `http://localhost:3000`):

```bash
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
"$CHROME" --headless=new --disable-gpu --no-first-run --no-default-browser-check \
  --user-data-dir="$TEMP/cudd" --force-prefers-reduced-motion --hide-scrollbars \
  --window-size=1440,2400 --virtual-time-budget=5000 \
  --screenshot="$TEMP/featured.png" "http://localhost:3000/"
```

(`--force-prefers-reduced-motion` faz o loader se auto-dispensar e mostra a seção estática; `--window-size` alto captura a página rolada.)

---

## File Structure

- Create: `app/(site)/_components/FeaturedDishes.tsx` — seção client com cabeçalho + linhas zig-zag + reveal.
- Modify: `app/(site)/page.tsx` — monta `<FeaturedDishes dishes={dishes} />` após o hero.
- Reuse (sem alteração): `app/(site)/_components/AddToCartButton.tsx`, `app/(site)/_data/dishes.ts`.

---

### Task 1: Layout estático da seção + integração na página

**Files:**
- Create: `app/(site)/_components/FeaturedDishes.tsx`
- Modify: `app/(site)/page.tsx`

- [ ] **Step 1: Criar `FeaturedDishes.tsx` (markup estático, com as classes/atributos que o reveal usará depois)**

```tsx
"use client";

import Image from "next/image";
import type { Dish } from "../_data/dishes";
import AddToCartButton from "./AddToCartButton";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function FeaturedDishes({ dishes }: { dishes: Dish[] }) {
  return (
    <section
      className="relative overflow-hidden px-8 py-24 text-white md:px-12 lg:py-32"
      style={{ backgroundColor: "var(--color-dark-blue)" }}
      aria-label="Pratos em destaque"
    >
      <div className="featured-head mx-auto mb-16 max-w-6xl">
        <p className="text-sm font-semibold tracking-[0.25em] text-yellow uppercase">Cardápio</p>
        <h2
          className="mt-2 text-4xl font-bold md:text-6xl"
          style={{ fontFamily: "var(--font-eczar), serif" }}
        >
          Pratos em destaque
        </h2>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-20 lg:gap-28">
        {dishes.map((dish, i) => {
          const imageRight = i % 2 === 1;
          return (
            <article
              key={dish.id}
              data-dir={imageRight ? "right" : "left"}
              className="featured-row grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14"
            >
              <div className={`flex justify-center ${imageRight ? "lg:order-2" : ""}`}>
                <Image
                  src={dish.plate}
                  alt={dish.name}
                  width={520}
                  height={520}
                  className="featured-img h-auto w-[70vw] max-w-[420px] rotate-[-4deg] drop-shadow-2xl"
                />
              </div>

              <div className={imageRight ? "lg:order-1" : ""}>
                <p className="featured-reveal text-sm font-semibold tracking-wide text-yellow">
                  {dish.tagline}
                </p>
                <h3
                  className="featured-reveal mt-2 text-4xl font-bold md:text-5xl"
                  style={{ fontFamily: "var(--font-eczar), serif" }}
                >
                  {dish.name}
                </h3>
                <p
                  className="featured-reveal mt-4 text-2xl font-medium"
                  style={{ fontFamily: "var(--font-eczar), serif" }}
                >
                  {brl.format(dish.price)}
                </p>
                <div className="featured-reveal mt-8">
                  <AddToCartButton />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Montar a seção em `page.tsx`**

Substituir o conteúdo de `app/(site)/page.tsx` por:

```tsx
import HeroShowcase from "./_components/HeroShowcase";
import FeaturedDishes from "./_components/FeaturedDishes";
import Loader from "./_components/Loader";
import { dishes } from "./_data/dishes";

export default function SiteHome() {
  return (
    <>
      <Loader />
      <HeroShowcase dishes={dishes} />
      <FeaturedDishes dishes={dishes} />
    </>
  );
}
```

- [ ] **Step 3: Lint + typecheck**

Run: `npm run lint && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Screenshot de verificação (dev server já rodando em :3000)**

Rodar o comando de screenshot de referência do cabeçalho do plano (window 1440x2400). Abrir a imagem e confirmar: cabeçalho "Cardápio / Pratos em destaque"; 4 linhas alternando lado (linha 1 imagem à esquerda, linha 2 à direita, etc.); botão "Adicionar" em cada linha; fundo escuro `--color-dark-blue`.

- [ ] **Step 5: Screenshot mobile**

Repetir com `--window-size=420,3200`. Confirmar empilhamento (imagem em cima, texto embaixo) em todas as linhas, sem barra horizontal.

- [ ] **Step 6: Commit**

```bash
git add "app/(site)/_components/FeaturedDishes.tsx" "app/(site)/page.tsx"
git commit -m "feat(home): seção Pratos em destaque (layout zig-zag)"
```

---

### Task 2: Reveal por scroll (GSAP ScrollTrigger) + degradação reduced-motion

**Files:**
- Modify: `app/(site)/_components/FeaturedDishes.tsx`

- [ ] **Step 1: Confirmar que ScrollTrigger existe no pacote gsap instalado**

Run: `node -e "require('gsap/ScrollTrigger'); console.log('ok')"`
Expected: imprime `ok`. Se falhar, usar o fallback IntersectionObserver descrito no Step 4-alt abaixo em vez do bloco GSAP.

- [ ] **Step 2: Adicionar imports, registro do plugin e refs/guarda no topo do componente**

Trocar a linha de imports de `FeaturedDishes.tsx` por:

```tsx
"use client";

import { useMemo, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Dish } from "../_data/dishes";
import AddToCartButton from "./AddToCartButton";

gsap.registerPlugin(ScrollTrigger);
```

E, logo após `export default function FeaturedDishes({ dishes }: { dishes: Dish[] }) {`, adicionar antes do `return`:

```tsx
  const scope = useRef<HTMLElement>(null);
  const reduce = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useGSAP(
    () => {
      if (reduce) return;

      gsap.from(".featured-head", {
        scrollTrigger: { trigger: ".featured-head", start: "top 85%", once: true },
        y: 24,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
      });

      gsap.utils.toArray<HTMLElement>(".featured-row").forEach((row) => {
        gsap.from(row.querySelector(".featured-img"), {
          scrollTrigger: { trigger: row, start: "top 80%", once: true },
          x: row.dataset.dir === "right" ? 60 : -60,
          opacity: 0,
          scale: 0.9,
          duration: 0.8,
          ease: "power3.out",
        });
        gsap.from(row.querySelectorAll(".featured-reveal"), {
          scrollTrigger: { trigger: row, start: "top 80%", once: true },
          y: 24,
          opacity: 0,
          stagger: 0.08,
          duration: 0.6,
          ease: "power3.out",
        });
      });
    },
    { scope }
  );
```

- [ ] **Step 3: Ligar o `scope` ref na `<section>`**

Na tag `<section ...>`, adicionar `ref={scope}` como primeiro atributo:

```tsx
    <section
      ref={scope}
      className="relative overflow-hidden px-8 py-24 text-white md:px-12 lg:py-32"
```

- [ ] **Step 4-alt (SOMENTE se o Step 1 falhar): fallback IntersectionObserver**

Se `gsap/ScrollTrigger` não existir, não usar o bloco `useGSAP` acima. Em vez disso, manter GSAP fora e revelar via classe CSS: adicionar `import { useEffect, useRef } from "react";`, um `useEffect` que cria um `IntersectionObserver` observando `.featured-row` e `.featured-head`, adicionando a classe `is-visible` quando `entry.isIntersecting`; e em `app/globals.css` adicionar:

```css
.featured-row .featured-img,
.featured-row .featured-reveal,
.featured-head { opacity: 0; transition: opacity .6s ease, transform .6s ease; transform: translateY(24px); }
.is-visible .featured-img,
.is-visible .featured-reveal,
.featured-head.is-visible { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  .featured-row .featured-img,
  .featured-row .featured-reveal,
  .featured-head { opacity: 1; transform: none; transition: none; }
}
```

(Nota: `globals.css` está com edições WIP do usuário — só anexar ao final, sem tocar no resto.)

- [ ] **Step 5: Lint + typecheck**

Run: `npm run lint && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 6: Screenshot com reduced-motion (layout deve continuar visível)**

Rodar o screenshot de referência (que usa `--force-prefers-reduced-motion`). Confirmar que a seção aparece totalmente visível (a guarda `if (reduce) return;` impede o estado inicial oculto). Isso valida que reduced-motion não deixa a seção em branco.

- [ ] **Step 7: Verificação ao vivo do reveal (manual)**

Abrir `http://localhost:3000/` sem reduced-motion, rolar até a seção e confirmar: cabeçalho e cada linha revelam ao entrar na viewport; imagem entra pelo seu lado (esquerda/direita conforme a paridade); texto sobe em stagger; botão "Adicionar" anima ao clicar em cada linha.

- [ ] **Step 8: Commit**

```bash
git add "app/(site)/_components/FeaturedDishes.tsx"
git commit -m "feat(home): reveal por scroll na seção Pratos em destaque (ScrollTrigger)"
```

---

## Self-Review

**Spec coverage:**
- Componente client + prop `dishes` → Task 1 Step 1. ✓
- Integração em `page.tsx` (home rolável) → Task 1 Step 2. ✓
- Reuso de `AddToCartButton` e `dishes.ts` → Task 1 Step 1. ✓
- Layout zig-zag alternado / empilhado mobile → Task 1 Steps 1, 4, 5. ✓
- Primeira linha imagem à esquerda (`imageRight = i % 2 === 1`, i=0 → esquerda) → Task 1 Step 1. ✓
- Cabeçalho (eyebrow "Cardápio" + título Eczar) → Task 1 Step 1. ✓
- Preço BRL com mesmo padrão do HeroText → Task 1 Step 1 (`brl`). ✓
- Fundo escuro `--color-dark-blue` + `overflow-hidden` → Task 1 Step 1. ✓
- Reveal ScrollTrigger → Task 2 Steps 2-3. ✓
- reduced-motion sem estado oculto → Task 2 Step 2 (`if (reduce) return;`) + Step 6. ✓
- Fallback IntersectionObserver → Task 2 Step 1 + 4-alt. ✓
- Verificação lint/tsc/screenshot → ambas as tasks. ✓

**Placeholder scan:** sem TBD/TODO; todo código está completo.

**Type consistency:** `Dish` importado de `../_data/dishes`; classes `.featured-head`, `.featured-row`, `.featured-img`, `.featured-reveal` e `data-dir` definidas no markup do Task 1 e consumidas pelo JS do Task 2 — consistentes.
