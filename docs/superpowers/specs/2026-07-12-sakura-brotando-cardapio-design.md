# Design — Sakura brotando na section Cardápio

**Data:** 2026-07-12
**Status:** Aprovado (aguardando implementação)

## Objetivo

Ao entrar (scroll) na section "Destaques do cardápio" (`MenuBento`), dois ramos de
cerejeira (sakura) "brotam" a partir dos cantos inferiores esquerdo e direito:
o galho se desenha crescendo pela lateral e as flores desabrocham em sequência.
É um reveal único, decorativo, que reforça o tema japonês sem competir com os cards.

## Contexto e restrição-chave

A imagem de fundo `public/bgPlates.webp` já tem flores de sakura **pintadas** nos
cantos inferiores — mas são pixels estáticos da foto e, como a section usa
`bg-cover`, esses cantos chegam a ser **cortados** dependendo do viewport. Portanto
não dá para animar as flores da própria imagem.

**Solução:** sobrepor flores de sakura **próprias e animadas** (SVG inline),
posicionadas em relação aos cantos da *section* (via CSS), sempre visíveis. As
flores pintadas na foto passam a ser apenas textura de fundo atrás das animadas.

### Por que SVG inline (e não PNG/Lottie)

- Permite animar o traço do galho (`stroke-dashoffset`) e cada pétala
  individualmente com o GSAP que o projeto já usa.
- Vetorial: nítido em qualquer densidade de tela.
- Leve: sem arquivo extra para baixar, sem dependência nova (Lottie).

## Arquitetura / componentes

### Novo: `app/(site)/_components/SakuraCorners.tsx`

Client component com responsabilidade única: renderizar os dois ramos de sakura em
SVG e executar o reveal com GSAP. Não recebe props (decorativo, autocontido).

- Renderiza dois ramos espelhados: canto inferior-esquerdo e canto inferior-direito
  (o direito é o mesmo SVG com `scale-x-[-1]`).
- Container raiz: `absolute inset-0 overflow-hidden pointer-events-none` com
  z-index baixo (`z-0`), para clipar o que passar das bordas e deixar cliques
  passarem para os cards.
- Cada ramo é um `<svg>` ancorado na base, largura ~`w-[220px] md:w-[300px]`,
  altura via `viewBox` de modo a subir ~35% da altura da section.

### Editado: `app/(site)/_components/MenuBento.tsx`

- Importar e renderizar `<SakuraCorners />` como **primeira filha** da `<section>`
  (antes dos wrappers de conteúdo).
- Garantir empilhamento: os dois wrappers de conteúdo existentes (o header
  `mx-auto mb-14 max-w-6xl` e o grid `mx-auto ... max-w-6xl`) recebem
  `relative z-10` para ficarem acima das flores.
- Nenhuma outra mudança de layout. Os ramos ficam nas laterais, fora da faixa
  central `max-w-6xl`, então não sobrepõem os cards em telas largas.

## A flor (sakura)

Uma flor reutilizável desenhada em SVG, instanciada ~5–6× por ramo ao longo do galho:

- **5 pétalas** dispostas a 72° (grupo com pétala-base rotacionada), preenchimento
  **branco/creme**.
- **Miolo** salmão — `var(--color-salmon)` (#e36b6b).
- **Estames** amarelos — `var(--color-yellow)` (#e3c77b), pequenos pontos/traços.
- **Galho** marrom sutil — `var(--color-brown)` (#574c41), como `stroke` do path.

Tamanho/alcance: **médio** — galho sobe ~35% da altura pela lateral, ~5–6 flores
por ramo.

## Animação (GSAP + ScrollTrigger)

Usa o mesmo padrão de `AboutSection`/`GallerySection`: `useGSAP` com `scope`,
`gsap.registerPlugin(ScrollTrigger)`, guarda de `prefers-reduced-motion`.

- **Trigger:** `ScrollTrigger` na própria section, `start: "top 70%"`, `once: true`.
- **Timeline:**
  1. **Galho cresce** (`.sakura-branch`): o traço se desenha de baixo pra cima.
     No effect, para cada path: `len = path.getTotalLength()`, define
     `strokeDasharray = len` e anima de `strokeDashoffset: len` até `0`
     (`gsap.from`), ~0.8s, `power2.out`. Sem plugin pago (DrawSVG não é usado).
  2. **Flores abrem** (`.sakura-bloom`): `gsap.from` com `scale: 0`, `autoAlpha: 0`,
     `rotation: -30`, `transformOrigin: "center center"`, `stagger: 0.12`,
     `ease: "back.out(1.7)"`, iniciando ~0.4s dentro do desenho do galho
     (sobreposição na timeline, ex. `"-=0.4"`).
- **Reduced-motion:** se `matchMedia("(prefers-reduced-motion: reduce)").matches`,
  não anima — o estado natural do SVG (galho com `strokeDashoffset` 0 = desenhado,
  flores em `opacity`/`scale` normais) já é o estado final visível.

## Estado inicial e estilo

- O estado "natural" (sem JS) do SVG é o **estado final** (tudo visível). O
  `gsap.from` parte de valores ocultos e anima de volta ao visível; se a animação
  não roda (reduced-motion), tudo permanece visível. Isso evita "flash" e mantém
  acessibilidade.
- `strokeDasharray` é definido no effect via `getTotalLength()`, não fixo no markup.

## Fora de escopo (YAGNI)

- Pétalas caindo em loop / movimento ambiente contínuo.
- Parallax nos ramos.
- Interação por hover/click nas flores.
- Variação por tema claro/escuro além do que a paleta já cobre.

## Verificação

Sem framework de testes no projeto. Critérios de aceite validados por:

- `npx tsc --noEmit` sem erros; `npm run lint` limpo; `npm run build` ok.
- CDP (Chrome headless), na section Cardápio:
  - screenshot **no meio** da animação (galho parcialmente desenhado, flores
    abrindo em sequência);
  - screenshot no **estado final** (dois ramos completos, ~5–6 flores cada,
    espelhados);
  - **mobile** (largura ~390px): ramos presentes e proporcionais, sem estourar
    layout nem cobrir conteúdo;
  - **reduced-motion** (`--force-prefers-reduced-motion=reduce`): estado final
    visível, sem animação;
  - confirmar que os cards do cardápio continuam clicáveis (flores com
    `pointer-events-none`).

## Arquivos

- **Novo:** `app/(site)/_components/SakuraCorners.tsx`
- **Editado:** `app/(site)/_components/MenuBento.tsx`
