# Timeline radial (dial) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) ou superpowers:executing-plans. Steps usam checkbox (`- [ ]`).

**Goal:** Substituir a linha do tempo vertical da seção "Sobre" por um **dial radial** interativo por clique (radio + `:has()`, CSS puro), com 11 marcos, tema dark, contido na seção.

**Architecture:** Drop-in no nível do `Timeline.tsx` — `AboutSection.tsx` não muda (já renderiza `<Timeline/>`). Expando `MILESTONES` para 11 em `about-data.ts`; reescrevo `Timeline.tsx` com a estrutura radial (radio+label+h2+p por item); crio `Timeline.module.css` com o layout radial adaptado (dark + salmon, `position: relative`, sem `@import` externo, regras `--index` para 11 itens).

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS Modules (`:has()`, custom properties). Sem GSAP/JS de interação.

**Verificação (sem test runner):** `npm run lint`, `npx tsc --noEmit`, `npm run build` + screenshot **CDP** (estado inicial + após `.click()` num radio via `Runtime.evaluate` para ver a rotação/reveal). Ajuste fino do enquadramento radial **ao vivo** (via CDP). Fallback com `--force-prefers-reduced-motion`.

---

## File Structure

- Modify: `app/(site)/_components/about/about-data.ts` — `MILESTONES` passa a 11 itens.
- Modify: `app/(site)/_components/about/Timeline.tsx` — reescrito como dial radial.
- Create: `app/(site)/_components/about/Timeline.module.css` — estilos radiais.
- Reuse (sem alteração): `app/(site)/_components/AboutSection.tsx` (continua `import Timeline` + `<Timeline/>`).

---

## Task 1: Dados (11 marcos) + dial radial (Timeline.tsx + Timeline.module.css)

**Files:**
- Modify: `app/(site)/_components/about/about-data.ts`
- Modify: `app/(site)/_components/about/Timeline.tsx`
- Create: `app/(site)/_components/about/Timeline.module.css`

- [ ] **Step 1: Expandir `MILESTONES` em `about-data.ts`**

Substituir o array `MILESTONES` (mantendo o `type Milestone` e o `PLACE` como estão) por:

```ts
export const MILESTONES: Milestone[] = [
  { year: "2009", title: "Fundação", text: "Abrimos as portas na Liberdade, o coração japonês de São Paulo." },
  { year: "2010", title: "Balcão de sushi", text: "Instalamos o balcão de sushi à vista, com o sushiman preparando na hora." },
  { year: "2012", title: "Nasce o teishoku", text: "Criamos o teishoku da casa — a combinação que virou nossa assinatura." },
  { year: "2013", title: "Primeiro reconhecimento", text: "Entramos na lista dos melhores pratos japoneses da cidade." },
  { year: "2015", title: "Forno robata", text: "Chega a grelha robata, e com ela os pratos na brasa." },
  { year: "2017", title: "Reforma e ampliação", text: "Um salão maior e mais aconchegante, sem perder a alma izakaya." },
  { year: "2019", title: "Menu vegetariano", text: "Lançamos uma seleção vegetariana sazonal, com produtos do dia." },
  { year: "2021", title: "Menu autoral", text: "Nosso novo sushiman-chefe assina uma seleção autoral de temporada." },
  { year: "2022", title: "Delivery próprio", text: "Levamos a experiência da casa até você, com entrega própria." },
  { year: "2024", title: "Noites de omakasê", text: "Estreamos as noites de omakasê — o chef decide, você se surpreende." },
  { year: "2025", title: "MenuSync", text: "Levamos a casa para o digital, do cardápio à reserva." },
];
```

- [ ] **Step 2: Criar `app/(site)/_components/about/Timeline.module.css`**

```css
/* Timeline radial (dial) — adaptado do CodePen cbolson/rNEdgKo: tema dark, contido na seção,
   sem @import externo. Interação por radio + :has() (CSS puro). */

.cardsContainer {
  --full-circle: 360deg;
  --radius: 40vw;
  --duration: 200ms;

  --cards-container-size: calc(var(--radius) * 2);
  --cards-container-padding: 2rem;

  --border-color: rgba(255, 255, 255, 0.08);

  --label-offset: calc(var(--radius) * -1 - 1rem);
  --label-size: 30px;
  --label-color: rgba(255, 255, 255, 0.55);
  --label-color-hover: #e05a5a;
  --label-line-h: 0;
  --label-line-h-current: 2rem;
  --label-dot-size: 10px;

  --title-top: 1.5rem;
  --title-offset-y: 30px;

  --info-top: 7rem;
  --info-width: min(80%, 460px);
  --info-offset-y: 30px;

  box-sizing: content-box;
  position: relative;
  width: var(--cards-container-size);
  height: var(--cards-container-size);
  margin: 2rem auto calc(var(--radius) * -1 + 2rem);
  padding: var(--cards-container-padding);
  clip-path: polygon(0 0, 100% 0, 100% 50%, 0 50%);
}

@media (min-width: 800px) {
  .cardsContainer {
    --radius: 26vw;
    --label-size: 40px;
    --label-dot-size: 14px;
    --label-line-h-current: 3.5rem;
    --title-top: 3rem;
    --info-top: 7rem;
  }
}
@media (min-width: 1200px) {
  .cardsContainer {
    --radius: 22vw;
    --label-size: 46px;
    --border-color: rgba(255, 255, 255, 0.12);
  }
}

.cardsContainer input[type="radio"] {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.cards {
  position: absolute;
  inset: var(--cards-container-padding);
  aspect-ratio: 1;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  transition: transform 0.3s ease-in-out var(--duration);
  list-style: none;
  margin: 0;
  padding: 0;
}

.cards li {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 0;
  transform-origin: center;
  display: grid;
  place-content: center;
  transform: rotate(calc(var(--i) * 360deg / var(--items)));
  pointer-events: none;
}

.cards li > label {
  position: absolute;
  inset: 0;
  margin: auto;
  transform: translateY(var(--label-offset));
  width: var(--label-size);
  height: var(--label-size);
  cursor: pointer;
  pointer-events: initial;
  text-align: center;
  color: var(--label-color);
  font-size: clamp(0.8rem, 2.5vw + 0.04rem, 1rem);
  transition: var(--duration) ease-in-out;
}
.cards li > label::before {
  content: "";
  position: absolute;
  top: var(--cards-container-padding);
  left: 50%;
  translate: -50% 0;
  width: var(--label-dot-size);
  height: var(--label-dot-size);
  border-radius: 50%;
  background-color: var(--label-color);
  transition: background-color var(--duration) ease-in-out;
}
.cards li > label::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  translate: -50% 5px;
  width: 2px;
  height: var(--label-line-h);
  background-color: #e05a5a;
  transition: height 300ms ease-in-out var(--label-line-delay, 0ms);
}
.cards li > label:hover {
  --label-color: var(--label-color-hover);
}

.cards > li > h2,
.cards > li > p {
  position: absolute;
  left: 50%;
  text-align: center;
  transform: translate(-50%, 0);
  transform-origin: center;
  color: #fff;
}
.cards > li > h2 {
  top: var(--title-top);
  margin: 0;
  opacity: var(--title-opacity, 0);
  translate: 0 var(--title-offset-y);
  transition: var(--duration) ease-in-out var(--title-delay, 0ms);
  font-family: var(--font-eczar), serif;
  font-size: clamp(2rem, 5vw, 3rem);
}
.cards > li > p {
  top: var(--info-top);
  margin: 0 auto;
  width: var(--info-width);
  z-index: 2;
  font-size: clamp(0.85rem, 2.5vw + 0.05rem, 1rem);
  text-align: center;
  text-wrap: pretty;
  color: rgba(255, 255, 255, 0.75);
  opacity: var(--info-opacity, 0);
  translate: 0 var(--info-offset-y);
  transition: var(--duration) ease-in-out var(--info-delay, 0ms);
}
.itemTitle {
  display: block;
  margin-bottom: 0.4rem;
  color: #f4c15b;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.cards li:has(input:checked) {
  --label-color: var(--label-color-hover);
  --label-line-h: var(--label-line-h-current);
  --label-line-delay: calc(var(--duration) * 2);
  --title-opacity: 1;
  --title-offset-y: 0;
  --title-delay: calc(var(--duration) * 3);
  --info-opacity: 1;
  --info-offset-y: 0;
  --info-delay: calc(var(--duration) * 4);
}

.cards:has(input:checked) {
  transform: rotate(calc(0deg - (var(--index) * var(--full-circle) / var(--items))));
}
.cards:has(li:nth-child(1) > input:checked) { --index: 0; }
.cards:has(li:nth-child(2) > input:checked) { --index: 1; }
.cards:has(li:nth-child(3) > input:checked) { --index: 2; }
.cards:has(li:nth-child(4) > input:checked) { --index: 3; }
.cards:has(li:nth-child(5) > input:checked) { --index: 4; }
.cards:has(li:nth-child(6) > input:checked) { --index: 5; }
.cards:has(li:nth-child(7) > input:checked) { --index: 6; }
.cards:has(li:nth-child(8) > input:checked) { --index: 7; }
.cards:has(li:nth-child(9) > input:checked) { --index: 8; }
.cards:has(li:nth-child(10) > input:checked) { --index: 9; }
.cards:has(li:nth-child(11) > input:checked) { --index: 10; }

@media (prefers-reduced-motion: reduce) {
  .cards,
  .cards li > label,
  .cards li > label::before,
  .cards li > label::after,
  .cards > li > h2,
  .cards > li > p {
    transition: none !important;
  }
}
```

- [ ] **Step 3: Reescrever `app/(site)/_components/about/Timeline.tsx`**

Substituir todo o conteúdo por:

```tsx
import type { CSSProperties } from "react";
import styles from "./Timeline.module.css";
import { MILESTONES } from "./about-data";

export default function Timeline() {
  return (
    <div
      className={styles.cardsContainer}
      style={{ "--items": MILESTONES.length } as CSSProperties}
      aria-label="Linha do tempo do restaurante"
    >
      <ul className={styles.cards}>
        {MILESTONES.map((m, i) => (
          <li key={m.year} style={{ "--i": i } as CSSProperties}>
            <input
              type="radio"
              id={`about-tl-${i}`}
              name="about-timeline"
              defaultChecked={i === 0}
            />
            <label htmlFor={`about-tl-${i}`}>{m.year}</label>
            <h2>{m.year}</h2>
            <p>
              <span className={styles.itemTitle}>{m.title}</span>
              {m.text}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

Nota: o componente ficou **estático** (sem hooks/`window`), então não precisa de `"use client"` — renderiza no server com o primeiro item já `checked`. `AboutSection.tsx` continua igual (já faz `import Timeline` + `<Timeline/>`).

- [ ] **Step 4: Lint + typecheck + build**

Run: `npm run lint && npx tsc --noEmit && npm run build`
Expected: sem erros. (Os custom props inline usam `as CSSProperties`. CSS Modules com `:has()` e `nth-child` compilam normalmente — `.cards`/`.cardsContainer`/`.itemTitle` são hasheados; seletores de elemento não.)

- [ ] **Step 5: Screenshot CDP — estado inicial**

Com o dev server rodando, screenshot full-page (script `scratchpad/shot.mjs`). Confirmar na seção "Sobre": o **dial radial** com o arco de anos (2009…2025) no topo e o marco **2009** selecionado no centro (ano grande + título salmon/amarelo + texto). Sem overlay cobrindo o resto da página.

- [ ] **Step 6: Verificação CDP — rotação ao clicar**

Via CDP (`Runtime.evaluate`): `document.querySelector('#about-tl-7').click()` (marco 2021), esperar ~600ms, screenshot. Confirmar que a **roda girou** trazendo 2021 ao topo/centro e revelando seu conteúdo; o rótulo selecionado destaca (salmon) + linha conectora. Repetir com outro índice.

- [ ] **Step 7: Ajuste fino ao vivo (iterativo)**

Se o dial não couber bem na seção (muito alto/baixo, rótulos cortados, texto central sobreposto), ajustar em `Timeline.module.css`: `--radius` por breakpoint, a `margin` (inclusive o negativo que reclama a metade inferior clipada), `--info-top`/`--info-width`, `--label-offset`, `clip-path`. Repetir Steps 5–6 até enquadrar bem no desktop e no mobile (`--window-size` estreito).

- [ ] **Step 8: Screenshot de fallback (reduced-motion)**

Screenshot com `--force-prefers-reduced-motion`: o dial aparece e é utilizável, sem animação de rotação (troca instantânea); conteúdo do item selecionado visível.

- [ ] **Step 9: Commit**

```bash
git add "app/(site)/_components/about/about-data.ts" "app/(site)/_components/about/Timeline.tsx" "app/(site)/_components/about/Timeline.module.css"
git commit -m "feat(home): timeline radial (dial por clique) substitui a vertical"
```
(Trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` via heredoc.)

---

## Self-Review

**Spec coverage:**
- Substituir vertical pelo dial radial (drop-in em Timeline.tsx) → Task 1 Step 3. ✓
- 11 marcos em about-data.ts → Task 1 Step 1. ✓
- CSS puro radio + `:has()` via CSS Module → Task 1 Steps 2–3. ✓
- Interação por clique, primeiro `checked` por padrão → Task 1 Step 3 (`defaultChecked={i===0}`). ✓
- Tema dark + salmon, contido (`position: relative`, sem `@import`) → Task 1 Step 2. ✓
- Título em destaque + texto no centro → Task 1 Step 2 (`.itemTitle`) + Step 3. ✓
- Regras `--index` para 11 itens → Task 1 Step 2. ✓
- Degradação reduced-motion → Task 1 Step 2 (`@media`) + Step 8. ✓
- Radios acessíveis (escondidos por clip, não display:none; labels com htmlFor) → Task 1 Steps 2–3. ✓
- Verificação lint/tsc/build + CDP (inicial + clique) + ajuste ao vivo + fallback → Steps 4–8. ✓

**Placeholder scan:** sem TBD/TODO; código completo. Marcos fictícios são intencionais (spec §9). Valores radiais têm etapa de ajuste ao vivo explícita (Step 7).

**Type consistency:** `Milestone`/`MILESTONES` intactos (só o array cresce); `Timeline` consome `MILESTONES`; classes do módulo (`cardsContainer`, `cards`, `itemTitle`) referenciadas via `styles.*`; `--items`/`--i`/`--index` coerentes entre TSX (inline) e CSS. `AboutSection` inalterado (mesma interface de `<Timeline/>`).

**Riscos (spec §9):** enquadramento radial (Step 7, ao vivo); `:has()` com hash do módulo (validado no build/CDP — Steps 4–6); legibilidade do texto central (ajuste de `--info-width`/tamanhos no Step 7).
