# Design — Camada de Atmosfera WebGL (Hero)

**Data:** 2026-07-06
**Contexto:** Enriquecer o fundo da hero (`bgHero.webp`) com uma camada WebGL interativa, sem substituir a foto.

---

## 1. Objetivo e escopo

Adicionar uma **camada de atmosfera** por cima da foto do restaurante (mas atrás do conteúdo da hero): **partículas de brasa/poeira** flutuando e uma **luz de lanterna** quente que segue o cursor. Deve reforçar o clima de izakaya à noite sem virar "tech demo".

**Dentro do escopo:**
- Camera R3F (`@react-three/fiber` + `three`) numa camada absoluta entre a foto e o conteúdo.
- Partículas ambientes (embers) subindo/derivando com leve parallax do cursor.
- Glow aditivo quente seguindo o cursor (efeito lanterna).
- **Lazy-load** (import dinâmico, `ssr: false`) para ficar fora do bundle inicial.
- Degradação: `prefers-reduced-motion` → quadro estático (sem animação); ponteiro grosso (mobile) → sem glow de cursor, menos partículas; `dpr` limitado; `pointer-events-none`.

**Fora do escopo:** recriar o ambiente em 3D; modelos 3D de pratos; pós-processamento pesado (bloom via lib); áudio.

---

## 2. Arquitetura

```
app/(site)/_components/
├── AtmosphereLayer.tsx     # client wrapper: import dinâmico (ssr:false), div de posicionamento
│                           # (absolute inset-0 z-0 pointer-events-none), gating (reduced-motion /
│                           # pointer fino), rastreio do cursor (ref compartilhado)
└── AtmosphereScene.tsx     # "use client": <Canvas> R3F com Embers + LanternGlow
    ├── Embers              # THREE.Points (BufferGeometry + PointsMaterial + textura circular
    │                       # gerada em canvas), useFrame: sobe/deriva/wrap + parallax
    └── LanternGlow         # THREE.Sprite aditivo (textura radial gerada em canvas),
                            # useFrame: lerp da posição até o cursor
```

Integração em `HeroShowcase`: `<AtmosphereLayer />` como **primeiro filho** da `<section>` (fica em `z-0`, sobre a imagem de fundo). O conteúdo (grid/carrossel) já está em `z-10`, portanto fica por cima. Navbar em `z-20`.

**Rastreio do cursor:** como a camada é `pointer-events-none`, o movimento é lido por um listener de `pointermove` no `window` dentro do `AtmosphereLayer`, gravando `{x,y}` normalizados num `useRef` passado para a cena (evita re-render do React a cada frame).

---

## 3. Componentes

**AtmosphereLayer.tsx**
- `const Scene = dynamic(() => import("./AtmosphereScene"), { ssr: false, loading: () => null })`.
- Calcula `reduce` (prefers-reduced-motion) e `finePointer` (`(pointer: fine)`) uma vez.
- Mantém `pointer = useRef({ x: 0.5, y: 0.5 })`; listener de `pointermove` só quando `finePointer`.
- Renderiza `<div className="pointer-events-none absolute inset-0 z-0"><Scene pointer={pointer} reduced={reduce} interactive={finePointer} /></div>`.

**AtmosphereScene.tsx**
- `<Canvas dpr={[1, 1.5]} gl={{ antialias: false, alpha: true }} camera={{ position: [0,0,5], fov: 50 }} frameloop={reduced ? "demand" : "always"}>`.
- `<Embers reduced pointer />` e (se `interactive`) `<LanternGlow pointer />`.
- Fundo transparente (`alpha: true`) para deixar a foto aparecer.

**Embers**
- `count`: ~180 (desktop) / ~90 (reduzido/mobile).
- Posições aleatórias num box; `PointsMaterial`: `size` pequeno, `map` = textura circular suave (canvas), `transparent`, `blending: AdditiveBlending`, `depthWrite: false`, cor âmbar (`#e3a56b`/`#e3c77b`), `opacity` baixa.
- `useFrame`: sobe em Y (+ leve seno no X), faz *wrap* ao topo; deslocamento sutil do grupo conforme `pointer` (parallax). Se `reduced`, não anima (quadro estático).

**LanternGlow**
- `THREE.Sprite` com textura radial (canvas: gradiente branco→transparente), `AdditiveBlending`, `depthWrite:false`, escala grande, cor quente, opacity baixa.
- `useFrame`: `lerp` da posição (mapeada do `pointer` para coords de mundo do plano da câmera) — segue o cursor com suavidade.

---

## 4. Dependências

`three`, `@react-three/fiber`, `@types/three` (dev). Nenhum asset novo (texturas geradas em runtime via canvas).

---

## 5. Estilo / mood

Âmbar quente (paleta `caramel #e3a56b`, `yellow #e3c77b`), blending aditivo, opacidades baixas — sutil, "respirando". Nunca deve ofuscar o prato/preço/CTAs.

---

## 6. Verificação

- `npm run lint` e `npm run build` sem erros; confirmar que `three`/R3F **não** entram no chunk inicial (import dinâmico).
- Confirmar visualmente **ao vivo** (`npm run dev`): brasas sobem sutis; a luz segue o mouse na área da hero; com "reduzir movimento" ativo, fica estático; em mobile, sem glow de cursor.
- (Screenshot headless de WebGL é instável — verificação visual principal é ao vivo.)

---

## 7. Pendências / riscos

- Peso do `three` (~150KB+ gzip) — mitigado por lazy-load; medir impacto no Lighthouse na Fase 12.
- WebGL indisponível/erro de contexto → a cena simplesmente não aparece (a foto continua). Sem quebra de layout.
- Ajuste fino de contagem de partículas/opacidade/velocidade é iterativo (calibrar ao vivo).
