# Página `/cardapio` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a página `/cardapio` (menu completo, só front) aberta pelo botão "Explore" da section Cardápio, na paleta e nos padrões do projeto.

**Architecture:** Rota `app/(site)/cardapio/page.tsx` (server) renderiza `CardapioClient` (client, estado de categoria + filtro + animação GSAP). Dados em `app/(site)/_data/menu.ts`. Sub-componentes `MenuHeader` e `MenuItemCard`. O CTA "Explore" da `MenuBento` passa a apontar para `/cardapio`.

**Tech Stack:** Next.js 16 (App Router, grupo de rotas `(site)`), React 19, TypeScript, Tailwind v4, GSAP + `@gsap/react`, `next/image`, `next/link`.

**Verificação (sem framework de testes):** o projeto não tem testes unitários — a verificação de cada task é `npx tsc --noEmit` (sem erros) e a verificação final é `npm run lint` + `npm run build` + CDP visual (headless Chrome). Siga esse padrão; não introduza um framework de testes novo.

**Paleta:** `--color-salmon #e36b6b` · `--color-caramel #e3a56b` · `--color-yellow #e3c77b` · `--color-green #96875a` · `--color-dark-blue #2A2E37` · fonte `--font-eczar`.

---

## File Structure

- **Create** `app/(site)/_data/menu.ts` — tipos `MenuCategory`/`MenuItem`, `CATEGORIES`, `menu` (~22 itens).
- **Create** `app/(site)/cardapio/page.tsx` — server component + metadata; renderiza `CardapioClient`.
- **Create** `app/(site)/cardapio/_components/CardapioClient.tsx` — client: estado de categoria, layout, filtro, animação.
- **Create** `app/(site)/cardapio/_components/MenuHeader.tsx` — logo + link voltar.
- **Create** `app/(site)/cardapio/_components/MenuItemCard.tsx` — card do item (imagem, nome, descrição, peso, preço, desconto, add-to-cart).
- **Modify** `app/(site)/_components/AddToCartButton.tsx` — prop opcional `compact`.
- **Modify** `app/(site)/_components/MenuBento.tsx` — CTA "Explore" → `<Link href="/cardapio">`.

Notas de caminho relativo (a partir de `app/(site)/cardapio/_components/`):
- dados: `../../_data/menu`
- componentes compartilhados: `../../_components/AddToCartButton`, `../../_components/SakuraCorners`
- irmãos: `./MenuHeader`, `./MenuItemCard`

---

### Task 1: Dados do menu (`menu.ts`)

**Files:**
- Create: `app/(site)/_data/menu.ts`

- [ ] **Step 1: Criar o arquivo de dados com tipos + itens**

Crie `app/(site)/_data/menu.ts` com exatamente:

```ts
export type MenuCategory =
  | "sushi"
  | "rolls"
  | "entradas"
  | "quentes"
  | "sobremesas"
  | "bebidas";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  weight: string;
  price: number; // preço original em BRL (se houver desconto, é o "de")
  category: MenuCategory;
  image: string; // reusa imagens existentes em /public
  discount?: number; // porcentagem (ex.: 15) → badge "-15%" + preço riscado
};

export const CATEGORIES: { id: MenuCategory; label: string }[] = [
  { id: "sushi", label: "Sushi" },
  { id: "rolls", label: "Rolls & Temaki" },
  { id: "entradas", label: "Sopas & Entradas" },
  { id: "quentes", label: "Pratos Quentes" },
  { id: "sobremesas", label: "Sobremesas" },
  { id: "bebidas", label: "Bebidas" },
];

export const menu: MenuItem[] = [
  // Sushi
  {
    id: "sushi-10",
    name: "Sushi 10 P/c",
    description: "Seleção do sushiman com salmão, atum e camarão sobre arroz shari.",
    weight: "10 un.",
    price: 89.9,
    category: "sushi",
    image: "/plate4.png",
  },
  {
    id: "niguiri-salmao",
    name: "Niguiri de Salmão",
    description: "Fatia de salmão fresco sobre bolinho de arroz temperado.",
    weight: "6 un.",
    price: 42.9,
    category: "sushi",
    image: "/plate1.webp",
  },
  {
    id: "sashimi-misto",
    name: "Sashimi Misto",
    description: "Cortes de salmão, atum e peixe branco selecionados do dia.",
    weight: "12 un.",
    price: 78.9,
    category: "sushi",
    image: "/food4.webp",
    discount: 15,
  },
  {
    id: "combinado-sakura",
    name: "Combinado Sakura",
    description: "20 peças variadas entre niguiris, uramaki e sashimi.",
    weight: "20 un.",
    price: 129.9,
    category: "sushi",
    image: "/plate3.png",
  },
  // Rolls & Temaki
  {
    id: "uramaki-filadelfia",
    name: "Uramaki Filadélfia",
    description: "Salmão, cream cheese e cebolinha, gergelim por fora.",
    weight: "8 un.",
    price: 38.9,
    category: "rolls",
    image: "/food1.webp",
  },
  {
    id: "hot-roll",
    name: "Hot Roll Especial",
    description: "Uramaki empanado e frito, finalizado com molho tarê.",
    weight: "8 un.",
    price: 44.9,
    category: "rolls",
    image: "/food2.webp",
  },
  {
    id: "temaki-salmao",
    name: "Temaki de Salmão",
    description: "Cone de alga recheado com salmão, arroz e cream cheese.",
    weight: "1 un.",
    price: 32.9,
    category: "rolls",
    image: "/plate2.png",
    discount: 10,
  },
  {
    id: "uramaki-skin",
    name: "Uramaki Skin",
    description: "Pele de salmão crocante, cream cheese e cebolinha.",
    weight: "8 un.",
    price: 34.9,
    category: "rolls",
    image: "/food3.webp",
  },
  // Sopas & Entradas
  {
    id: "sopa-misso",
    name: "Sopa de Missô",
    description: "Caldo tradicional com tofu, alga wakame e cebolinha.",
    weight: "300 ml",
    price: 24.9,
    category: "entradas",
    image: "/plate3.png",
  },
  {
    id: "gyoza",
    name: "Gyoza",
    description: "Pastéis japoneses de porco e legumes grelhados na chapa.",
    weight: "6 un.",
    price: 29.9,
    category: "entradas",
    image: "/food2.webp",
  },
  {
    id: "sunomono",
    name: "Sunomono",
    description: "Salada agridoce de pepino com gergelim e kani.",
    weight: "200 g",
    price: 22.9,
    category: "entradas",
    image: "/plate1.webp",
  },
  {
    id: "edamame",
    name: "Edamame",
    description: "Vagens de soja no vapor com flor de sal.",
    weight: "150 g",
    price: 19.9,
    category: "entradas",
    image: "/food4.webp",
  },
  // Pratos Quentes
  {
    id: "teishoku",
    name: "Teishoku Japonês",
    description: "Combinado completo com salmão, teriyaki e tempurá.",
    weight: "1 porção",
    price: 149.99,
    category: "quentes",
    image: "/plate1.webp",
  },
  {
    id: "okonomiyaki",
    name: "Okonomiyaki",
    description: "A 'pizza japonesa' com repolho, molho e katsuobushi.",
    weight: "1 un.",
    price: 54.9,
    category: "quentes",
    image: "/plate2.png",
  },
  {
    id: "yakisoba",
    name: "Yakisoba de Frango",
    description: "Macarrão salteado com frango, legumes e molho shoyu.",
    weight: "400 g",
    price: 46.9,
    category: "quentes",
    image: "/food1.webp",
    discount: 15,
  },
  {
    id: "tempura-camarao",
    name: "Tempurá de Camarão",
    description: "Camarões empanados na massa leve e crocante.",
    weight: "8 un.",
    price: 58.9,
    category: "quentes",
    image: "/plate4.png",
  },
  // Sobremesas
  {
    id: "mochi",
    name: "Mochi (3 un.)",
    description: "Bolinhos de arroz gelados recheados de sorvete.",
    weight: "3 un.",
    price: 26.9,
    category: "sobremesas",
    image: "/food3.webp",
  },
  {
    id: "harumaki-banana",
    name: "Harumaki de Banana",
    description: "Rolinho crocante de banana com canela e açúcar.",
    weight: "4 un.",
    price: 22.9,
    category: "sobremesas",
    image: "/plate2.png",
  },
  {
    id: "dorayaki",
    name: "Dorayaki",
    description: "Panqueca japonesa recheada com doce de feijão azuki.",
    weight: "1 un.",
    price: 18.9,
    category: "sobremesas",
    image: "/food4.webp",
  },
  // Bebidas
  {
    id: "cha-verde",
    name: "Chá Verde Gelado",
    description: "Chá verde gelado levemente adoçado, jarra individual.",
    weight: "500 ml",
    price: 14.9,
    category: "bebidas",
    image: "/food1.webp",
  },
  {
    id: "ramune",
    name: "Ramune",
    description: "Refrigerante japonês clássico de garrafa de gude.",
    weight: "200 ml",
    price: 16.9,
    category: "bebidas",
    image: "/plate3.png",
  },
  {
    id: "sake-quente",
    name: "Saquê Quente",
    description: "Saquê tradicional servido morno, dose individual.",
    weight: "180 ml",
    price: 28.9,
    category: "bebidas",
    image: "/plate4.png",
    discount: 10,
  },
];
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/_data/menu.ts"
git commit -m "feat(cardapio): dataset do menu completo (menu.ts)"
```

---

### Task 2: Prop `compact` no `AddToCartButton`

**Files:**
- Modify: `app/(site)/_components/AddToCartButton.tsx`

Contexto: o botão hoje é `h-[52px] min-w-[170px] px-5`. Nos cards do menu isso fica grande. Adicionar uma prop opcional `compact` que **só** muda tamanho/label — sem tocar na animação (que usa as classes `atc-*`).

- [ ] **Step 1: Assinatura da função com prop**

Em `app/(site)/_components/AddToCartButton.tsx`, troque:

```tsx
export default function AddToCartButton() {
```

por:

```tsx
export default function AddToCartButton({ compact = false }: { compact?: boolean }) {
```

- [ ] **Step 2: Aplicar tamanho condicional no `className` do `<button>`**

Troque o bloco do `<button>` (o `className` que começa com `"relative cursor-pointer ..."`):

```tsx
      className="relative cursor-pointer inline-flex h-[52px] min-w-[170px] items-center justify-center overflow-hidden rounded-md bg-salmon px-5 font-semibold text-white transition hover:brightness-110"
```

por:

```tsx
      className={`relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-md bg-salmon font-semibold text-white transition hover:brightness-110 ${
        compact ? "h-11 min-w-[132px] px-4 text-sm" : "h-[52px] min-w-[170px] px-5"
      }`}
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros (chamadas existentes `<AddToCartButton />` continuam válidas pois `compact` é opcional).

- [ ] **Step 4: Commit**

```bash
git add "app/(site)/_components/AddToCartButton.tsx"
git commit -m "feat(cardapio): prop compact opcional no AddToCartButton"
```

---

### Task 3: `MenuItemCard`

**Files:**
- Create: `app/(site)/cardapio/_components/MenuItemCard.tsx`

- [ ] **Step 1: Criar o card**

Crie `app/(site)/cardapio/_components/MenuItemCard.tsx` com:

```tsx
import Image from "next/image";
import type { MenuItem } from "../../_data/menu";
import AddToCartButton from "../../_components/AddToCartButton";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function MenuItemCard({ item }: { item: MenuItem }) {
  const hasDiscount = typeof item.discount === "number" && item.discount > 0;
  const finalPrice = hasDiscount
    ? item.price * (1 - item.discount! / 100)
    : item.price;

  return (
    <article className="menu-card group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm transition hover:bg-white/[0.07]">
      {hasDiscount && (
        <span className="absolute top-3 right-3 z-10 rounded-full bg-salmon px-2 py-1 text-xs font-bold text-white">
          -{item.discount}%
        </span>
      )}

      <div className="flex items-center justify-center py-2">
        <Image
          src={item.image}
          alt={item.name}
          width={220}
          height={220}
          className="h-28 w-auto max-w-[60%] object-contain drop-shadow-xl transition duration-500 group-hover:scale-105"
        />
      </div>

      <h3
        className="mt-3 text-lg font-bold"
        style={{ fontFamily: "var(--font-eczar), serif" }}
      >
        {item.name}
      </h3>
      <p className="mt-1 flex-1 text-sm text-white/70">{item.description}</p>
      <p className="mt-2 text-xs text-white/50">{item.weight}</p>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span
          className="flex flex-col leading-tight"
          style={{ fontFamily: "var(--font-eczar), serif" }}
        >
          {hasDiscount && (
            <span className="text-xs text-white/50 line-through">
              {brl.format(item.price)}
            </span>
          )}
          <span className="text-lg font-medium">{brl.format(finalPrice)}</span>
        </span>
        <AddToCartButton compact />
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/cardapio/_components/MenuItemCard.tsx"
git commit -m "feat(cardapio): MenuItemCard (imagem, descrição, preço, desconto, add-to-cart)"
```

---

### Task 4: `MenuHeader`

**Files:**
- Create: `app/(site)/cardapio/_components/MenuHeader.tsx`

- [ ] **Step 1: Criar o header**

Crie `app/(site)/cardapio/_components/MenuHeader.tsx` com:

```tsx
import Link from "next/link";

export default function MenuHeader() {
  return (
    <header className="flex items-center justify-between">
      <Link
        href="/"
        className="text-xl font-bold"
        style={{ fontFamily: "var(--font-eczar), serif" }}
      >
        Menu<span className="text-salmon">Sync</span>
      </Link>
      <Link
        href="/"
        className="group inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-caramel"
      >
        <span
          aria-hidden="true"
          className="transition-transform group-hover:-translate-x-1"
        >
          ←
        </span>
        Voltar
      </Link>
    </header>
  );
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/cardapio/_components/MenuHeader.tsx"
git commit -m "feat(cardapio): MenuHeader (logo + voltar)"
```

---

### Task 5: `CardapioClient` (layout + filtro + animação)

**Files:**
- Create: `app/(site)/cardapio/_components/CardapioClient.tsx`

Contexto: componente client raiz da página. Mantém `active` (categoria), filtra `menu`, renderiza header + título + rail de categorias + grid. Anima os cards com GSAP ao montar e ao trocar de categoria (revela via `useGSAP` com `dependencies: [active]`), respeitando `prefers-reduced-motion`.

- [ ] **Step 1: Criar o client component**

Crie `app/(site)/cardapio/_components/CardapioClient.tsx` com:

```tsx
"use client";

import { useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CATEGORIES, menu, type MenuCategory } from "../../_data/menu";
import SakuraCorners from "../../_components/SakuraCorners";
import MenuHeader from "./MenuHeader";
import MenuItemCard from "./MenuItemCard";

export default function CardapioClient() {
  const scope = useRef<HTMLDivElement>(null);
  const reduce = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const [active, setActive] = useState<MenuCategory>("sushi");

  const items = useMemo(() => menu.filter((m) => m.category === active), [active]);

  useGSAP(
    () => {
      if (reduce) return;
      gsap.from(".menu-card", {
        y: 24,
        opacity: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: "power3.out",
      });
    },
    { scope, dependencies: [active] },
  );

  return (
    <div
      ref={scope}
      className="relative min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat px-8 py-10 text-white md:px-12"
      style={{
        backgroundColor: "var(--color-dark-blue)",
        backgroundImage: "url('/bgCardapioInk.webp')",
      }}
    >
      <SakuraCorners active />
      <div
        className="pointer-events-none absolute inset-0 bg-dark-blue/70"
        aria-hidden="true"
      />

      <div className="relative z-10">
        <MenuHeader />

        <div className="mt-10">
          <p className="text-sm font-semibold tracking-[0.25em] text-yellow uppercase">
            メニュー · Cardápio
          </p>
          <h1
            className="mt-2 text-5xl font-bold md:text-7xl"
            style={{ fontFamily: "var(--font-eczar), serif" }}
          >
            Menu
          </h1>
        </div>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:gap-12">
          {/* Rail de categorias (vertical em lg, horizontal com scroll em telas menores) */}
          <nav aria-label="Categorias" className="lg:w-48 lg:shrink-0">
            <ul className="flex gap-4 overflow-x-auto pb-2 lg:flex-col lg:gap-3 lg:overflow-visible lg:pb-0">
              {CATEGORIES.map((c) => {
                const isActive = c.id === active;
                return (
                  <li key={c.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setActive(c.id)}
                      aria-current={isActive ? "true" : undefined}
                      className={`cursor-pointer whitespace-nowrap text-base transition-colors ${
                        isActive
                          ? "font-semibold text-yellow underline underline-offset-8"
                          : "text-white/70 hover:text-caramel"
                      }`}
                    >
                      {c.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Grid de itens filtrados */}
          <div className="flex-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {items.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/cardapio/_components/CardapioClient.tsx"
git commit -m "feat(cardapio): CardapioClient (rail de categorias + filtro + grid + animação)"
```

---

### Task 6: Rota `page.tsx`

**Files:**
- Create: `app/(site)/cardapio/page.tsx`

- [ ] **Step 1: Criar a página**

Crie `app/(site)/cardapio/page.tsx` com:

```tsx
import type { Metadata } from "next";
import CardapioClient from "./_components/CardapioClient";

export const metadata: Metadata = {
  title: "Cardápio — MenuSync",
  description:
    "O cardápio completo da MenuSync: sushi, rolls, pratos quentes, sobremesas e bebidas.",
};

export default function CardapioPage() {
  return <CardapioClient />;
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/cardapio/page.tsx"
git commit -m "feat(cardapio): rota /cardapio (page + metadata)"
```

---

### Task 7: Wiring do botão "Explore" na `MenuBento`

**Files:**
- Modify: `app/(site)/_components/MenuBento.tsx`

Contexto: hoje o card CTA é `<a href="#" className="bento-cta ...">…</a>` (contém o botão "Explore"). Trocar por `<Link href="/cardapio">` mantendo o mesmo `className` e conteúdo.

- [ ] **Step 1: Importar `Link`**

No topo de `app/(site)/_components/MenuBento.tsx`, logo após `import Image from "next/image";`, adicione:

```tsx
import Link from "next/link";
```

- [ ] **Step 2: Abrir o CTA com `Link`**

Troque:

```tsx
        <a
          href="#"
          className="bento-cta group flex flex-col justify-between gap-6 rounded-2xl border border-yellow/30 bg-gradient-to-br from-salmon/20 to-transparent p-6 transition hover:border-yellow/60"
        >
```

por:

```tsx
        <Link
          href="/cardapio"
          className="bento-cta group flex flex-col justify-between gap-6 rounded-2xl border border-yellow/30 bg-gradient-to-br from-salmon/20 to-transparent p-6 transition hover:border-yellow/60"
        >
```

- [ ] **Step 3: Fechar o CTA com `</Link>`**

Troque a tag de fechamento `</a>` que fecha esse card CTA (a que vem logo após o `</button>` do "Explore", perto do fim do arquivo) por:

```tsx
        </Link>
```

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add "app/(site)/_components/MenuBento.tsx"
git commit -m "feat(cardapio): Explore da MenuBento aponta para /cardapio"
```

---

### Task 8: Verificação final (lint + build + CDP)

**Files:** nenhum (só verificação).

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: sem erros/warnings novos.

- [ ] **Step 2: Build de produção**

Run: `npm run build`
Expected: compila com sucesso; a rota `/cardapio` aparece na lista de rotas geradas.

- [ ] **Step 3: Verificação visual (CDP, headless Chrome)**

Suba o dev server (`npm run dev`) e, com um script CDP no scratchpad (padrão já usado no projeto: headless Chrome + WebSocket + `Emulation.setDeviceMetricsOverride` + `Page.captureScreenshot`), confira em **1440×900**:
- navegar direto para `http://localhost:3000/cardapio`;
- renderiza header (`MenuSync` + "Voltar"), eyebrow `メニュー · Cardápio`, título "Menu";
- rail de categorias visível; categoria `Sushi` ativa (amarela/underline);
- grid de cards com imagem, nome, descrição, peso e preço; itens com desconto exibem badge `-15%`/`-10%` e preço antigo riscado;
- clicar em outra categoria (ex.: "Pratos Quentes") **troca** os cards exibidos e move o destaque;
- clicar em "Adicionar" num card dispara a animação do `AddToCartButton`;
- o fundo `bgCardapioInk.webp` carrega (sem 404).

Depois, repita em viewport **~390×840** (mobile) e confirme: rail vira faixa horizontal com scroll, grid cai para 1 coluna.

Por fim, valide o fluxo de origem: abrir `http://localhost:3000`, ir até a section **Cardápio** na roleta, clicar **Explore** e confirmar navegação para `/cardapio`; e o link "Voltar" retorna para `/`.

Tire screenshots (desktop + mobile) para revisão.

- [ ] **Step 4: (sem commit)** — task só de verificação. Se algo falhar, corrigir na task correspondente e re-verificar.

---

## Notas de execução

- Não há framework de testes: a "verificação" de cada task é `npx tsc --noEmit`; a final agrega `lint` + `build` + CDP. Não adicione Jest/Vitest.
- `AddToCartButton` é `"use client"` e usa GSAP internamente — funciona dentro do card sem mudanças além da prop `compact`.
- `SakuraCorners` exige `active: boolean`; na página passamos `active` (sempre visível).
- Imagens são reaproveitadas de `/public` (`plate1.webp`, `plate2.png`, `plate3.png`, `plate4.png`, `food1.webp`…`food4.webp`); nenhum asset novo é necessário.
