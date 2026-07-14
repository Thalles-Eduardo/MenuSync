# Design — Roleta de seções (switcher de tela cheia)

**Data:** 2026-07-13
**Status:** Aprovado (usuário revisa ajustes ao final da implementação)

## Objetivo

Transformar a home de uma página com scroll vertical (Hero → Cardápio → Sobre)
em um **switcher de tela cheia**: uma única viewport, sem scroll de página. Uma
**roleta** no canto direito lista as seções; ao clicar em uma, a seção atual
**desliza/faz morph** na selecionada (tambor vertical). A Hero é o item inicial.

## Decisões (do brainstorming)

- **Modelo:** tela cheia, 1 viewport, sem scroll entre seções.
- **Seções (nesta ordem):** Início (Hero), Cardápio, Sobre.
- **Transição base:** tambor vertical — as seções ficam empilhadas e o track
  desliza no eixo Y até a seção escolhida, em sincronia com o giro da roleta.
- **Voo do prato:** a animação-assinatura (prato voa da Hero e pousa no card
  grande do Cardápio) é **reaproveitada como a transição Hero↔Cardápio**.
- **Interação da roleta:** só clique (sem arrastar/scroll).
- **Mobile:** a roleta lateral vira uma **barra inferior de pills** horizontais.
- **A11y / reduced-motion:** troca instantânea (sem animação) + gestão de foco.

## Arquitetura

### Novo: `app/(site)/_components/SectionStage.tsx` (client)

Shell dono do estado e das transições. Substitui/absorve o papel do atual
`HomeExperience` (que hoje detém `activeDishId` e a lógica do voo do prato) e
passa a englobar também a `AboutSection`.

Responsabilidades:
- Mantém `activeIndex` (0 = Início, 1 = Cardápio, 2 = Sobre) e `activeDishId`.
- Renderiza o **track vertical** (`h-[300vh]` conceitual: 3 painéis de `100vh`)
  dentro de um container `h-screen overflow-hidden`. Anima o `y` do track entre
  `0 / -100vh / -200vh` com GSAP ao trocar de seção.
- Renderiza o `SectionRoulette` (navegador) e o **prato voador** (overlay).
- Dispara os reveals das seções ao ativá-las (ver "Reveals").
- Trava o scroll da página enquanto ativa (container fixo `h-screen`,
  `overflow-hidden`; sem depender de scroll do documento).

### Novo: `app/(site)/_components/SectionRoulette.tsx` (client, apresentacional)

- Props: `items: { id; label }[]`, `activeIndex`, `onSelect(index)`.
- **Desktop (≥1024px):** tambor fixo na lateral direita, verticalmente
  centralizado. Itens como botões; o ativo destacado; leve rotação/curvatura do
  conjunto para dar cara de "roleta".
- **Mobile:** barra inferior fixa com pills horizontais (mesmos itens/handlers).
- Acessível: cada item é `<button>`; setas ↑/↓ movem, Enter seleciona;
  `aria-current` no ativo; foco visível.

### Editado: `app/(site)/page.tsx`

- Passa a renderizar apenas `<Loader />` + `<SectionStage dishes={dishes} />`.
- Remove o render direto de `HomeExperience` e `AboutSection` (agora dentro do Stage).

### Seções como painéis de 100vh

- **Hero** e **Cardápio** já são `min-h-screen` — viram painéis de `100vh`.
- **Sobre** tem conteúdo alto (texto + timeline + mapa). O painel ativo
  **rola internamente** (`overflow-y-auto`) quando o conteúdo excede a viewport.
  Assim mantemos "sem scroll entre seções", mas o Sobre rola dentro do próprio
  painel. Hero/Cardápio não precisam de scroll interno.

## Transições

Container `h-screen overflow-hidden`; track é uma coluna com os 3 painéis. Trocar
de seção = animar `gsap.to(track, { y: -index * innerHeight })`.

- **Deslize base (qualquer troca):** GSAP `y` do track, ~0.7s, `power3.inOut`.
  A roleta gira/realça o item ativo em sincronia (mesma duração/ease).
- **Hero ↔ Cardápio (voo do prato):** durante o deslize entre esses dois
  painéis, o **prato voador** (elemento `fixed`, imagem do prato ativo) anima da
  posição do prato do Hero (`.plate-img`) até o assento do card grande do
  Cardápio (`.bento-seat-img`), com crossfade nas pontas (esconde o prato do
  Hero / revela o do card). Reaproveita a lógica atual do `HomeExperience`, mas
  acionada por **timeline tocada junto com a transição** (não mais por
  `ScrollTrigger`/scrub). No sentido inverso (Cardápio→Início), a timeline toca
  ao contrário. Só no caminho habilitado (ver Gating).
- **Reduced-motion / mobile / touch:** sem voo do prato e sem deslize animado —
  troca **instantânea** do `activeIndex` (track pula direto para a posição).

### Gating (mantém a heurística atual do `HomeExperience`)

Voo do prato e deslize animado só quando: `pointer: fine` **e** não
`prefers-reduced-motion` **e** `innerWidth >= 1024`. Caso contrário, troca
instantânea. O `SectionRoulette` funciona em todos os casos.

## Reveals (mudança importante)

Hoje disparam por `ScrollTrigger` de scroll de página — que **não existe mais**:

- **Sakura (Cardápio):** `SakuraCorners` deixa de usar `ScrollTrigger`. O Stage
  informa quando o Cardápio fica ativo (prop `active` ou callback), e o reveal
  (galho desenha + flores em stagger) toca nesse momento, **uma vez**. Mantém a
  guarda de `prefers-reduced-motion` (estado final visível sem animar).
- **Sobre (`.about-reveal`):** idem — o reveal de entrada passa a tocar quando a
  seção Sobre fica ativa, em vez de `ScrollTrigger` de página.

## Componentes que permanecem

- `HeroShowcase`, `MenuBento`, `AboutSection` seguem como o **conteúdo** de cada
  painel. Ajustes: garantir que preencham `100vh` como painel e expor os
  hooks/props de reveal-on-activate. A parallax do prato do Hero continua
  desligada dentro do palco (classe `stage-pin`, já existente).
- `Navbar`, `DishCarousel`, `ReviewsPanel`, `SakuraCorners` (com o novo gatilho).

## Fluxo de dados

`SectionStage` é a fonte de verdade de `activeIndex` e `activeDishId`. O
`HeroShowcase` recebe `onSelectDish` (carrossel) e `MenuBento` recebe o
`activeDish` — igual hoje, só que o dono passa a ser o Stage.

## Acessibilidade

- Roleta: botões reais, `aria-current`, navegação por teclado (↑/↓/Enter), foco
  visível. Ao trocar de seção, mover foco para o topo do painel ativo (ou um
  heading com `tabIndex=-1`) para leitores de tela.
- Respeita `prefers-reduced-motion` (sem animação de deslize/voo).
- Sem "armadilha de scroll": no mobile a barra de pills não cobre conteúdo
  essencial; o painel Sobre rola internamente com teclado/toque.

## Fora de escopo (YAGNI)

- Trazer a Galeria de volta.
- Arrastar/rodar a roleta (scroll/drag); só clique.
- Deep-link por URL/hash por seção (navegação por âncora).
- Animações ambientes contínuas na roleta.

## Verificação

Sem framework de testes. Critérios validados por:

- `npx tsc --noEmit` sem erros; `npm run lint` limpo; `npm run build` ok.
- CDP (Chrome headless), viewport desktop (≥1024) e mobile (~390px):
  - troca entre as 3 seções pela roleta (desktop) e pelas pills (mobile);
  - transição Hero→Cardápio mostra o **prato voando** e pousando no card grande;
  - reveal da **sakura** dispara ao ativar o Cardápio (não fica invisível);
  - reveal do **Sobre** dispara ao ativar a seção;
  - painel **Sobre** rola internamente quando o conteúdo excede a viewport;
  - **reduced-motion**: troca instantânea, tudo visível, sem voo/deslize;
  - sem scroll de página (a viewport não rola entre seções).

## Arquivos

- **Novo:** `app/(site)/_components/SectionStage.tsx`
- **Novo:** `app/(site)/_components/SectionRoulette.tsx`
- **Editado:** `app/(site)/page.tsx`
- **Editado:** `app/(site)/_components/SakuraCorners.tsx` (reveal on-activate)
- **Editado:** `app/(site)/_components/AboutSection.tsx` (reveal on-activate + painel)
- **Editado:** `app/(site)/_components/MenuBento.tsx` (painel 100vh / hook de reveal)
- **Editado/absorvido:** `app/(site)/_components/HomeExperience.tsx` (lógica migra
  para o Stage; remover ou reduzir a um wrapper fino)
