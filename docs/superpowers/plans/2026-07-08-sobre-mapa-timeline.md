# Seção "Sobre" (história + timeline + mapa) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Ao implementar UI, use também a skill de design front-end.

**Goal:** Adicionar a seção "Sobre" abaixo do bento: história, linha do tempo vertical animada e um mapa interativo (Leaflet + OpenStreetMap dark) apontando o restaurante na Liberdade.

**Architecture:** `AboutSection.tsx` (client) monta cabeçalho + história (reveal por scroll), a `Timeline.tsx` (linha central que "desenha" + marcos entrando) e um bloco de localização com o `RestaurantMap.tsx` (react-leaflet, carregado via `next/dynamic` `ssr:false`) + card de endereço/horário. Dados em `about/about-data.ts`. GSAP/ScrollTrigger já usados; degradação com `prefers-reduced-motion`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, GSAP + @gsap/react, Leaflet + react-leaflet.

**Verificação (sem test runner):** cada task valida com `npm run lint`, `npx tsc --noEmit`, `npm run build` e screenshot **CDP full-page** (script `scratchpad/shot.mjs` já existente; launch Chrome com `--remote-debugging-port`, `Page.getLayoutMetrics` + `captureBeyondViewport`). Os tiles do mapa vêm da rede — em headless podem não carregar; validar layout/placeholder/card e confirmar o mapa **ao vivo**. Fallback com `--force-prefers-reduced-motion`.

---

## File Structure

- Create: `app/(site)/_components/about/about-data.ts` — `MILESTONES` + `PLACE`.
- Create: `app/(site)/_components/AboutSection.tsx` — seção (história + reveal + slot da timeline + bloco de localização).
- Create: `app/(site)/_components/about/Timeline.tsx` — linha do tempo animada.
- Create: `app/(site)/_components/about/RestaurantMap.tsx` — mapa Leaflet client-only.
- Modify: `app/(site)/page.tsx` — monta `<AboutSection />` após `<HomeExperience />`.
- Deps: `leaflet`, `react-leaflet` (React 19 → react-leaflet v5), `@types/leaflet` (dev).

---

## Task 1: Deps + dados + AboutSection base (história + reveal + card de localização) + montagem

**Files:**
- Create: `app/(site)/_components/about/about-data.ts`
- Create: `app/(site)/_components/AboutSection.tsx`
- Modify: `app/(site)/page.tsx`

- [ ] **Step 1: Instalar dependências**

Run: `npm install leaflet react-leaflet && npm install -D @types/leaflet`
Expected: instala sem erro de peer deps (react-leaflet v5 suporta React 19). Se `react-leaflet` reclamar de peer, usar `npm install react-leaflet@^5 leaflet`.

- [ ] **Step 2: Criar `app/(site)/_components/about/about-data.ts`**

```ts
export type Milestone = { year: string; title: string; text: string };

export const MILESTONES: Milestone[] = [
  { year: "2009", title: "Fundação", text: "Abrimos as portas na Liberdade, o coração japonês de São Paulo." },
  { year: "2013", title: "Primeiro reconhecimento", text: "O teishoku da casa entra na lista dos melhores pratos japoneses da cidade." },
  { year: "2017", title: "Reforma e ampliação", text: "Um salão maior e um balcão de sushi à vista de todos." },
  { year: "2021", title: "Menu autoral", text: "Nosso novo sushiman-chefe assina uma seleção autoral de temporada." },
  { year: "2025", title: "MenuSync", text: "Levamos a experiência da casa para o digital — do cardápio à reserva." },
];

export type Place = {
  name: string;
  address: string;
  hours: string;
  coords: [number, number];
};

export const PLACE: Place = {
  name: "MenuSync",
  address: "Rua dos Estudantes, 123 — Liberdade, São Paulo — SP",
  hours: "Terça a domingo, 18h às 23h",
  coords: [-23.5589, -46.6347],
};
```

- [ ] **Step 3: Criar `app/(site)/_components/AboutSection.tsx`** (com slots da timeline e do mapa como placeholders — preenchidos nas Tasks 2 e 3)

```tsx
"use client";

import { useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { PLACE } from "./about/about-data";

gsap.registerPlugin(ScrollTrigger);

export default function AboutSection() {
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
      gsap.from(".about-reveal", {
        scrollTrigger: { trigger: scope.current, start: "top 75%", once: true },
        y: 28,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: "power3.out",
      });
    },
    { scope },
  );

  return (
    <section
      ref={scope}
      className="about-section relative overflow-hidden px-8 py-24 text-white md:px-12 lg:py-28"
      style={{ backgroundColor: "var(--color-dark-blue)" }}
      aria-label="Sobre o restaurante"
    >
      <div className="mx-auto max-w-6xl">
        <p className="about-reveal text-sm font-semibold tracking-[0.25em] text-yellow uppercase">
          Nossa história
        </p>
        <h2
          className="about-reveal mt-2 text-4xl font-bold md:text-6xl"
          style={{ fontFamily: "var(--font-eczar), serif" }}
        >
          Tradição japonesa em São Paulo
        </h2>

        <div className="about-reveal mt-8 max-w-2xl space-y-4 text-white/80">
          <p>
            Desde 2009, na Liberdade, servimos a cozinha japonesa como um ritual: ingredientes
            frescos, técnica precisa e a hospitalidade de quem trata cada prato como uma
            apresentação.
          </p>
          <p>
            Do balcão de sushi à cozinha quente, cada receita carrega uma história — a mesma que
            contamos aqui, ano após ano.
          </p>
        </div>

        {/* Timeline entra na Task 2 (entre a história e a localização). */}

        <div className="mt-20 grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="about-map-slot h-[360px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40 md:h-[420px]">
            {/* RestaurantMap entra na Task 3. */}
            <div className="flex h-full w-full items-center justify-center text-white/40">Mapa</div>
          </div>

          <aside className="about-reveal flex flex-col justify-center gap-6 rounded-2xl border border-white/10 bg-white/[0.04] p-8">
            <div>
              <p className="text-sm font-semibold tracking-wide text-yellow uppercase">Onde estamos</p>
              <p className="mt-2 text-lg" style={{ fontFamily: "var(--font-eczar), serif" }}>
                {PLACE.address}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-yellow uppercase">Horário</p>
              <p className="mt-2 text-lg">{PLACE.hours}</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Montar em `app/(site)/page.tsx`**

Substituir o conteúdo por:

```tsx
import HomeExperience from "./_components/HomeExperience";
import AboutSection from "./_components/AboutSection";
import Loader from "./_components/Loader";
import { dishes } from "./_data/dishes";

export default function SiteHome() {
  return (
    <>
      <Loader />
      <HomeExperience dishes={dishes} />
      <AboutSection />
    </>
  );
}
```

- [ ] **Step 5: Lint + typecheck + build**

Run: `npm run lint && npx tsc --noEmit && npm run build`
Expected: sem erros.

- [ ] **Step 6: Screenshot CDP (layout da seção)**

Com o dev server rodando, tirar o screenshot full-page (script `scratchpad/shot.mjs`). Confirmar abaixo do bento: eyebrow "Nossa história" + título Eczar, 2 parágrafos, e o bloco de localização (placeholder "Mapa" + card com endereço/horário). Fundo `--color-dark-blue`.

- [ ] **Step 7: Commit**

```bash
git add "app/(site)/_components/about/about-data.ts" "app/(site)/_components/AboutSection.tsx" "app/(site)/page.tsx" package.json package-lock.json
git commit -m "feat(home): seção Sobre — base (história + localização) + deps leaflet"
```
(Terminar com trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` via heredoc. `package.json`/`package-lock.json` entram por causa das deps novas.)

---

## Task 2: Timeline vertical animada

**Files:**
- Create: `app/(site)/_components/about/Timeline.tsx`
- Modify: `app/(site)/_components/AboutSection.tsx`

- [ ] **Step 1: Criar `app/(site)/_components/about/Timeline.tsx`**

```tsx
"use client";

import { useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MILESTONES } from "./about-data";

gsap.registerPlugin(ScrollTrigger);

export default function Timeline() {
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
      gsap.fromTo(
        ".tl-progress",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: scope.current,
            start: "top 70%",
            end: "bottom 75%",
            scrub: true,
          },
        },
      );
      gsap.utils.toArray<HTMLElement>(".tl-item").forEach((item) => {
        gsap.from(item, {
          scrollTrigger: { trigger: item, start: "top 82%", once: true },
          y: 30,
          opacity: 0,
          scale: 0.96,
          duration: 0.6,
          ease: "power3.out",
        });
      });
    },
    { scope },
  );

  return (
    <div ref={scope} className="relative mx-auto mt-20 max-w-4xl">
      {/* trilho central (esquerda no mobile, centro no desktop) */}
      <div className="pointer-events-none absolute top-0 bottom-0 left-4 w-px bg-white/15 md:left-1/2 md:-translate-x-1/2">
        <div className="tl-progress absolute inset-0 origin-top bg-salmon" />
      </div>

      <ul className="space-y-14">
        {MILESTONES.map((m, i) => {
          const right = i % 2 === 1;
          return (
            <li key={m.year} className="tl-item relative md:grid md:grid-cols-2">
              <div
                className={`pl-12 md:pl-0 ${
                  right ? "md:col-start-2 md:pl-10 md:text-left" : "md:col-start-1 md:pr-10 md:text-right"
                }`}
              >
                <p className="text-2xl font-bold text-yellow" style={{ fontFamily: "var(--font-eczar), serif" }}>
                  {m.year}
                </p>
                <h3 className="mt-1 text-xl font-semibold">{m.title}</h3>
                <p className="mt-1 text-white/70">{m.text}</p>
              </div>
              <span className="absolute top-1 left-4 -translate-x-1/2 md:left-1/2">
                <span
                  className="block h-4 w-4 rounded-full border-2 border-salmon"
                  style={{ backgroundColor: "var(--color-dark-blue)" }}
                />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Inserir a Timeline na AboutSection**

Em `app/(site)/_components/AboutSection.tsx`, adicionar o import no topo:
```tsx
import Timeline from "./about/Timeline";
```
E substituir o comentário `{/* Timeline entra na Task 2 ... */}` por:
```tsx
        <Timeline />
```

- [ ] **Step 3: Lint + typecheck + build**

Run: `npm run lint && npx tsc --noEmit && npm run build`
Expected: sem erros.

- [ ] **Step 4: Screenshot CDP (timeline)**

Screenshot full-page **com `--force-prefers-reduced-motion`** (para o layout estático aparecer sem depender do scrub): confirmar os 5 marcos (2009…2025) alternando os lados no desktop com o trilho central e os nós na linha; e, com `--window-size` estreito, empilhados à esquerda no mobile. Ajustar posição dos nós/`col-start` se algum nó não cair sobre a linha.

- [ ] **Step 5: Verificação ao vivo do "desenho"**

Abrir `http://localhost:3000/` sem reduced-motion, rolar até a timeline e confirmar: a linha salmon **cresce** conforme rola e cada marco entra com *pop*.

- [ ] **Step 6: Commit**

```bash
git add "app/(site)/_components/about/Timeline.tsx" "app/(site)/_components/AboutSection.tsx"
git commit -m "feat(home): linha do tempo animada na seção Sobre"
```

---

## Task 3: Mapa interativo (Leaflet, client-only)

**Files:**
- Create: `app/(site)/_components/about/RestaurantMap.tsx`
- Modify: `app/(site)/_components/AboutSection.tsx`

- [ ] **Step 1: Criar `app/(site)/_components/about/RestaurantMap.tsx`**

```tsx
"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PLACE } from "./about-data";

const pinIcon = L.divIcon({
  className: "",
  html: '<span class="map-pin"><span class="map-pin-ring"></span><span class="map-pin-dot"></span></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -10],
});

export default function RestaurantMap() {
  return (
    <>
      <MapContainer
        center={PLACE.coords}
        zoom={16}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ backgroundColor: "#1a1c22" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />
        <Marker position={PLACE.coords} icon={pinIcon}>
          <Popup>
            <strong>{PLACE.name}</strong>
            <br />
            {PLACE.address}
          </Popup>
        </Marker>
      </MapContainer>

      <style jsx global>{`
        .map-pin {
          position: relative;
          display: block;
          width: 24px;
          height: 24px;
        }
        .map-pin-dot {
          position: absolute;
          inset: 8px;
          border-radius: 9999px;
          background: #e05a5a;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6);
        }
        .map-pin-ring {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: rgba(224, 90, 90, 0.45);
          animation: mapPulse 1.8s ease-out infinite;
        }
        @keyframes mapPulse {
          0% {
            transform: scale(0.5);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.7);
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .map-pin-ring {
            animation: none;
          }
        }
        .leaflet-container {
          font-family: inherit;
        }
        .leaflet-popup-content-wrapper,
        .leaflet-popup-tip {
          background: #20232b;
          color: #fff;
        }
      `}</style>
    </>
  );
}
```

Nota: usamos **apenas `L.divIcon`** (nenhum marker PNG default), o que evita o bug do ícone quebrado do Leaflet com bundlers.

- [ ] **Step 2: Integrar o mapa (dynamic, ssr:false) na AboutSection**

Em `app/(site)/_components/AboutSection.tsx`, adicionar no topo (após os imports existentes):
```tsx
import dynamic from "next/dynamic";

const RestaurantMap = dynamic(() => import("./about/RestaurantMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-white/40">
      Carregando mapa…
    </div>
  ),
});
```
E substituir o conteúdo do `about-map-slot` (o `<div className="flex h-full ...">Mapa</div>`) por:
```tsx
            <RestaurantMap />
```

- [ ] **Step 3: Lint + typecheck + build (SSR-safe)**

Run: `npm run lint && npx tsc --noEmit && npm run build`
Expected: sem erros — crucialmente **sem `window is not defined`** no build/prerender (o mapa só carrega no cliente via `ssr:false`).

- [ ] **Step 4: Verificação CDP (layout com placeholder/mapa)**

Screenshot full-page. Em headless os tiles podem não carregar; confirmar que o container do mapa aparece (fundo escuro/placeholder) e o card de endereço/horário está íntegro, sem erro de layout/console fatal.

- [ ] **Step 5: Verificação AO VIVO do mapa (manual)**

Abrir `http://localhost:3000/` num navegador real, rolar até "Sobre" e confirmar: mapa dark carrega os tiles, centrado na Liberdade; marcador salmon **pulsando**; clicar abre o popup "MenuSync — endereço"; arrastar move o mapa; a roda do mouse **não** dá zoom (não sequestra o scroll); botões +/- dão zoom; atribuição OSM/CARTO visível.

- [ ] **Step 6: Commit**

```bash
git add "app/(site)/_components/about/RestaurantMap.tsx" "app/(site)/_components/AboutSection.tsx"
git commit -m "feat(home): mapa interativo (Leaflet dark) na seção Sobre"
```

---

## Self-Review

**Spec coverage:**
- AboutSection (client) após o bento → Task 1 Steps 3–4. ✓
- História + reveal por scroll → Task 1 Step 3 (`.about-reveal`). ✓
- Timeline vertical animada (linha desenha + marcos pop, alternando lados) → Task 2 Step 1. ✓
- Mapa Leaflet client-only (`dynamic ssr:false`) + tiles dark CARTO + divIcon pulsante + popup + `scrollWheelZoom` off → Task 3 Steps 1–2. ✓
- Card de endereço/horário em texto + atribuição dos tiles → Task 1 Step 3 + Task 3 Step 1. ✓
- Dados fictícios (Liberdade, marcos 2009–2025) → Task 1 Step 2 (`about-data.ts`). ✓
- Degradação reduced-motion (reveals/scrub/pulse) → Tasks 1–3 (guarda `reduce` + `@media`). ✓
- Dependências leaflet/react-leaflet/@types → Task 1 Step 1. ✓
- Verificação lint/tsc/build + CDP + ao vivo → todas as tasks. ✓

**Placeholder scan:** sem TBD/TODO; código completo. Dados fictícios são intencionais (spec §9). Percentuais de posição dos nós têm etapa de conferência (Task 2 Step 4).

**Type consistency:** `MILESTONES`/`Milestone` e `PLACE`/`Place` definidos em `about-data.ts` (Task 1) e consumidos por `Timeline`/`RestaurantMap` (Tasks 2–3). Classes `.about-reveal`, `.about-map-slot`, `.tl-progress`, `.tl-item`, `.map-pin*` definidas e consumidas de forma consistente. `RestaurantMap` importado só via `dynamic(ssr:false)` (nunca no server) — CSS do Leaflet só entra no chunk client.

**Riscos (spec §9):** SSR do Leaflet (mitigado por `ssr:false` + import de CSS só no componente client — Task 3); ícone default (usamos `divIcon`); tiles em headless (verificação ao vivo — Task 3 Step 5); peso do Leaflet (lazy via dynamic).
