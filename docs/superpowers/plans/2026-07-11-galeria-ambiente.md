# Galeria / Ambiente — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar a section "Galeria / Ambiente" — 6 fotos em mosaico editorial, com hover (zoom + legenda), lightbox navegável e entrada escalonada no scroll — entre o Bento do cardápio e o Sobre.

**Architecture:** Uma section client (`GallerySection`) que renderiza um header + grid mosaico com `grid-template-areas` fixas no desktop e empilhado no mobile. Cada célula é um `<button>` que abre um `GalleryLightbox` (portal para `document.body`, navegação por teclado/setas, trava de scroll). Dados isolados em `app/(site)/_data/gallery.ts`. Entrada animada via GSAP + ScrollTrigger com guarda de `prefers-reduced-motion`.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, GSAP + @gsap/react (`useGSAP`, `ScrollTrigger`), `createPortal`, styled-jsx.

**Convenções do projeto (seguir):**
- Não há framework de testes. Verificação por tarefa = `npm run lint` + `npx tsc --noEmit` + (quando houver UI nova) `npm run build`, e conferência visual via CDP feita pelo controller.
- Tokens Tailwind v4: `text-yellow`, `text-salmon`, `--color-dark-blue`, `--font-eczar`.
- Padrão de hidratação segura: `useHydrated` via `useSyncExternalStore` (ver `PlayVideoButton.tsx`).
- Padrão de modal/portal: `createPortal(..., document.body)` com trava de scroll e Esc (ver `PlayVideoButton.tsx`).
- Padrão de reveal no scroll: `useGSAP` com `ScrollTrigger` + guarda de reduced-motion (ver `AboutSection.tsx`).

**RESTRIÇÃO DE COMMIT (crítica):** Commitar **apenas** os arquivos desta feature via caminhos explícitos (`git add <path>`). NUNCA `git add -A`/`git add .`. Preservar todo o WIP não commitado do usuário (`.gitignore`, `README.md`, `HeroShowcase.tsx`, `app/globals.css`, `next.config.ts`, `public/icons/*.svg`, `app/layout.tsx`, `MenuBento.tsx`, `HomeExperience.tsx`, `public/bgPlates.webp`, etc.).

---

## File Structure

- **Create:** `app/(site)/_data/gallery.ts` — tipo `GalleryImage` + array `galleryImages` (6 itens).
- **Create:** `public/gallery/g1.webp` … `g6.webp` — placeholders de desenvolvimento (cópias de assets existentes), a serem substituídos pelas fotos reais do usuário.
- **Create:** `app/(site)/_components/GallerySection.tsx` — header + grid mosaico + estado do lightbox + entrada GSAP.
- **Create:** `app/(site)/_components/GalleryLightbox.tsx` — modal fullscreen (portal) com navegação.
- **Modify:** `app/(site)/page.tsx` — inserir `<GallerySection />` entre `<HomeExperience />` e `<AboutSection />`.

---

## Task 1: Dados da galeria + placeholders

**Files:**
- Create: `app/(site)/_data/gallery.ts`
- Create: `public/gallery/g1.webp` … `public/gallery/g6.webp`

- [ ] **Step 1: Criar o arquivo de dados**

Create `app/(site)/_data/gallery.ts`:

```ts
export type GalleryImage = {
  /** Caminho do arquivo em public/. Substitua os placeholders por fotos reais. */
  src: string;
  /** Texto alternativo (acessibilidade). */
  alt: string;
  /** Legenda exibida no hover e no lightbox. */
  caption: string;
};

// g1 é a foto-herói (retrato, coluna esquerda do mosaico). As demais preenchem o mosaico.
// Troque os arquivos em public/gallery/g1.webp … g6.webp pelas fotos reais mantendo os nomes.
export const galleryImages: GalleryImage[] = [
  { src: "/gallery/g1.webp", alt: "Fachada do restaurante na Liberdade ao anoitecer", caption: "Fachada na Liberdade" },
  { src: "/gallery/g2.webp", alt: "Salão principal com iluminação quente", caption: "Salão principal" },
  { src: "/gallery/g3.webp", alt: "Chef preparando pratos no balcão de sushi", caption: "Balcão de sushi" },
  { src: "/gallery/g4.webp", alt: "Prato de sashimi finalizado", caption: "Sashimi do dia" },
  { src: "/gallery/g5.webp", alt: "Detalhe do forno robata em brasa", caption: "Forno robata" },
  { src: "/gallery/g6.webp", alt: "Seleção de saquês da casa", caption: "Adega de saquê" },
];
```

- [ ] **Step 2: Criar placeholders a partir de assets existentes**

Os placeholders permitem construir e verificar o layout já. O usuário substitui depois.

Run (Git Bash):

```bash
mkdir -p public/gallery
cp public/bgAbout.webp public/gallery/g1.webp
cp public/bgHero.webp  public/gallery/g2.webp
cp public/bgPlates.webp public/gallery/g3.webp
cp public/food1.webp   public/gallery/g4.webp
cp public/food2.webp   public/gallery/g5.webp
cp public/food4.webp   public/gallery/g6.webp
ls public/gallery
```

Expected: lista `g1.webp g2.webp g3.webp g4.webp g5.webp g6.webp`.

- [ ] **Step 3: Verificar tipos e lint**

Run:

```bash
npx tsc --noEmit && npm run lint
```

Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add "app/(site)/_data/gallery.ts" public/gallery/g1.webp public/gallery/g2.webp public/gallery/g3.webp public/gallery/g4.webp public/gallery/g5.webp public/gallery/g6.webp
git commit -m "feat(gallery): dados da galeria + placeholders

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: GallerySection — header + mosaico estático (com hover)

Nesta tarefa a section renderiza e é visível na página, com hover funcionando. Lightbox e animação de entrada vêm nas tarefas 3 e 4. Os cliques ainda não abrem nada (placeholder `onClick`).

**Files:**
- Create: `app/(site)/_components/GallerySection.tsx`
- Modify: `app/(site)/page.tsx`

- [ ] **Step 1: Criar o componente da section (mosaico + hover)**

Create `app/(site)/_components/GallerySection.tsx`:

```tsx
"use client";

import Image from "next/image";
import { galleryImages } from "../_data/gallery";

// Mapeia cada foto (na ordem do array) para uma área do mosaico no desktop.
const AREAS = ["hero", "a", "b", "c", "d", "e"] as const;

export default function GallerySection() {
  return (
    <section
      className="gallery-section relative overflow-hidden px-8 py-24 text-white md:px-12 lg:py-28"
      style={{ backgroundColor: "var(--color-dark-blue)" }}
      aria-label="Galeria do restaurante"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold tracking-[0.25em] text-yellow uppercase">Galeria</p>
        <h2
          className="mt-2 text-4xl font-bold md:text-6xl"
          style={{ fontFamily: "var(--font-eczar), serif" }}
        >
          O ambiente e os pratos
        </h2>

        <div className="gallery-grid mt-12">
          {galleryImages.map((img, i) => (
            <button
              key={img.src}
              type="button"
              aria-label={`Ampliar foto: ${img.caption}`}
              className={`gallery-cell cell-${AREAS[i]} group relative min-h-[240px] cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent md:min-h-0`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-4 opacity-100 transition duration-300 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                <span className="text-sm font-medium text-white drop-shadow">{img.caption}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .gallery-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .gallery-grid {
            grid-template-columns: 1.3fr 1fr 1fr;
            grid-auto-rows: 200px;
            grid-template-areas:
              "hero a a"
              "hero b c"
              "d e e";
          }
          .cell-hero { grid-area: hero; }
          .cell-a { grid-area: a; }
          .cell-b { grid-area: b; }
          .cell-c { grid-area: c; }
          .cell-d { grid-area: d; }
          .cell-e { grid-area: e; }
        }
      `}</style>
    </section>
  );
}
```

- [ ] **Step 2: Inserir a section na página**

Modify `app/(site)/page.tsx` — adicionar o import e o elemento entre `HomeExperience` e `AboutSection`:

```tsx
import HomeExperience from "./_components/HomeExperience";
import GallerySection from "./_components/GallerySection";
import AboutSection from "./_components/AboutSection";
import Loader from "./_components/Loader";
import { dishes } from "./_data/dishes";

export default function SiteHome() {
  return (
    <>
      <Loader />
      <HomeExperience dishes={dishes} />
      <GallerySection />
      <AboutSection />
    </>
  );
}
```

- [ ] **Step 3: Verificar tipos, lint e build**

Run:

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Expected: build conclui sem erros.

- [ ] **Step 4: Verificação visual (controller, via CDP)**

O controller sobe o dev server e captura a section em desktop (1440) e mobile (390): confirmar o mosaico assimétrico no desktop (hero à esquerda em 2 linhas; faixas largas nas linhas 1 e 3), empilhamento no mobile, e o hover (zoom + legenda subindo). Ajustar `grid-auto-rows` / `min-h` se necessário.

- [ ] **Step 5: Commit**

```bash
git add "app/(site)/_components/GallerySection.tsx" "app/(site)/page.tsx"
git commit -m "feat(gallery): section com mosaico editorial e hover

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: GalleryLightbox — modal navegável

**Files:**
- Create: `app/(site)/_components/GalleryLightbox.tsx`
- Modify: `app/(site)/_components/GallerySection.tsx`

- [ ] **Step 1: Criar o componente do lightbox**

Create `app/(site)/_components/GalleryLightbox.tsx`:

```tsx
"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import gsap from "gsap";
import type { GalleryImage } from "../_data/gallery";

const noopSubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

type Props = {
  images: GalleryImage[];
  openIndex: number | null;
  onOpenIndexChange: (index: number | null) => void;
};

export default function GalleryLightbox({ images, openIndex, onOpenIndexChange }: Props) {
  const mounted = useHydrated();
  const open = openIndex !== null;
  const n = images.length;
  const dialogRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (!reduce && backdropRef.current && dialogRef.current) {
      gsap.fromTo(backdropRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: "power2.out" });
      gsap.fromTo(
        dialogRef.current,
        { autoAlpha: 0, scale: 0.96 },
        { autoAlpha: 1, scale: 1, duration: 0.35, ease: "power3.out" },
      );
    }

    dialogRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenIndexChange(null);
      else if (e.key === "ArrowRight") onOpenIndexChange(((openIndex as number) + 1) % n);
      else if (e.key === "ArrowLeft") onOpenIndexChange(((openIndex as number) - 1 + n) % n);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, openIndex, n, onOpenIndexChange]);

  if (!open || !mounted) return null;

  const img = images[openIndex as number];
  const go = (dir: number) => onOpenIndexChange((((openIndex as number) + dir) % n + n) % n);

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={() => onOpenIndexChange(null)}
      role="dialog"
      aria-modal="true"
      aria-label={`Foto: ${img.caption}`}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative flex max-h-[88vh] w-[92vw] max-w-5xl flex-col outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onOpenIndexChange(null)}
          aria-label="Fechar"
          className="absolute -top-12 right-0 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="relative h-[72vh] w-full">
          <Image
            key={img.src}
            src={img.src}
            alt={img.alt}
            fill
            sizes="92vw"
            className="rounded-xl object-contain"
            priority
          />
        </div>

        <p className="mt-4 text-center text-sm text-white/80">{img.caption}</p>

        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Foto anterior"
          className="absolute top-1/2 -left-4 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:-left-16"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Próxima foto"
          className="absolute top-1/2 -right-4 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:-right-16"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>,
    document.body,
  );
}
```

- [ ] **Step 2: Ligar o lightbox na section (estado + foco de retorno)**

Modify `app/(site)/_components/GallerySection.tsx`:

1. Trocar os imports do topo para incluir `useRef`, `useState` e o lightbox:

```tsx
"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { galleryImages } from "../_data/gallery";
import GalleryLightbox from "./GalleryLightbox";
```

2. Dentro do componente, antes do `return`, adicionar estado e handler que devolve o foco à célula de origem ao fechar:

```tsx
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggersRef = useRef<Array<HTMLButtonElement | null>>([]);

  function handleOpenIndexChange(index: number | null) {
    if (index === null && openIndex !== null) {
      // devolve o foco à foto que abriu o lightbox
      triggersRef.current[openIndex]?.focus();
    }
    setOpenIndex(index);
  }
```

3. No `<button>` de cada célula, registrar o ref e o `onClick` para abrir:

```tsx
            <button
              key={img.src}
              type="button"
              ref={(el) => { triggersRef.current[i] = el; }}
              onClick={() => setOpenIndex(i)}
              aria-label={`Ampliar foto: ${img.caption}`}
              className={`gallery-cell cell-${AREAS[i]} group relative min-h-[240px] cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent md:min-h-0`}
            >
```

4. Logo antes do `<style jsx>` (ainda dentro do `<section>`), renderizar o lightbox:

```tsx
        <GalleryLightbox
          images={galleryImages}
          openIndex={openIndex}
          onOpenIndexChange={handleOpenIndexChange}
        />
```

- [ ] **Step 3: Verificar tipos, lint e build**

Run:

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Expected: build sem erros.

- [ ] **Step 4: Verificação visual (controller, via CDP)**

Clicar numa célula → abre lightbox em tela cheia; setas e teclado ←/→ navegam de forma circular; Esc e clique no backdrop fecham; legenda aparece; o scroll do body fica travado enquanto aberto.

- [ ] **Step 5: Commit**

```bash
git add "app/(site)/_components/GalleryLightbox.tsx" "app/(site)/_components/GallerySection.tsx"
git commit -m "feat(gallery): lightbox navegável (setas, teclado, foco)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Entrada escalonada no scroll (GSAP) + reduced-motion

**Files:**
- Modify: `app/(site)/_components/GallerySection.tsx`

- [ ] **Step 1: Adicionar a animação de entrada**

Modify `app/(site)/_components/GallerySection.tsx`:

1. Atualizar os imports do topo:

```tsx
"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { galleryImages } from "../_data/gallery";
import GalleryLightbox from "./GalleryLightbox";

gsap.registerPlugin(ScrollTrigger);
```

2. Trocar `const scope`/estado: usar `scope` como ref da section e adicionar o reveal. Adicionar, junto aos outros hooks, antes do `return`:

```tsx
  const scope = useRef<HTMLElement>(null);
  const reduce = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useGSAP(
    () => {
      if (reduce) return;
      gsap.from(".gallery-cell", {
        scrollTrigger: { trigger: scope.current, start: "top 75%", once: true },
        y: 28,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: "power3.out",
      });
    },
    { scope },
  );
```

3. Anexar o ref na `<section>`:

```tsx
    <section
      ref={scope}
      className="gallery-section relative overflow-hidden px-8 py-24 text-white md:px-12 lg:py-28"
      style={{ backgroundColor: "var(--color-dark-blue)" }}
      aria-label="Galeria do restaurante"
    >
```

- [ ] **Step 2: Verificar tipos, lint e build**

Run:

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Expected: build sem erros.

- [ ] **Step 3: Verificação visual (controller, via CDP)**

Ao rolar até a section, as células surgem em sequência (fade + subida). Com `prefers-reduced-motion: reduce` forçado, a grade aparece estática (sem stagger) e o lightbox continua funcional.

- [ ] **Step 4: Commit**

```bash
git add "app/(site)/_components/GallerySection.tsx"
git commit -m "feat(gallery): entrada escalonada no scroll (reduced-motion safe)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Verificação final e polish

**Files:**
- Modify (se necessário no tuning): `app/(site)/_components/GallerySection.tsx`

- [ ] **Step 1: Revisão visual completa (controller, via CDP)**

Verificar em sequência:
- Desktop 1440: mosaico correto (hero à esquerda em 2 linhas; faixas largas nas linhas 1 e 3), espaçamento e alturas agradáveis.
- Mobile 390: empilhamento vertical, legendas sempre visíveis, alturas ok.
- Hover: zoom + legenda.
- Lightbox: abrir/navegar/fechar por setas, teclado e backdrop; foco volta à célula.
- Reduced-motion: entrada estática, lightbox sem transição mas funcional.

Ajustar `grid-auto-rows`, `min-h`, gaps ou tamanhos de fonte inline conforme necessário e recommitar a `GallerySection.tsx` se houver mudança.

- [ ] **Step 2: Build final limpo**

Run:

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Expected: sem erros.

- [ ] **Step 3: Confirmar que só os arquivos da feature foram commitados**

Run:

```bash
git log --oneline -6
git status --short
```

Expected: os commits da galeria presentes; o WIP do usuário permanece não commitado e intacto.

---

## Self-Review (preenchido pelo autor do plano)

- **Cobertura do spec:** dados (T1), mosaico + fundo dark-blue limpo + header (T2), hover zoom+legenda (T2), lightbox com navegação/teclado/foco/scroll-lock (T3), entrada escalonada + reduced-motion (T4), responsivo/empilhamento (T2 CSS + T5 verificação), acessibilidade (botões com aria-label, dialog modal, foco de retorno — T2/T3). Placement no page.tsx (T2). Verificação via CDP (T2–T5). Tudo coberto.
- **Placeholders:** nenhum "TBD"; todo passo de código traz o código completo.
- **Consistência de tipos:** `GalleryImage { src, alt, caption }` usado igual em `gallery.ts`, `GallerySection` e `GalleryLightbox`; prop `onOpenIndexChange` e `openIndex` consistentes entre section e lightbox; `AREAS` casa com as classes `.cell-*` do `<style jsx>`.

## Observação para o usuário

`public/gallery/g1.webp … g6.webp` são **placeholders** (cópias de assets existentes) para a section funcionar e ser verificada já. Basta substituir os 6 arquivos pelas fotos reais mantendo os nomes — nenhum código muda. `g1` é a foto-herói (fica melhor com uma foto em retrato/vertical).
