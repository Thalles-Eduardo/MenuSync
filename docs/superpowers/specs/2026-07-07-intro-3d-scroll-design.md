# Design — Intro 3D dirigida por scroll (Home)

**Data:** 2026-07-07
**Contexto:** Substituir o loader por uma intro imersiva: sobre o fundo do Monte Fuji no
lago (`bgLoader.png`), o modelo `japanese_restaurant.glb` fica pousado sobre a água; ao
rolar a página, a câmera plana sobre a água e depois entra no restaurante com um flash de
luz, revelando a hero.

---

## 1. Objetivo e escopo

Criar uma **intro 3D dirigida pelo scroll** como primeira seção da home, acima do hero.
A câmera faz um trajeto cinematográfico (skim sobre a água → entrada no restaurante →
flash) conforme o usuário rola, terminando na hero já existente.

**Dentro do escopo:**
- Cena R3F com fundo do Fuji + modelo do restaurante sobre a água + luzes quentes.
- Câmera dirigida por scroll (GSAP ScrollTrigger, pin + scrub → `progress` ref lido no
  `useFrame`), em duas fases: planar sobre a água, depois entrar.
- Flash de luz (overlay DOM) cobrindo a transição para a hero.
- Tela de carregamento "MENU SYNC" + **% de progresso** do GLB.
- Fallback (mobile / sem WebGL / `prefers-reduced-motion`): pular a intro, usar o
  `Loader.tsx` atual (intro em texto) → hero. Sem 3D nem scroll-jacking.
- Botão "Pular intro" que rola até a hero.
- Lazy-load de toda a intro (`dynamic`, `ssr: false`), preload do GLB, `dpr` limitado.

**Fora de escopo:** post-processing/bloom via lib (o flash é overlay DOM); interior
modelado do restaurante (o flash cobre o momento de entrada); áudio; editar o modelo GLB.

---

## 2. Abordagem escolhida

**GSAP ScrollTrigger (pin + scrub) + `@react-three/drei` para o GLB.** Reaproveita o
GSAP/ScrollTrigger já adotado, integra com o scroll nativo do documento (hero e "Pratos em
destaque" vêm logo depois em fluxo normal) e mantém o flash como overlay DOM (sem
dependência de post-processing). O scroll não é "sequestrado": o pin mantém o canvas fixo
enquanto o scroll nativo avança o `progress`; o usuário mantém o controle e pode pular.

Alternativas descartadas: drei `<ScrollControls>` (cria container de scroll próprio, briga
com o resto da página); auto-play sem scroll (o usuário pediu explicitamente ligado ao
scroll).

---

## 3. Arquitetura

```
app/(site)/
├── page.tsx                       # <IntroExperience/> → <HeroShowcase/> → <FeaturedDishes/>
└── _components/intro/
    ├── IntroExperience.tsx        # gate + seção de scroll + pin + flash + botão pular
    ├── IntroScene.tsx             # <Canvas>: backdrop Fuji + <RestaurantModel/> + luzes + câmera
    ├── RestaurantModel.tsx        # useGLTF do restaurante, posicionado sobre a água
    └── IntroLoader.tsx            # tela MENU SYNC + % (Suspense fallback do Canvas)
```

**IntroExperience.tsx** (`"use client"`):
- Gate seguro para hidratação (padrão `useSyncExternalStore` já usado em `AtmosphereLayer`):
  decide `enabled = hasWebGL() && !reducedMotion && !isMobile`.
- Se **não** habilitado: renderiza `<Loader/>` (o componente de texto atual) e nada de 3D.
- Se habilitado: renderiza uma `<section>` alta (~`h-[400vh]`) com um contêiner **pinado**
  (canvas em `position: sticky`/pin ScrollTrigger, `h-100vh`), o `IntroScene` lazy dentro de
  `<Suspense fallback={<IntroLoader/>}>`, o overlay de flash e o botão "Pular intro".
- Cria um `ScrollTrigger` (`start: "top top"`, `end: "bottom bottom"`, `scrub: true`,
  `pin`) cujo `onUpdate` grava `self.progress` num `useRef` compartilhado (`progressRef`),
  passado ao `IntroScene`. Também dirige a `opacity` do flash (0 até ~0.82, subindo a 1 em
  ~1.0) e revela a hero ao desprender.
- Import dinâmico: `const IntroScene = dynamic(() => import("./IntroScene"), { ssr:false })`.
- `SafeBoundary` (error boundary, padrão já usado) engole falhas de WebGL e cai no fallback.

**IntroScene.tsx** (`"use client"`):
- `<Canvas dpr={[1,1.5]} gl={{ antialias:true, alpha:true, powerPreference:"high-performance" }}
  camera={{ position:[posição inicial], fov:55 }}>`.
- **Backdrop Fuji:** plano grande texturizado com `bgLoader.png` (`useTexture`), posicionado
  ao fundo para dar leve profundidade/parallax conforme a câmera avança.
- `<RestaurantModel/>` posicionado sobre a linha da água (terço inferior do enquadramento).
- **Luzes:** ambiente suave + luz quente (point/spot) próxima do restaurante, cuja
  intensidade cresce conforme `progress` (reforça o "acender" ao entrar).
- **Câmera (dolly por scroll):** um componente lê `progressRef.current` no `useFrame` e
  interpola a posição/alvo da câmera em duas fases:
  - **Fase A (progress 0 → ~0.6):** câmera **baixa, planando sobre a água**, avançando em
    direção ao restaurante (vê-se a superfície e o reflexo; leve balanço).
  - **Fase B (progress ~0.6 → 1):** câmera sobe levemente, mira a entrada e **avança para
    dentro** do restaurante; nos últimos ~15% o flash assume.
  - Interpolação suave (lerp/`gsap.utils.interpolate` sobre keyframes de posição e lookAt).

**RestaurantModel.tsx** (`"use client"`):
- `const { scene } = useGLTF("/3d/japanese_restaurant.glb")`; `useGLTF.preload(...)`.
- Ajuste de `scale`/`position`/`rotation` para pousar sobre a água; leve bob idle
  (`useFrame`, desativado em reduced-motion — embora nesse caso a intro nem rode).
- **Risco Draco:** se o GLB usar compressão Draco, configurar o `DRACOLoader` e servir o
  decoder a partir de `/public/draco/` (copiar do pacote `three`). Verificar no início.

**IntroLoader.tsx** (`"use client"`):
- Visual "MENU SYNC" (glow) reaproveitando o estilo do `Loader.tsx` atual, com uma barra/%
  vinda de `useProgress()` (drei). Fundo `--color-dark-blue`.

---

## 4. Fluxo de dados / handoff para a hero

- `progressRef` (0→1) é a única ponte entre o scroll (ScrollTrigger no `IntroExperience`) e a
  câmera (`useFrame` no `IntroScene`) — evita re-render do React por frame.
- O flash é um `<div>` overlay cuja `opacity` também é função de `progress` (subindo no fim).
- Ao final do pin, a `<section>` termina e a hero (fluxo normal do documento) entra logo
  abaixo; o flash se dissolve sobre o início da hero — "resultando na hero".

---

## 5. Dependências

- **Adicionar:** `@react-three/drei` (`useGLTF`, `useProgress`, `useTexture`).
- Já instalados: `@react-three/fiber`, `three`, `gsap`, `@gsap/react`.
- Assets: `/public/3d/japanese_restaurant.glb`, `/public/bgLoader.png` (já presentes).
  Possível `/public/draco/` se o modelo for Draco.

---

## 6. Degradação e acessibilidade

- `prefers-reduced-motion` → fallback (sem intro).
- Sem WebGL → fallback.
- Mobile (heurística de largura/pointer) → fallback.
- Botão **"Pular intro ↓"** sempre visível durante a intro.
- Falha de runtime na cena (error boundary) → fallback.

---

## 7. Verificação

- `npm run lint` e `npx tsc --noEmit` sem erros.
- Confirmar que `three`/R3F/drei/GLB entram em **chunk assíncrono** (lazy), fora do bundle
  inicial.
- `npm run dev` + verificação **ao vivo** do trajeto (skim sobre a água → entrada → flash →
  hero) rolando a página. (Screenshot headless não dirige o scroll/GSAP de forma confiável.)
- Fallback: com `--force-prefers-reduced-motion`, confirmar que a intro é pulada e a hero
  aparece (via `Loader.tsx`).
- Medir peso/carregamento do GLB (progresso visível; sem travar a thread principal).

---

## 8. Pendências / riscos

- **Peso do GLB (6.9 MB):** mitigado por lazy-load + tela de progresso; medir LCP na Fase 12.
- **Draco:** confirmar compressão e servir decoder se necessário.
- **Enquadramento do modelo:** `scale`/`position`/câmera precisam de ajuste fino ao vivo
  (iterativo) para "pousar sobre a água" e o trajeto ficar natural.
- **Pin + página com outras seções:** garantir que o `ScrollTrigger.refresh()` e a altura da
  seção não quebrem o layout da hero/pratos; conter `overflow-x`.
- **Interior do modelo:** se não houver interior, o flash na Fase B cobre a entrada.
