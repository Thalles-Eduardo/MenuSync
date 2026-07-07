# Intro 3D dirigida por scroll — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o loader por uma intro 3D: câmera plana sobre a água (Fuji no lago) e entra no restaurante com um flash, dirigida pelo scroll, terminando na hero.

**Architecture:** `IntroExperience` (client) faz o gate (WebGL/reduced-motion/mobile), renderiza uma seção alta com canvas fixo (CSS sticky), um `progress` ref alimentado por GSAP ScrollTrigger, overlay de flash e botão "pular". `IntroScene` (lazy, R3F) desenha o backdrop do Fuji + o modelo + luzes e move a câmera lendo o `progress` no `useFrame`. Fallback (mobile/sem-WebGL/reduced-motion) reusa o `Loader.tsx` atual.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, GSAP+ScrollTrigger, three 0.185, @react-three/fiber v9, **@react-three/drei (novo)**.

**Análise dos assets (já feita):** `japanese_restaurant.glb` = 6.9 MB, glTF 2.0, **sem Draco** (nenhuma extensão), 517 meshes, 50 materiais, 0 animações. Como as extents internas dependem dos transforms de nós, o modelo é **normalizado em runtime** (`THREE.Box3().setFromObject`): centralizado no plano da água e escalado para caber. Backdrop do Fuji = **vídeo** `/video/bgLoader.mp4` (2.4 MB), aplicado como `VideoTexture` via `useVideoTexture` (autoplay/muted/loop/playsInline).

**Verificação (sem test runner):** cada task valida com `npm run lint` e `npx tsc --noEmit`. Verificação visual do 3D é **ao vivo** (`npm run dev`), pois scroll/GSAP não avançam de forma confiável em headless. Para um smoke headless do 3D (frame inicial), usar SwiftShader:

```bash
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
"$CHROME" --headless=new --use-gl=angle --use-angle=swiftshader --no-first-run \
  --no-default-browser-check --user-data-dir="$TEMP/cudd" --hide-scrollbars \
  --window-size=1440,900 --virtual-time-budget=8000 \
  --screenshot="$TEMP/intro.png" "http://localhost:3000/"
```

Para o fallback, `--force-prefers-reduced-motion` deve pular a intro e mostrar a hero.

---

## File Structure

- Modify: `package.json` — adiciona `@react-three/drei`.
- Create: `app/(site)/_components/intro/RestaurantModel.tsx` — carrega e normaliza o GLB.
- Create: `app/(site)/_components/intro/IntroScene.tsx` — Canvas + backdrop + modelo + luzes + câmera.
- Create: `app/(site)/_components/intro/IntroLoader.tsx` — tela MENU SYNC + %.
- Create: `app/(site)/_components/intro/IntroExperience.tsx` — gate + scroll + flash + fallback.
- Modify: `app/(site)/page.tsx` — monta `<IntroExperience/>` acima da hero.
- Reuse: `app/(site)/_components/Loader.tsx` (fallback), `public/3d/japanese_restaurant.glb`, `public/video/bgLoader.mp4`.

**Nota:** valores de câmera/escala/luz são pontos de partida realistas e serão **afinados ao vivo** no passo de verificação da Task 5 (isso não é placeholder — o código roda; só o enquadramento é iterativo).

---

### Task 1: Dependência drei + `RestaurantModel`

**Files:**
- Modify: `package.json`
- Create: `app/(site)/_components/intro/RestaurantModel.tsx`

- [ ] **Step 1: Instalar @react-three/drei**

Run: `npm install @react-three/drei`
Expected: instala sem erro de peer (drei recente suporta @react-three/fiber v9). Se houver conflito de peer, rodar `npm install @react-three/drei --legacy-peer-deps` e anotar no commit.

- [ ] **Step 2: Verificar que o import resolve**

Run: `node -e "require.resolve('@react-three/drei'); console.log('ok')"`
Expected: imprime `ok`.

- [ ] **Step 3: Criar `RestaurantModel.tsx`**

```tsx
"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "/3d/japanese_restaurant.glb";
useGLTF.preload(MODEL_URL);

type Props = {
  position?: [number, number, number];
  rotationY?: number;
  targetSize?: number; // maior dimensão do modelo, em unidades de cena
};

export default function RestaurantModel({
  position = [0, 0, 0],
  rotationY = 0,
  targetSize = 4,
}: Props) {
  const { scene } = useGLTF(MODEL_URL);
  const ref = useRef<THREE.Group>(null);

  // Normaliza: centraliza em X/Z, apoia a base em y=0 e escala para targetSize.
  const normalized = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    clone.position.set(-center.x, -box.min.y, -center.z);
    const wrapper = new THREE.Group();
    wrapper.add(clone);
    wrapper.scale.setScalar(targetSize / maxDim);
    return wrapper;
  }, [scene, targetSize]);

  // Balanço idle sutil.
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.6) * 0.03;
    }
  });

  return (
    <group ref={ref} position={position} rotation={[0, rotationY, 0]}>
      <primitive object={normalized} />
    </group>
  );
}
```

- [ ] **Step 4: Lint + typecheck**

Run: `npm run lint && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json "app/(site)/_components/intro/RestaurantModel.tsx"
git commit -m "feat(intro): carrega e normaliza o modelo 3D do restaurante (drei useGLTF)"
```

---

### Task 2: `IntroScene` (Canvas + backdrop + câmera dirigida por progress)

**Files:**
- Create: `app/(site)/_components/intro/IntroScene.tsx`

- [ ] **Step 1: Criar `IntroScene.tsx`**

```tsx
"use client";

import { Suspense, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useVideoTexture } from "@react-three/drei";
import * as THREE from "three";
import RestaurantModel from "./RestaurantModel";

type Props = { progress: RefObject<number> };

// smoothstep
const ss = (t: number) => t * t * (3 - 2 * t);

// Move a câmera pelo progress (0..1) em duas fases:
// A (0 -> 0.6): baixa, planando sobre a água, avançando para o restaurante.
// B (0.6 -> 1): sobe levemente, mira a entrada e entra.
function CameraRig({ progress }: Props) {
  const { camera } = useThree();
  const pos = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const p = progress.current ?? 0;
    const a = ss(THREE.MathUtils.clamp(p / 0.6, 0, 1));
    const b = ss(THREE.MathUtils.clamp((p - 0.6) / 0.4, 0, 1));

    // Fase A: z 9 -> 3.2 ; y 1.2 -> 0.55 (planando baixo sobre a água)
    const yA = THREE.MathUtils.lerp(1.2, 0.55, a);
    const zA = THREE.MathUtils.lerp(9, 3.2, a);
    // Fase B: z 3.2 -> 0.2 ; y 0.55 -> 1.1 (sobe e entra)
    const yB = THREE.MathUtils.lerp(0.55, 1.1, b);
    const zB = THREE.MathUtils.lerp(3.2, 0.2, b);

    pos.set(0, b > 0 ? yB : yA, b > 0 ? zB : zA);
    // Alvo sobe de ~0.8 para ~1.3 (mira a "entrada") na fase B.
    look.set(0, THREE.MathUtils.lerp(0.8, 1.3, b), 0);

    camera.position.copy(pos);
    camera.lookAt(look);
  });

  return null;
}

// Intensifica a luz quente conforme a câmera entra.
function WarmLight({ progress }: Props) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (ref.current) ref.current.intensity = 4 + (progress.current ?? 0) * 10;
  });
  return (
    <pointLight
      ref={ref}
      position={[0, 1.4, 1.2]}
      distance={9}
      color="#ffcf8a"
      intensity={4}
    />
  );
}

function FujiBackdrop() {
  // Vídeo do Fuji como textura (autoplay/muted/loop/playsInline por padrão no drei).
  const tex = useVideoTexture("/video/bgLoader.mp4", {
    muted: true,
    loop: true,
    playsInline: true,
    start: true,
  });
  return (
    <mesh position={[0, 2.5, -12]}>
      <planeGeometry args={[42, 23.6]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

export default function IntroScene({ progress }: Props) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 1.2, 9], fov: 55 }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} />
      <WarmLight progress={progress} />
      <Suspense fallback={null}>
        <FujiBackdrop />
        <RestaurantModel position={[0, 0, 0]} rotationY={Math.PI} />
      </Suspense>
      <CameraRig progress={progress} />
    </Canvas>
  );
}
```

- [ ] **Step 2: Lint + typecheck**

Run: `npm run lint && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/_components/intro/IntroScene.tsx"
git commit -m "feat(intro): cena R3F com backdrop do Fuji, modelo e câmera dirigida por scroll"
```

---

### Task 3: `IntroLoader` (MENU SYNC + progresso)

**Files:**
- Create: `app/(site)/_components/intro/IntroLoader.tsx`

- [ ] **Step 1: Criar `IntroLoader.tsx`**

```tsx
"use client";

import { useProgress } from "@react-three/drei";

// Overlay de carregamento; some quando os assets terminam de carregar.
export default function IntroLoader() {
  const { progress, active } = useProgress();
  if (!active && progress >= 100) return null;

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6"
      style={{ backgroundColor: "var(--color-dark-blue)" }}
    >
      <h1
        className="text-5xl font-bold tracking-widest md:text-7xl"
        style={{
          fontFamily: "var(--font-ming), serif",
          color: "#f5e6c8",
          textShadow: "0 0 24px rgba(245,214,140,0.65)",
        }}
      >
        MENU SYNC
      </h1>
      <div className="h-1 w-56 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full bg-yellow transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs tracking-[0.25em] text-white/50">{Math.round(progress)}%</p>
    </div>
  );
}
```

- [ ] **Step 2: Lint + typecheck**

Run: `npm run lint && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/_components/intro/IntroLoader.tsx"
git commit -m "feat(intro): tela de carregamento MENU SYNC com progresso do GLB"
```

---

### Task 4: `IntroExperience` (gate + scroll + flash + fallback)

**Files:**
- Create: `app/(site)/_components/intro/IntroExperience.tsx`

- [ ] **Step 1: Criar `IntroExperience.tsx`**

```tsx
"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Loader from "../Loader";
import IntroLoader from "./IntroLoader";

gsap.registerPlugin(ScrollTrigger);

const IntroScene = dynamic(() => import("./IntroScene"), { ssr: false, loading: () => null });

// hidratação-safe: false no SSR e no 1º render do cliente, true depois.
const noopSubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

class SafeBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function IntroExperience() {
  const hydrated = useHydrated();
  const progress = useRef(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  const enabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.innerWidth < 1024;
    return hasWebGL() && !reduced && !coarse && !narrow;
  }, []);

  useGSAP(
    () => {
      if (!enabled || !sectionRef.current) return;
      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          progress.current = self.progress;
          if (flashRef.current) {
            const f = gsap.utils.clamp(0, 1, (self.progress - 0.82) / 0.18);
            flashRef.current.style.opacity = String(f);
          }
        },
      });
      return () => st.kill();
    },
    { dependencies: [enabled, hydrated] }
  );

  if (!hydrated) return null; // evita mismatch de hidratação
  if (!enabled) return <Loader />; // fallback: intro em texto → hero

  return (
    <div ref={sectionRef} className="relative h-[400vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[color:var(--color-dark-blue)]">
        <SafeBoundary fallback={null}>
          <IntroScene progress={progress} />
        </SafeBoundary>
        <IntroLoader />
        <div
          ref={flashRef}
          className="pointer-events-none absolute inset-0 z-10 opacity-0"
          style={{
            background:
              "radial-gradient(circle at 50% 55%, #fff7e6 0%, #ffdca0 40%, #ffb066 100%)",
          }}
        />
        <button
          type="button"
          onClick={() => {
            const el = sectionRef.current;
            if (el) window.scrollTo({ top: el.offsetTop + el.offsetHeight, behavior: "smooth" });
          }}
          className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/30 bg-black/30 px-4 py-2 text-sm text-white/80 backdrop-blur transition hover:text-white"
        >
          Pular intro ↓
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Lint + typecheck**

Run: `npm run lint && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/_components/intro/IntroExperience.tsx"
git commit -m "feat(intro): gate, scroll (ScrollTrigger), flash e fallback da intro 3D"
```

---

### Task 5: Integrar na página + verificação ao vivo

**Files:**
- Modify: `app/(site)/page.tsx`

- [ ] **Step 1: Atualizar `page.tsx`**

Substituir o conteúdo por (a intro entra acima da hero; o `Loader` agora só é usado dentro do fallback do `IntroExperience`):

```tsx
import HeroShowcase from "./_components/HeroShowcase";
import IntroExperience from "./_components/intro/IntroExperience";
import { dishes } from "./_data/dishes";

export default function SiteHome() {
  return (
    <>
      <IntroExperience />
      <HeroShowcase dishes={dishes} />
    </>
  );
}
```

- [ ] **Step 2: Lint + typecheck**

Run: `npm run lint && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Confirmar code-splitting (three/drei/GLB fora do bundle inicial)**

Run: `npm run build`
Expected: build ok; a intro/drei aparecem em chunk assíncrono (import dinâmico), não no first load JS da rota.

- [ ] **Step 4: Smoke headless do frame inicial do 3D (SwiftShader)**

Com o dev server rodando, rodar o comando de screenshot SwiftShader do cabeçalho do plano. Abrir `intro.png` e confirmar que a cena renderiza no scroll 0: o restaurante sobre a água (enquadramento pode precisar de ajuste). Obs.: o **vídeo do backdrop pode não decodificar em headless** (plano preto na captura) — isso é esperado; a conferência do vídeo é ao vivo no Step 5.

- [ ] **Step 5: Ajuste fino ao vivo (iterativo)**

Abrir `http://localhost:3000/` num navegador com WebGL, rolar de cima até o fim da seção e conferir/afinar:
- Fase A: câmera baixa, planando sobre a água em direção ao restaurante.
- Fase B: sobe, mira a entrada e entra; flash quente sobe nos últimos ~18%.
- Ao terminar a seção, a hero aparece logo abaixo.
- Botão "Pular intro ↓" leva direto à hero.
Confirmar que o **vídeo do Fuji está tocando** no backdrop. Afinar, se preciso: `targetSize`/`rotationY` do `RestaurantModel`, keyframes de câmera no `CameraRig`, `position`/tamanho do plano de vídeo no `FujiBackdrop`, e o início do flash (`0.82`).

- [ ] **Step 6: Verificar fallback (reduced-motion)**

Run (dev server rodando):
```bash
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
"$CHROME" --headless=new --disable-gpu --force-prefers-reduced-motion --no-first-run \
  --no-default-browser-check --user-data-dir="$TEMP/cudd" --hide-scrollbars \
  --window-size=1440,900 --virtual-time-budget=5000 \
  --screenshot="$TEMP/fallback.png" "http://localhost:3000/"
```
Expected: a intro 3D é pulada; aparece o loader de texto/hero (sem a seção alta de 400vh, sem canvas).

- [ ] **Step 7: Commit**

```bash
git add "app/(site)/page.tsx"
git commit -m "feat(intro): monta a intro 3D acima da hero na home"
```

---

## Self-Review

**Spec coverage:**
- Cena Fuji + modelo sobre a água → Task 2 (`FujiBackdrop`, `RestaurantModel`). ✓
- Câmera plana sobre a água e depois entra (2 fases) → Task 2 (`CameraRig`, fases A/B). ✓
- Scroll dirige a câmera (ScrollTrigger → progress ref) → Task 4 (`ScrollTrigger.create` onUpdate) + Task 2 (`useFrame` lê `progress`). ✓
- Flash de luz na transição → Task 4 (`flashRef`, onUpdate) + Task 2 (`WarmLight` intensifica). ✓
- Load screen MENU SYNC + % → Task 3 (`IntroLoader`, `useProgress`). ✓
- Fallback mobile/sem-WebGL/reduced-motion → hero → Task 4 (`enabled` gate → `<Loader/>`). ✓
- Botão "Pular intro" → Task 4. ✓
- Lazy-load + preload + dpr limitado → Task 1 (`useGLTF.preload`), Task 2 (`dpr`), Task 4 (`dynamic`). ✓
- Sem Draco (resolvido) / normalização runtime → Task 1 (`Box3`). ✓
- Nova dependência drei → Task 1. ✓
- Integração na home → Task 5. ✓
- Verificação lint/tsc/build/live/fallback → todas as tasks + Task 5. ✓

**Placeholder scan:** sem TBD/TODO; todo código completo. Valores de enquadramento são iniciais e afinados na Task 5 Step 5 (código funcional, não placeholder).

**Type consistency:** `Props = { progress: RefObject<number> }` usado igual em `IntroScene`/`CameraRig`/`WarmLight`; `progress` criado como `useRef(0)` em `IntroExperience` e passado ao `IntroScene`. `RestaurantModel` props (`position`, `rotationY`, `targetSize`) consistentes entre Task 1 (definição) e Task 2 (uso). `MODEL_URL`/`useGLTF.preload` no mesmo arquivo. `useHydrated`/`hasWebGL`/`SafeBoundary` seguem o padrão de `AtmosphereLayer`.
