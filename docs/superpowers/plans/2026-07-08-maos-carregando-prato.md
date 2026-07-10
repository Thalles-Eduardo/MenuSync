# Mãos carregando o prato — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o prato que voa sozinho por um **grupo "carry"** (prato + duas mãos) onde as mãos sobem de baixo, agarram o prato, carregam-no até o card grande do bento e o soltam — no mesmo scrub do voo atual.

**Architecture:** Dentro do caminho animado do `HomeExperience`, o flyer solto vira um `.carry-group` (posição fixa, `transform-origin: top-left`, tamanho-base fixo em CSS) que **viaja (x/y) e escala** por scrub, de coords absolutas (refresh-safe). O prato (`next/image fill`) e as duas mãos (metades de `public/hands.png` via `background-position`) são filhos: as mãos encolhem junto com o grupo; o "pegar/soltar" é `xPercent`/`yPercent` extra em cada mão. Reaproveita gate/fallback e o fix da troca (`.plate-anchor`).

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, GSAP + @gsap/react (ScrollTrigger), styled-jsx.

**Verificação (sem test runner):** `npm run lint`, `npx tsc --noEmit`, `npm run build` + verificação por **CDP com scroll real** (dev server em `http://localhost:3000`). Usar o mesmo padrão dos scripts de scroll já usados no voo (launch Chrome com `--remote-debugging-port`, `Emulation.setDeviceMetricsOverride` 1440×900 **sem** `--force-prefers-reduced-motion` para o caminho animado; `window.scrollTo` + medir rects via `Runtime.evaluate`; `Page.captureScreenshot`). O fallback é validado com `--force-prefers-reduced-motion`.

---

## File Structure

- Modify: `app/(site)/_components/HomeExperience.tsx` — o caminho animado passa a montar o `.carry-group` (prato + 2 mãos) e a coreografia; estilos das mãos via `<style jsx>`.
- Reuse (sem alteração): `app/(site)/_components/DishPlate.tsx` (`.plate-anchor`/`.plate-img`), `app/(site)/_components/MenuBento.tsx` (`.bento-seat-img`).
- Asset (commitar): `public/hands.png` (already present, untracked) — necessário para a feature.

---

## Task 1: Carry-group + voo por escala (prato dentro do grupo; mãos presentes, ainda estáticas)

**Files:**
- Modify: `app/(site)/_components/HomeExperience.tsx`

- [ ] **Step 1: Substituir o `useGSAP` do caminho animado**

Em `app/(site)/_components/HomeExperience.tsx`, substituir todo o bloco `useGSAP(() => { ... }, { scope: rootRef, dependencies: [enabled, activeDishId] });` por:

```tsx
  useGSAP(
    () => {
      if (!enabled) return;
      const root = rootRef.current;
      if (!root) return;

      const group = root.querySelector<HTMLElement>(".carry-group");
      const heroPlate = root.querySelector<HTMLElement>(".plate-img");
      const plateAnchor = root.querySelector<HTMLElement>(".plate-anchor");
      const seat = root.querySelector<HTMLElement>(".bento-seat-img");
      if (!group || !heroPlate || !plateAnchor || !seat) return;

      // Tamanho-base do grupo (px, definido no CSS). A escala cuida do encolhimento.
      const BASE = 560;

      const rect = (el: HTMLElement) => el.getBoundingClientRect();
      const absTop = (el: HTMLElement) => rect(el).top + window.scrollY;
      const absLeft = (el: HTMLElement) => rect(el).left + window.scrollX;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => "+=" + window.innerHeight,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      const startScroll = () => tl.scrollTrigger?.start ?? 0;
      const endScroll = () => startScroll() + window.innerHeight;

      tl.set(seat, { autoAlpha: 0 }, 0);

      // Handoff de entrada: o prato do hero some, o grupo assume no mesmo lugar.
      tl.fromTo(plateAnchor, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.05, ease: "none" }, 0);
      tl.fromTo(group, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05, ease: "none" }, 0);

      // Carregar: o grupo viaja (x/y absoluto) e escala do tamanho do prato do hero
      // até o tamanho do assento do card. Coords absolutas = à prova de refresh.
      tl.fromTo(
        group,
        {
          x: () => absLeft(heroPlate),
          y: () => absTop(heroPlate) - startScroll(),
          scale: () => rect(heroPlate).width / BASE,
        },
        {
          x: () => absLeft(seat),
          y: () => absTop(seat) - endScroll(),
          scale: () => rect(seat).width / BASE,
          ease: "none",
          duration: 1,
        },
        0,
      );

      // Pouso: revela o prato no card e oculta o grupo (handoff de saída).
      tl.to(seat, { autoAlpha: 1, duration: 0.05, ease: "none" }, 0.95);
      tl.to(group, { autoAlpha: 0, duration: 0.05, ease: "none" }, 0.95);
    },
    { scope: rootRef, dependencies: [enabled, activeDishId] },
  );
```

- [ ] **Step 2: Substituir o JSX do caminho animado (o `return` com `stage-pin`)**

Substituir o bloco `return ( <div ref={rootRef} className="stage-pin ...">...</div> );` (o caminho animado, NÃO o `if (!enabled)` fallback) por:

```tsx
  return (
    <div ref={rootRef} className="stage-pin relative w-full overflow-x-hidden">
      <HeroShowcase dishes={dishes} activeDishId={activeDish.id} onSelectDish={setActiveDishId} />
      <MenuBento activeDish={activeDish} otherDishes={otherDishes} />

      <div className="carry-group pointer-events-none invisible fixed left-0 top-0 z-[60] origin-top-left will-change-transform">
        <Image
          key={activeDish.id}
          src={activeDish.plate}
          alt=""
          aria-hidden="true"
          fill
          sizes="560px"
          className="flying-plate object-contain drop-shadow-2xl"
        />
        <span className="hand hand-left" aria-hidden="true" />
        <span className="hand hand-right" aria-hidden="true" />
      </div>

      <style jsx>{`
        .carry-group {
          width: 560px;
          height: 560px;
        }
        .hand {
          position: absolute;
          width: 62%;
          aspect-ratio: 1 / 1;
          bottom: -6%;
          background-image: url("/hands.png");
          background-repeat: no-repeat;
          background-size: 200% 100%;
          opacity: 0;
          filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.35));
          will-change: transform, opacity;
        }
        .hand-left {
          left: -20%;
          background-position: 0% 50%;
        }
        .hand-right {
          right: -20%;
          background-position: 100% 50%;
        }
      `}</style>
    </div>
  );
```

Nota: o `if (!enabled)` (fallback empilhado) permanece exatamente como está. O `import Image from "next/image"` já existe no arquivo.

- [ ] **Step 3: Lint + typecheck + build**

Run: `npm run lint && npx tsc --noEmit && npm run build`
Expected: sem erros; build "Compiled successfully". (Se o eslint reclamar de `@next/next/no-img-element`, não se aplica — usamos `next/image`. `styled-jsx` é suportado no App Router para client components.)

- [ ] **Step 4: Verificação CDP — o prato ainda voa e pousa alinhado (mãos ainda invisíveis)**

Com o dev server rodando, num Chrome headless com remote debugging (1440×900, **sem** reduced-motion), navegar para `http://localhost:3000/`, esperar ~5s, e para `y` em `[0, 225, 450, 675, 900]`: `window.scrollTo(0,y)`, esperar ~450ms, medir com `Runtime.evaluate` os rects/opacity de `.carry-group`, `.flying-plate` (ou a `img` dentro do grupo), `.bento-seat-img`; capturar screenshot. Confirmar:
- em `y=0`: prato do hero visível; grupo alinhado ao prato do hero.
- durante o scroll: o grupo/prato viaja e **encolhe** (scale) descendo até o card.
- em `y=900`: `.bento-seat-img` visível (op≈1) no assento e o grupo oculto — **prato pousado alinhado**.
Se o pouso estiver desalinhado, ajustar `BASE` e conferir que `scale = seatWidth/BASE` e as coords absolutas batem (mesma técnica do voo).

- [ ] **Step 5: Verificação de fallback (reduced-motion)**

Rodar um screenshot full-page com `--force-prefers-reduced-motion` e confirmar hero + bento empilhados, sem grupo/mãos, layout íntegro.

- [ ] **Step 6: Commit**

```bash
git add "app/(site)/_components/HomeExperience.tsx" "public/hands.png"
git commit -m "feat(home): carry-group (prato + mãos) — voo por escala substitui o flyer"
```
(Terminar a mensagem com o trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` via heredoc. `public/hands.png` é o asset necessário para a feature.)

---

## Task 2: Coreografia das mãos (pegar → carregar → soltar) + ajuste ao vivo

**Files:**
- Modify: `app/(site)/_components/HomeExperience.tsx`

- [ ] **Step 1: Consultar as mãos e adicionar os tweens de gesto**

No `useGSAP` (Task 1), logo após a linha `if (!group || !heroPlate || !plateAnchor || !seat) return;`, adicionar as consultas das mãos:

```tsx
      const handL = root.querySelector<HTMLElement>(".hand-left");
      const handR = root.querySelector<HTMLElement>(".hand-right");
      if (!handL || !handR) return;
```

E, **antes** dos dois tweens de pouso (`tl.to(seat, ...0.95)` / `tl.to(group, ...0.95)`), adicionar a coreografia das mãos:

```tsx
      // Pegar: mãos sobem de baixo + convergem + aparecem (0.05 → 0.18).
      tl.fromTo(
        handL,
        { yPercent: 60, xPercent: -22, autoAlpha: 0 },
        { yPercent: 0, xPercent: 0, autoAlpha: 1, ease: "power2.out", duration: 0.13 },
        0.05,
      );
      tl.fromTo(
        handR,
        { yPercent: 60, xPercent: 22, autoAlpha: 0 },
        { yPercent: 0, xPercent: 0, autoAlpha: 1, ease: "power2.out", duration: 0.13 },
        0.05,
      );

      // Soltar: mãos afastam + descem + somem (0.82 → 0.95).
      tl.to(handL, { yPercent: 65, xPercent: -30, autoAlpha: 0, ease: "power2.in", duration: 0.13 }, 0.82);
      tl.to(handR, { yPercent: 65, xPercent: 30, autoAlpha: 0, ease: "power2.in", duration: 0.13 }, 0.82);
```

(As mãos são filhas do grupo → já viajam e escalam junto durante o "carregar". `xPercent`/`yPercent` são relativos ao próprio tamanho da mão, independentes da escala do grupo.)

- [ ] **Step 2: Lint + typecheck + build**

Run: `npm run lint && npx tsc --noEmit && npm run build`
Expected: sem erros.

- [ ] **Step 3: Ajuste fino ao vivo (CDP, scroll real) — pegar → carregar → soltar**

Capturar frames em `y` ≈ `[0, 120, 250, 450, 700, 820, 900]` (progress ~0 / 0.13 / 0.28 / 0.5 / 0.78 / 0.91 / 1.0) e inspecionar:
- **pegar (~0.05–0.18):** mãos surgem de baixo e convergem; os dedos "abraçam" as bordas do prato. Ajustar em `<style jsx>`: `.hand` `width` (62%), `bottom` (-6%), `.hand-left/right` `left/right` (-20%), e nos tweens `xPercent`/`yPercent` de entrada, até o enquadramento ficar natural.
- **carregar (~0.18–0.82):** mãos+prato descem juntos e encolhem; sem "escorregar" relativo entre mão e prato (se escorregar, o gesto de entrada deve terminar até ~0.18).
- **soltar (~0.82–0.95):** mãos afastam, descem e somem; o prato assenta no card sem "pulo".
- **pouso:** conferir que o prato pousado (`.bento-seat-img`) fica alinhado (não regrediu vs. Task 1).
Iterar os valores (CSS + pontos de tempo `0.05` / `0.18` / `0.82` / `0.95`) até fluido. Repetir os frames-chave após cada ajuste.

- [ ] **Step 4: Confirmar em todos os pratos (troca no carrossel)**

Via CDP: no topo, clicar `.dish-thumb button` índices 1, 2, 3; para cada, rolar a `y≈450` e confirmar que **mãos + prato aparecem e viajam** (prato visível no topo — regressão do fix `.plate-anchor` intacta) e pousam no card. (Mesma checagem usada no fix da troca.)

- [ ] **Step 5: Screenshot de fallback (reduced-motion)**

Confirmar novamente hero + bento empilhados sem mãos (o caminho animado não afeta o fallback).

- [ ] **Step 6: Commit**

```bash
git add "app/(site)/_components/HomeExperience.tsx"
git commit -m "feat(home): mãos pegam, carregam e soltam o prato no bento"
```

---

## Self-Review

**Spec coverage:**
- Mãos partidas (2 metades de `hands.png` via `background-position`) → Task 1 Step 2 (`<style jsx>`). ✓
- `.carry-group` (prato + 2 mãos) viaja e escala; mãos encolhem junto → Task 1 Steps 1–2. ✓
- Coreografia pegar (subir+convergir) / carregar / soltar (afastar+descer) → Task 2 Step 1. ✓
- Vêm de baixo (yPercent positivo no `from`/`to`) → Task 2 Step 1. ✓
- Reuso do gate/fallback e do fix `.plate-anchor` → Task 1 Step 1 (`plateAnchor` fromTo) + `if (!enabled)` intacto. ✓
- Estilo lúdico + sombra de contato (drop-shadow no prato e nas mãos) → Task 1 Step 2. ✓
- Mãos decorativas (`aria-hidden`, `pointer-events-none`) → Task 1 Step 2. ✓
- Verificação lint/tsc/build + CDP + fallback + todos os pratos → ambas as tasks. ✓

**Placeholder scan:** sem TBD/TODO; todo código completo. Valores de enquadramento (percentuais/tempos) são **pontos de partida concretos** com etapa de ajuste ao vivo explícita (Task 2 Step 3) — natureza do efeito visual, como no voo.

**Type consistency:** seletores `.carry-group`, `.flying-plate`, `.hand-left`, `.hand-right`, `.plate-anchor`, `.plate-img`, `.bento-seat-img` definidos no JSX/CSS do Task 1 e consumidos pelo JS dos Tasks 1–2. `BASE=560` usado consistentemente nas duas escalas (from `heroPlate.width/BASE`, to `seat.width/BASE`). `tl` declarado antes de `startScroll`/`endScroll` (que só o acessam quando chamados no refresh).

**Riscos (do spec §10):** re-alinhamento do pouso (Task 1 Step 4), enquadramento das mãos (Task 2 Step 3), peso visual/tempos (Task 2 Step 3), nitidez do bg-image ampliado (conferir no Step 3; se preciso, asset maior fica fora do escopo).
