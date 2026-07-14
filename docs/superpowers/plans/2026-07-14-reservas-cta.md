# Reservas (CTA) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar uma 4ª seção **Reservas (CTA)** ao drum da home, com fundo pintado (recolorido na paleta), animação de "pintura" ao ativar e entrada elástica dos elementos, no layout Split editorial.

**Architecture:** Novo componente client isolado `ReservasCTA.tsx` (seção `min-h-screen`) plugado como 4º painel do `SectionStage`. Fundo = `bgCTAsInk.webp` (duotone caramel/dark-blue) numa camada com `clip-path` animado por GSAP; conteúdo entra com `elastic.out`. Reutiliza tokens, botões e `PLACE` já existentes.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, GSAP + `@gsap/react`, sharp (recolor de imagem).

---

## Convenções deste projeto (LEIA ANTES)

- **Sem framework de testes.** Verificação = `npx tsc --noEmit` + `npm run lint` + checagem visual via CDP (headless Chrome). Não existe `pytest`/`jest`; não invente testes.
- **Política de commits desta branch (instrução do usuário — sobrepõe o padrão do skill):**
  **NÃO commitar código.** Todo o código novo/alterado permanece na **working tree**
  para revisão do usuário. NUNCA use `git add -A`/`git add .`/`git commit -a`. O único
  arquivo já commitado é o spec/plano (docs). Cada task termina em **verificação**, não
  em commit.
- **Route group:** caminhos com `(site)` precisam de aspas no shell.
- **Dev server:** iniciar via Bash `run_in_background:true` com `npm run dev` (no
  PowerShell `Start-Process npm` falha — npm é `.cmd`). Já pode estar rodando em
  `http://localhost:3000`.
- **CDP:** reutilizar o padrão de `scratchpad/about.mjs` (headless Chrome,
  `--remote-debugging-port`, `Target.createTarget`/`attachToTarget` flatten,
  `Runtime.evaluate` com `awaitPromise:true`; Node 24 usa `ws.addEventListener("message")`).
  Para reduced-motion adicionar flag `--force-prefers-reduced-motion=reduce`.
- **sharp a partir do scratchpad:** usar
  `const require = createRequire("C:/Projects/menusync/package.json")` (ESM `import sharp`
  não resolve).

---

## Estrutura de arquivos

- **Criar:** `public/bgCTAsInk.webp` — fundo recolorido (2560×1440, duotone).
- **Criar:** `app/(site)/_components/ReservasCTA.tsx` — a seção CTA (markup + animações).
- **Modificar:** `app/(site)/_components/SectionStage.tsx` — registrar item na roleta e
  4º painel.
- **Temporário (scratchpad):** `recolor-ctas.mjs` (recolor) e reuso de `about.mjs`
  adaptado para screenshots.

---

## Task 1: Gerar `public/bgCTAsInk.webp` (recolor duotone)

**Files:**
- Create: `public/bgCTAsInk.webp`
- Temp: `scratchpad/recolor-ctas.mjs`

- [ ] **Step 1: Escrever o script de recolor**

Criar `C:/Users/thall/AppData/Local/Temp/claude/C--Projects-menusync/f39e35e7-0c35-4d6e-a4d9-82e3f83cd35e/scratchpad/recolor-ctas.mjs`:

```js
import { createRequire } from "node:module";
const require = createRequire("C:/Projects/menusync/package.json");
const sharp = require("sharp");
const IN = "C:/Projects/menusync/public/bgCTAs.webp";
const OUT = "C:/Projects/menusync/public/bgCTAsInk.webp";
// Mesmo duotone dos outros backgrounds: claro→caramel(227,165,107), escuro→dark-blue(42,46,55).
// a = (caramel - darkblue)/255 por canal ; b = darkblue
const info = await sharp(IN)
  .resize(2560, 1440, { fit: "cover", kernel: "lanczos3" })
  .removeAlpha()
  .linear([0.72549, 0.46667, 0.20392], [42, 46, 55])
  .webp({ quality: 82 })
  .toFile(OUT);
console.log("made", info.width + "x" + info.height, Math.round(info.size / 1024) + "KB");
```

- [ ] **Step 2: Rodar o script**

Run: `cd "<scratchpad>" && node recolor-ctas.mjs`
Expected: imprime `made 2560x1440 <N>KB` e cria `public/bgCTAsInk.webp`.

- [ ] **Step 3: Verificar cores por amostragem**

Rodar um one-liner sharp que lê pixels: área da massa pintada (canto inf-esq, ex.
`x=W*0.15, y=H*0.7`) deve ser ~caramel `[~227,~165,~107]`; área escura (canto sup-dir,
ex. `x=W*0.85, y=H*0.1`) deve ser ~dark-blue `[~42,~46,~55]`.
Expected: valores próximos desses (tolerância ±25 por canal; a arte tem textura).

- [ ] **Step 4: Inspeção visual + watermark**

Abrir `public/bgCTAsInk.webp` com a ferramenta Read (imagem). Confirmar: massa caramelo
inf-esq sobre tela dark-blue, respingos. Verificar a marca d'água "Magnific" na área
escura — se **perceptível a olho**, atenuar: tentar `.blur(0.3)` no recolor **ou** um
leve `.modulate`/recorte. Se imperceptível, seguir.
Expected: fundo coerente com a paleta; watermark imperceptível.

- [ ] **Step 5: Checkpoint (sem commit)**

Deixar `public/bgCTAsInk.webp` na working tree. Não commitar (política da branch).

---

## Task 2: Criar `ReservasCTA.tsx` (markup estático, sem animação)

Nesta task, construir a seção completa em **estado final** (tudo visível, sem GSAP).
As animações entram na Task 4. Isso garante que layout/contraste estão certos antes de
animar.

**Files:**
- Create: `app/(site)/_components/ReservasCTA.tsx`

- [ ] **Step 1: Criar o componente (estado final, estático)**

Criar `app/(site)/_components/ReservasCTA.tsx` com exatamente:

```tsx
"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { PLACE } from "./about/about-data";

// (Na Task 4 adicionamos `import gsap from "gsap";` ao ativar a animação.)

// Seção Reservas (CTA da home). O fundo (bgCTAsInk) é "pintado" ao ativar e os
// elementos entram das laterais com efeito elástico. É um CTA — o fluxo real de
// reserva é a Fase 08. O card apenas navega para /reserva.

const PHONE = "(11) 3200-1590";
const PHONE_HREF = "tel:+551132001590";

export default function ReservasCTA({ active = false }: { active?: boolean }) {
  const scope = useRef<HTMLElement>(null);
  const reduce = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const played = useRef(false);

  // (Animação adicionada na Task 4.)
  void active;
  void reduce;
  void played;
  useGSAP(() => {}, { scope });

  return (
    <section
      ref={scope}
      className="relative flex min-h-screen flex-col justify-center overflow-hidden px-8 py-16 md:px-12"
      style={{ backgroundColor: "var(--color-dark-blue)" }}
      aria-label="Reservas"
    >
      {/* Camada de tinta (caramelo) — revelada na animação de pintura */}
      <div
        className="cta-paint pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/bgCTAsInk.webp')" }}
        aria-hidden="true"
      />

      {/* Respingos ("jogar tinta") */}
      <div
        className="cta-splatter pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <span className="absolute left-[30%] top-[22%] h-3 w-3 rounded-full bg-caramel" />
        <span className="absolute left-[18%] top-[42%] h-5 w-5 rounded-full bg-caramel/90" />
        <span className="absolute bottom-[26%] left-[42%] h-2 w-2 rounded-full bg-caramel/80" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Esquerda — texto/CTA (sobre caramelo → dark-blue) */}
        <div className="cta-left text-dark-blue">
          <p className="text-sm font-semibold tracking-[0.25em] uppercase">
            予約 · Reservas
          </p>
          <h2
            className="mt-3 text-5xl leading-tight font-bold md:text-6xl"
            style={{ fontFamily: "var(--font-eczar), serif" }}
          >
            Reserve sua <span className="text-salmon">mesa</span>
          </h2>
          <p className="mt-5 max-w-md text-base text-dark-blue/80 md:text-lg">
            Uma noite de sabores autênticos à sua espera. Garanta seu lugar no balcão
            ou no salão e viva o ritual da cozinha japonesa.
          </p>
          <div className="mt-8">
            <Link
              href="/reserva"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-yellow px-7 font-semibold text-dark-blue shadow-[5px_5px_18px_rgba(0,0,0,0.18)] transition-all duration-500 hover:bg-caramel active:scale-[0.97]"
            >
              Reservar mesa
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-dark-blue/75">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-salmon" />
              {PLACE.hours}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-salmon" />
              <a href={PHONE_HREF} className="hover:text-dark-blue">
                {PHONE}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-salmon" />
              {PLACE.address}
            </li>
          </ul>
        </div>

        {/* Direita — card de reserva rápida (sobre área escura → vidro) */}
        <aside className="cta-card rounded-3xl border border-white/15 bg-white/[0.06] p-7 text-white shadow-2xl backdrop-blur-md">
          <p className="text-sm font-semibold tracking-wide text-yellow uppercase">
            Reserva rápida
          </p>
          <h3
            className="mt-1 text-2xl font-bold"
            style={{ fontFamily: "var(--font-eczar), serif" }}
          >
            Escolha data e horário
          </h3>

          <form action="/reserva" className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm text-white/70">
              Data
              <input
                type="date"
                name="data"
                className="h-11 rounded-xl border border-white/15 bg-white/[0.05] px-3 text-white [color-scheme:dark] transition outline-none focus:border-yellow/60"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 text-sm text-white/70">
                Pessoas
                <select
                  name="pessoas"
                  className="h-11 rounded-xl border border-white/15 bg-white/[0.05] px-3 text-white transition outline-none focus:border-yellow/60"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n} className="text-dark-blue">
                      {n} {n === 1 ? "pessoa" : "pessoas"}
                    </option>
                  ))}
                  <option value="9+" className="text-dark-blue">
                    9+ pessoas
                  </option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm text-white/70">
                Horário
                <select
                  name="horario"
                  className="h-11 rounded-xl border border-white/15 bg-white/[0.05] px-3 text-white transition outline-none focus:border-yellow/60"
                >
                  {["18:00", "19:00", "20:00", "21:00", "22:00", "23:00"].map((h) => (
                    <option key={h} value={h} className="text-dark-blue">
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="submit"
              className="mt-2 h-12 rounded-full bg-yellow font-semibold text-dark-blue transition-all duration-500 hover:bg-caramel active:scale-[0.97]"
            >
              Reservar
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros. (Os `void active/reduce/played` evitam "unused" enquanto a
animação não existe; serão removidos na Task 4.)

- [ ] **Step 3: Checkpoint (sem commit)**

Deixar na working tree.

---

## Task 3: Plugar a seção no `SectionStage`

**Files:**
- Modify: `app/(site)/_components/SectionStage.tsx`

- [ ] **Step 1: Importar o componente**

Adicionar após `import AboutSection from "./AboutSection";`:

```tsx
import ReservasCTA from "./ReservasCTA";
```

- [ ] **Step 2: Adicionar item na roleta**

No array `ITEMS`, adicionar como 4º item:

```tsx
const ITEMS: RouletteItem[] = [
  { id: "inicio", label: "Início" },
  { id: "cardapio", label: "Cardápio" },
  { id: "sobre", label: "Sobre" },
  { id: "reservas", label: "Reservas" },
];
```

- [ ] **Step 3: Adicionar o 4º painel**

Logo após o painel "Sobre" (o `<div className={panelClass}>` que contém
`<AboutSection ... />`), adicionar:

```tsx
        {/* Painel 3 — Reservas (CTA) */}
        <div className={panelClass}>
          <ReservasCTA active={activeIndex === 3} />
        </div>
```

(Nenhuma mudança na lógica de slide nem no voo do prato: o track anima para
`-activeIndex * window.innerHeight` e funciona para 4 painéis; o voo é restrito a
`from/to` 0↔1.)

- [ ] **Step 4: Typecheck + lint**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros.

- [ ] **Step 5: Verificação visual (CDP) — layout estático**

Garantir dev server em `http://localhost:3000` (iniciar via Bash bg se preciso).
Adaptar `scratchpad/about.mjs`: navegar, clicar o botão da roleta cujo texto começa com
"Reservas", `sleep`, screenshot `reservas-static.png` (1440×900).
Abrir o PNG com Read e confirmar:
- roleta agora mostra 4 pills (Início/Cardápio/Sobre/Reservas);
- layout Split: texto/CTA à esquerda sobre caramelo (legível, dark-blue), card de vidro
  à direita sobre área escura;
- cabe em ~1 tela (sem overflow estranho).
Expected: layout correto e legível. (Sem animação ainda.)

- [ ] **Step 6: Checkpoint (sem commit)**

---

## Task 4: Animações — pintura + respingos + entrada elástica

**Files:**
- Modify: `app/(site)/_components/ReservasCTA.tsx`

- [ ] **Step 1: Adicionar o import do gsap e substituir o bloco placeholder**

Primeiro, adicionar o import (logo abaixo de `import { useGSAP } from "@gsap/react";`):

```tsx
import gsap from "gsap";
```

E remover o comentário `// (Na Task 4 adicionamos ...)`.

Depois, trocar este trecho:

```tsx
  // (Animação adicionada na Task 4.)
  void active;
  void reduce;
  void played;
  useGSAP(() => {}, { scope });
```

por:

```tsx
  useGSAP(
    () => {
      // Reduced-motion / seção inativa: o markup já está no estado final; nada a animar.
      if (reduce || !active || played.current) return;
      played.current = true;

      const tl = gsap.timeline();

      // 1) Pintura: revela o caramelo a partir do canto inferior-esquerdo (origem da tinta).
      tl.fromTo(
        ".cta-paint",
        { clipPath: "circle(0% at 22% 78%)", scale: 1.08 },
        {
          clipPath: "circle(150% at 22% 78%)",
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
        },
        0,
      );

      // 2) Respingos ("jogar tinta").
      tl.fromTo(
        ".cta-splatter > *",
        { scale: 0, autoAlpha: 0 },
        {
          scale: 1,
          autoAlpha: 1,
          duration: 0.5,
          stagger: 0.06,
          ease: "back.out(2.5)",
        },
        0.15,
      );

      // 3) Entrada elástica — coluna esquerda entra da esquerda.
      tl.fromTo(
        ".cta-left > *",
        { x: -120, autoAlpha: 0 },
        {
          x: 0,
          autoAlpha: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: "elastic.out(1, 0.75)",
        },
        0.5,
      );

      // Card direito entra da direita.
      tl.fromTo(
        ".cta-card",
        { x: 120, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.75, ease: "elastic.out(1, 0.7)" },
        0.62,
      );
    },
    { scope, dependencies: [reduce, active] },
  );
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros (agora `active/reduce/played` são usados de verdade).

- [ ] **Step 3: Verificação visual (CDP) — sequência da animação**

Com dev server no ar, script CDP: navegar para Início, clicar "Reservas", capturar
**3 frames** com `sleep` diferentes após o clique:
- `reservas-anim-a.png` ~250ms (pintura no meio: círculo caramelo crescendo do canto inf-esq);
- `reservas-anim-b.png` ~700ms (pintura quase completa + elementos começando a entrar);
- `reservas-anim-c.png` ~1600ms (estado final: tudo posicionado).
Abrir os 3 PNGs e confirmar: (a) revelação de tinta a partir do canto inf-esq;
(b) entrada lateral (esquerda/direita) com overshoot elástico; (c) estado final correto.
Expected: as três fases visíveis e coerentes.

- [ ] **Step 4: Checar flash na entrada**

No frame `~a`, confirmar que **não** há um "flash" do estado final antes da animação
(o `fromTo` deve aplicar o estado inicial imediatamente). Se houver flash perceptível,
adicionar um `gsap.set` de estado inicial escondido em um `useGSAP` de mount gated por
`enabled = !reduce` (esconder `.cta-left > *`, `.cta-card`, `.cta-splatter > *` com
`autoAlpha:0` e `.cta-paint` com `clipPath: circle(0%...)`), mantendo reduced-motion no
estado final. Re-verificar.
Expected: sem flash.

- [ ] **Step 5: Checkpoint (sem commit)**

---

## Task 5: Reduced-motion + mobile

**Files:**
- Modify: `app/(site)/_components/ReservasCTA.tsx`

- [ ] **Step 1: Verificar reduced-motion (CDP)**

Rodar CDP com `--force-prefers-reduced-motion=reduce`. Navegar até Reservas.
Screenshot `reservas-rm.png`. Confirmar: **estado final estático** — tinta totalmente
revelada, texto/card/respingos visíveis e legíveis, sem movimento. (O early-return em
`reduce` garante isso, e o markup já nasce no estado final.)
Expected: seção completa e legível, sem animação.

- [ ] **Step 2: Verificar mobile (CDP 390×844)**

`Emulation.setDeviceMetricsOverride` 390×844 mobile. Navegar até Reservas.
Screenshots do topo e após scroll do painel (`reservas-mobile-top.png`,
`reservas-mobile-bottom.png`). Confirmar: colunas empilhadas (texto em cima, card
embaixo), **sem overflow horizontal**, pills da roleta não cobrindo conteúdo (o
`panelClass` tem `pb-24`).

- [ ] **Step 3: Corrigir legibilidade do texto no mobile (se necessário)**

Se no mobile o texto dark-blue da esquerda cair sobre área escura do fundo (baixo
contraste), envolver a coluna esquerda com um backing claro só no mobile. Alterar a
`div.cta-left` para incluir, **apenas em telas pequenas**, um fundo caramelo translúcido
e padding, neutralizado no desktop:

```tsx
        <div className="cta-left rounded-3xl bg-caramel/85 p-6 text-dark-blue backdrop-blur-sm lg:rounded-none lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
```

(Só aplicar se o CDP mostrar baixa leitura; caso contrário, manter a `div.cta-left`
original sem backing.)
Expected: texto legível em mobile e desktop.

- [ ] **Step 4: Typecheck + lint**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros.

- [ ] **Step 5: Checkpoint (sem commit)**

---

## Task 6: Verificação final integrada

**Files:** (nenhum novo; só verificação)

- [ ] **Step 1: Suite de verificação estática**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: ambos limpos.

- [ ] **Step 2: Build de produção (opcional mas recomendado)**

Run: `npm run build`
Expected: build conclui sem erros (a nova seção e a imagem entram no bundle).

- [ ] **Step 3: Fluxo completo no CDP (desktop)**

Navegar Início → Cardápio → Sobre → Reservas usando a roleta, confirmando que:
- a transição para Reservas dispara a animação (pintura + entrada elástica);
- voltar para outra seção e retornar **não** re-dispara indefinidamente de forma
  quebrada (o `played` ref toca uma vez por sessão — comportamento esperado, consistente
  com About/Sakura);
- as demais seções continuam funcionando (voo do prato Início↔Cardápio intacto).
Screenshot final `reservas-final.png`.
Expected: navegação e animações corretas; nenhuma regressão.

- [ ] **Step 4: Relatório ao usuário (sem commit de código)**

Resumir o que foi feito, anexar/descrever screenshots-chave, confirmar tsc/lint/build,
e lembrar que **o código permanece na working tree** para revisão do usuário (política
da branch). Não commitar código.

---

## Notas de verificação (resumo)

- `npx tsc --noEmit` — sem erros.
- `npm run lint` — sem erros.
- `npm run build` — conclui.
- CDP desktop: animação de pintura + entrada elástica + layout Split legível.
- CDP reduced-motion: estado final estático e legível.
- CDP mobile 390×844: stack sem overflow horizontal, texto legível, pills ok.
- Watermark "Magnific" imperceptível.
