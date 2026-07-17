# Navbar global — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer a `Navbar` (logo + busca + carrinho + hambúrguer) ficar presente em todas as 5 seções da roleta e na página `/cardapio`, com o menu hambúrguer navegando de verdade.

**Architecture:** A `Navbar` deixa de viver dentro do `HeroShowcase` (que desliza) e vira uma barra **fixa no topo** (`fixed top-0 z-40`), renderizada uma vez no `SectionStage` e também na `CardapioClient`. O hambúrguer recebe uma prop `onSelectSection`; na home ele chama `goTo(index)`, e fora da home (ou para o Cardápio) usa `<Link>`. O `SectionStage` lê `?section=<id>` no mount para abrir a roleta na seção certa quando o usuário vem de `/cardapio`.

**Tech Stack:** Next.js 16 (App Router, client components), React 19, next/link, Tailwind v4, styled-jsx (no `HamburgerMenu`). Sem framework de testes — verificação = `npx tsc --noEmit` + `npm run lint` + `npm run build` + CDP visual.

---

## File Structure

- `app/(site)/_components/Navbar.tsx` — **modificar**: prop `onSelectSection?`, logo vira `<Link href="/">`, `nav` vira `fixed top-0 z-40`, repassa a prop ao `HamburgerMenu`.
- `app/(site)/_components/HamburgerMenu.tsx` — **modificar**: prop `onSelectSection?`; itens com `href`/`index`; render condicional `<button>` (seção na home) vs `<Link>`.
- `app/(site)/_components/SectionStage.tsx` — **modificar**: renderiza `<Navbar onSelectSection={goTo} />`; efeito de deep-link `?section=`.
- `app/(site)/_components/HeroShowcase.tsx` — **modificar**: remove `<Navbar />` + import; `pt-4` → `pt-28` no grid.
- `app/(site)/cardapio/_components/CardapioClient.tsx` — **modificar**: `<MenuHeader />` → `<Navbar />`; `py-10` → `pt-28 pb-10`.
- `app/(site)/cardapio/_components/MenuHeader.tsx` — **remover**.

---

## Task 1: Navbar — prop, logo-link e barra fixa

**Files:**
- Modify: `app/(site)/_components/Navbar.tsx`

- [ ] **Step 1: Reescrever o Navbar**

Substituir o conteúdo inteiro de `app/(site)/_components/Navbar.tsx` por:

```tsx
import Image from "next/image";
import Link from "next/link";
import HamburgerMenu from "./HamburgerMenu";

export default function Navbar({
  onSelectSection,
}: {
  onSelectSection?: (index: number) => void;
}) {
  return (
    <nav className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-6 md:px-12">
      <Link
        href="/"
        className="text-2xl font-semibold tracking-wide text-white transition hover:opacity-90 md:text-3xl"
        style={{ fontFamily: "var(--font-eczar), serif" }}
      >
        Menu<span className="text-salmon">Sync</span>
      </Link>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Busca — componente uiverse (tidy-pig-67), recolorido para a paleta do projeto */}
        <div className="group relative hidden max-w-[190px] items-center md:flex">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="pointer-events-none absolute left-4 z-[1] h-4 w-4 fill-white/70 transition-colors duration-300 group-focus-within:fill-caramel"
          >
            <g>
              <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z" />
            </g>
          </svg>
          <input
            id="query"
            name="searchbar"
            type="search"
            placeholder="Buscar..."
            aria-label="Buscar"
            className="h-11 w-full rounded-xl border-0 bg-dark-blue/60 pl-10 text-sm text-white shadow-[0_0_0_1.5px_rgba(255,255,255,0.12),0_0_25px_-17px_#000] backdrop-blur-sm transition-all duration-300 outline-none placeholder:text-white/55 hover:shadow-[0_0_0_2px_rgba(227,165,107,0.5),0_0_25px_-15px_#000] focus:shadow-[0_0_0_2px_rgba(227,199,123,0.9)] active:scale-[0.97]"
          />
        </div>

        {/* Carrinho */}
        <button
          type="button"
          aria-label="Carrinho"
          className="cursor-pointer opacity-90 transition hover:scale-110 hover:opacity-100"
        >
          <Image
            src="/icons/cart.svg"
            alt="Carrinho"
            width={32}
            height={32}
            className="h-7 w-7 md:h-8 md:w-8"
          />
        </button>

        <HamburgerMenu onSelectSection={onSelectSection} />
      </div>
    </nav>
  );
}
```

Mudanças: `import Link`; assinatura com `onSelectSection?`; `<span>` do logo → `<Link href="/">` (com `hover:opacity-90`); `className` do `<nav>` de `relative z-20` → `fixed inset-x-0 top-0 z-40`; `<HamburgerMenu onSelectSection={onSelectSection} />`.

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: erro em `HamburgerMenu` ("não aceita prop `onSelectSection`") — será resolvido na Task 2. Nenhum outro erro novo em `Navbar.tsx`.

---

## Task 2: HamburgerMenu — navegação real

**Files:**
- Modify: `app/(site)/_components/HamburgerMenu.tsx`

- [ ] **Step 1: Reescrever o HamburgerMenu**

Substituir o conteúdo inteiro de `app/(site)/_components/HamburgerMenu.tsx` por (mantém os mesmos ícones e o mesmo bloco `<style jsx>`):

```tsx
"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

type Item = {
  label: string;
  icon: ReactNode;
  href: string; // rota (itens de rota fixa e fallback fora da home)
  index?: number; // índice na roleta (itens de seção da home)
};

const items: Item[] = [
  {
    label: "Início",
    href: "/",
    index: 0,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 11 12 3l9 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10v10h14V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Cardápio",
    href: "/cardapio",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 8h6M9 12h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Reservas",
    href: "/?section=reservas",
    index: 3,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 6h16v15H4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M4 10h16M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Sobre",
    href: "/?section=sobre",
    index: 2,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Contato",
    href: "/?section=contato",
    index: 4,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 6h18v12H3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="m3 7 9 6 9-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function HamburgerMenu({
  onSelectSection,
}: {
  onSelectSection?: (index: number) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="wrap">
      {open && (
        <button type="button" aria-label="Fechar menu" className="overlay" onClick={() => setOpen(false)} />
      )}

      <label className="hamburger">
        <input
          type="checkbox"
          checked={open}
          onChange={(e) => setOpen(e.target.checked)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        />
        <svg viewBox="0 0 32 32">
          <path
            d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
            className="line line-top-bottom"
          />
          <path d="M7 16 27 16" className="line" />
        </svg>
      </label>

      {open && (
        <div className="panel">
          <div className="list">
            {items.map((it) => {
              // Item de seção na home (tem index + handler): navega pela roleta.
              // Caso contrário (Cardápio, ou qualquer item fora da home): usa rota.
              const asSectionButton = it.index !== undefined && onSelectSection;
              if (asSectionButton) {
                return (
                  <button
                    key={it.label}
                    type="button"
                    className="item"
                    onClick={() => {
                      onSelectSection(it.index!);
                      setOpen(false);
                    }}
                  >
                    {it.icon}
                    {it.label}
                  </button>
                );
              }
              return (
                <Link key={it.label} href={it.href} className="item" onClick={() => setOpen(false)}>
                  {it.icon}
                  {it.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        .wrap {
          position: relative;
          display: inline-flex;
          line-height: 0;
        }

        .hamburger {
          cursor: pointer;
          display: inline-flex;
        }
        .hamburger input {
          display: none;
        }
        .hamburger svg {
          height: 2.1rem;
          width: 2.1rem;
          transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .line {
          fill: none;
          stroke: #fff;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-width: 3;
          transition: stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1),
            stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .line-top-bottom {
          stroke-dasharray: 12 63;
        }
        .hamburger input:checked + svg {
          transform: rotate(-45deg);
        }
        .hamburger input:checked + svg .line-top-bottom {
          stroke-dasharray: 20 300;
          stroke-dashoffset: -32.42;
        }

        /* Fecha ao clicar fora */
        .overlay {
          position: fixed;
          inset: 0;
          z-index: 40;
          background: transparent;
          border: 0;
          cursor: default;
        }

        /* Painel do menu (fuzzy-cow-8) */
        .panel {
          position: absolute;
          right: 0;
          top: calc(100% + 14px);
          z-index: 50;
          transform-origin: top right;
          animation: menuIn 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        @keyframes menuIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .list {
          display: flex;
          flex-direction: column;
          width: 220px;
          background: rgba(18, 20, 26, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 10px;
          overflow: hidden;
        }
        .item {
          font-size: 15px;
          background: transparent;
          border: 2px solid transparent;
          padding: 10px;
          color: #fff;
          display: flex;
          align-items: center;
          position: relative;
          gap: 10px;
          cursor: pointer;
          border-radius: 10px;
          transition: 320ms;
          box-sizing: border-box;
          text-align: left;
          text-decoration: none;
        }
        .item:hover,
        .item:focus {
          border: 2px solid rgba(255, 255, 255, 0.12);
          color: #e7c9c9;
        }
        .item:focus,
        .item:active {
          background: rgba(255, 255, 255, 0.06);
          outline: none;
          margin-left: 14px;
        }
        .item::before {
          content: "";
          position: absolute;
          top: 5px;
          left: -14px;
          width: 4px;
          height: 80%;
          background: #e36b6b;
          border-radius: 5px;
          opacity: 0;
          transition: 320ms;
        }
        .item:focus::before,
        .item:active::before {
          opacity: 1;
        }
        .item :global(svg) {
          width: 20px;
          height: 20px;
          flex: none;
        }

        /* Efeito "fuzzy": desfoca os outros itens ao passar o mouse em um */
        .list:hover > :not(.item:hover) {
          transition: 300ms;
          filter: blur(1.4px);
          transform: scale(0.96);
        }
      `}</style>
    </div>
  );
}
```

Mudanças vs. original: `import Link`; tipo `Item` ganha `href` (obrigatório) e `index?`; cada item recebe `href`/`index` (Cardápio sem `index` → sempre rota); assinatura com `onSelectSection?`; no `map`, item de seção com handler vira `<button>` que chama `onSelectSection(index)` + fecha, senão `<Link href>` que fecha; adicionado `text-decoration: none;` na regra `.item` (para o `<Link>`/`<a>` não ficar sublinhado).

- [ ] **Step 2: Verificar tipos e lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros (a prop de `Navbar` → `HamburgerMenu` agora casa).

- [ ] **Step 3: Commit (Tasks 1–2)**

```bash
git add "app/(site)/_components/Navbar.tsx" "app/(site)/_components/HamburgerMenu.tsx"
git commit -m "feat(navbar): navbar fixa + logo-link + menu hamburguer navegavel (prop onSelectSection)"
```

---

## Task 3: SectionStage — renderizar navbar fixa + deep-link `?section=`

**Files:**
- Modify: `app/(site)/_components/SectionStage.tsx`

- [ ] **Step 1: Importar `useEffect` e `Navbar`**

No topo de `SectionStage.tsx`, trocar a linha de import do React:

```tsx
import { useMemo, useRef, useState } from "react";
```

por:

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
```

E adicionar o import do Navbar junto aos demais imports de componentes (após `import SectionRoulette, ...`):

```tsx
import Navbar from "./Navbar";
```

- [ ] **Step 2: Adicionar o efeito de deep-link**

Logo após a linha `const otherDishes = dishes.filter((d) => d.id !== activeDish.id);` (antes de `const trackRef = ...`), inserir:

```tsx
  // Deep-link: /?section=<id> abre a roleta já na seção certa (ex.: vindo de
  // /cardapio pelo menu). Roda uma vez no mount; depois limpa a query para o
  // refresh não re-saltar.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("section");
    if (id) {
      const i = ITEMS.findIndex((it) => it.id === id);
      if (i > 0) setActiveIndex(i);
    }
    if (params.has("section")) {
      history.replaceState(null, "", window.location.pathname);
    }
  }, []);
```

- [ ] **Step 3: Renderizar a Navbar fixa**

No JSX, dentro do `<div className="stage-pin ...">`, inserir `<Navbar onSelectSection={goTo} />` como **primeiro filho**, antes de `<div ref={trackRef} ...>`:

```tsx
    <div className="stage-pin relative h-screen w-full overflow-hidden">
      <Navbar onSelectSection={goTo} />
      <div ref={trackRef} className="flex h-full w-full flex-col">
```

- [ ] **Step 4: Verificar tipos e lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add "app/(site)/_components/SectionStage.tsx"
git commit -m "feat(navbar): SectionStage renderiza navbar fixa + deep-link ?section="
```

---

## Task 4: HeroShowcase — remover navbar em fluxo + folga no topo

**Files:**
- Modify: `app/(site)/_components/HeroShowcase.tsx`

- [ ] **Step 1: Remover o import do Navbar**

Apagar a linha:

```tsx
import Navbar from "./Navbar";
```

- [ ] **Step 2: Remover o `<Navbar />` do JSX**

Apagar a linha `<Navbar />` (e a linha em branco adjacente) que fica logo após `<AtmosphereLayer />`. O bloco deve passar de:

```tsx
      <AtmosphereLayer />

      <Navbar />

      <div className="relative z-10 grid grid-cols-1 items-center gap-8 px-8 pt-4 pb-40 md:px-12 lg:grid-cols-[1fr_1.1fr_1fr]">
```

para:

```tsx
      <AtmosphereLayer />

      <div className="relative z-10 grid grid-cols-1 items-center gap-8 px-8 pt-28 pb-40 md:px-12 lg:grid-cols-[1fr_1.1fr_1fr]">
```

(Ou seja: remove `<Navbar />` e troca `pt-4` → `pt-28` para compensar a barra fixa que antes ocupava esse espaço em fluxo.)

- [ ] **Step 3: Verificar tipos e lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add "app/(site)/_components/HeroShowcase.tsx"
git commit -m "refactor(navbar): HeroShowcase deixa de renderizar a navbar (agora global) + folga no topo"
```

---

## Task 5: /cardapio — usar a navbar global no lugar do MenuHeader

**Files:**
- Modify: `app/(site)/cardapio/_components/CardapioClient.tsx`
- Delete: `app/(site)/cardapio/_components/MenuHeader.tsx`

- [ ] **Step 1: Trocar o import**

Em `CardapioClient.tsx`, trocar:

```tsx
import MenuHeader from "./MenuHeader";
```

por:

```tsx
import Navbar from "../../_components/Navbar";
```

- [ ] **Step 2: Folga no topo + trocar o header**

Trocar a `className` do container raiz para dar folga sob a navbar fixa — de:

```tsx
      className="relative min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat px-8 py-10 text-white md:px-12"
```

para:

```tsx
      className="relative min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat px-8 pt-28 pb-10 text-white md:px-12"
```

E, dentro do `<div className="relative z-10">`, trocar `<MenuHeader />` por `<Navbar />`:

```tsx
      <div className="relative z-10">
        <Navbar />
```

- [ ] **Step 3: Remover o MenuHeader**

```bash
git rm "app/(site)/cardapio/_components/MenuHeader.tsx"
```

- [ ] **Step 4: Verificar que nada mais importa MenuHeader**

Run: `grep -rn "MenuHeader" app/`
Expected: nenhum resultado (0 ocorrências).

- [ ] **Step 5: Verificar tipos, lint e build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: sem erros; build gera as rotas `/` e `/cardapio`.

- [ ] **Step 6: Commit**

```bash
git add "app/(site)/cardapio/_components/CardapioClient.tsx"
git commit -m "feat(navbar): /cardapio usa a navbar global (remove MenuHeader)"
```

---

## Task 6: Verificação visual (controller — CDP)

**Files:** nenhum (verificação); ajustes pontuais de `padding-top` só se a verificação acusar sobreposição.

- [ ] **Step 1: Subir o dev server**

Run: `npm run dev` (background). Confirmar `http://localhost:3000` de pé.

- [ ] **Step 2: CDP — roleta (1440×900)**

Abrir `http://localhost:3000`, e para cada seção (via clique no drug `nav[aria-label="Seções"]`): Início, Cardápio, Sobre, Reservas, Contato — confirmar que a **navbar (logo + busca + carrinho + hambúrguer) está visível e fixa no topo** e **não desliza** com o track. Screenshot de cada.

Checagens JS (via `Runtime.evaluate`):
- `getComputedStyle(document.querySelector('nav.fixed') ?? document.querySelector('nav')).position === 'fixed'`
- `document.querySelector('a[href="/"]')` (logo) existe e está visível no topo.

- [ ] **Step 3: CDP — hambúrguer navega (home)**

Abrir o hambúrguer (`label.hamburger input` → set checked / clicar) e:
- clicar **Sobre** → `activeIndex` da roleta vai para a seção Sobre (a seção Sobre fica visível; `nav[aria-label="Seções"] [aria-current="true"]` = "Sobre"). 
- reabrir, clicar **Contato** → seção Contato ativa.
- reabrir, clicar **Cardápio** → `location.pathname === "/cardapio"`.

- [ ] **Step 4: CDP — /cardapio + deep-link**

Navegar para `http://localhost:3000/cardapio`:
- navbar fixa no topo; título "Menu" e rail **não** ficam atrás da navbar (checar que o topo do `h1` tem `getBoundingClientRect().top` ≥ ~96px).
- clicar no logo → `location.pathname === "/"`.
- voltar para `/cardapio`, abrir o hambúrguer, clicar **Sobre** → `location.pathname === "/"` **e** `location.search === ""` (query limpa) **e** a seção Sobre está ativa na roleta.

- [ ] **Step 5: CDP — mobile (390×840)**

Em `/` e `/cardapio`: navbar no topo coexiste com as pills inferiores (`SectionRoulette` mobile) sem sobrepor conteúdo. Screenshot.

- [ ] **Step 6: Ajuste pontual (se necessário)**

Se em alguma seção o conteúdo do topo ficar coberto pela navbar (as seções Sobre/Reservas/Contato/Cardápio-bento usam `justify-center`, então não devem cobrir; Hero e /cardapio já têm `pt-28`): adicionar `pt-24`/`pt-28` ao container de topo da seção afetada e re-verificar. Commit do ajuste, se houver:

```bash
git add -A
git commit -m "fix(navbar): folga no topo da secao <X> para nao ficar sob a navbar"
```

- [ ] **Step 7: Parar o dev server**

Run: `taskkill //F //IM node.exe` (encerra o dev server; a notificação "background task failed" é esperada).

---

## Self-Review (feito)

- **Cobertura do spec:** navbar fixa na roleta (Task 3+4) · navbar em /cardapio (Task 5) · logo-link (Task 1) · hambúrguer navegável home/away (Task 2) · deep-link `?section=` + limpeza (Task 3) · remoção do MenuHeader (Task 5) · padding no topo (Tasks 4, 5, 6) · verificação tsc/lint/build/CDP (Tasks 2,3,4,5,6). ✅
- **Placeholders:** nenhum — todo passo tem código/comando concreto.
- **Consistência de tipos:** `onSelectSection?: (index: number) => void` idêntico em `Navbar` e `HamburgerMenu`; `goTo(index: number)` casa; `ITEMS` (com `.id`) já existe no `SectionStage` e é usado no efeito de deep-link; os `id`s (`sobre`,`reservas`,`contato`,`inicio`) batem com os `href="/?section=..."` do menu. ✅
```
