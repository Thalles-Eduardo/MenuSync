# Design — Seção "Destaques do cardápio" (bento) com prato voador do hero

**Data:** 2026-07-08
**Contexto:** Segunda seção da home (Fase 03), logo abaixo do hero. Um **bento grid**
de destaques do cardápio ao qual se chega por uma transição de scroll: o **prato ativo
do hero viaja** (encolhe, endireita e se desloca) até a célula grande do bento enquanto
os demais cards surgem ao redor.

---

## 1. Objetivo e escopo

Adicionar a seção **Destaques do cardápio** em formato bento, entrando por uma
coreografia de scroll (**pin + scrub**, GSAP ScrollTrigger) na qual o prato central do
hero é o elemento compartilhado que "voa" para dentro do grid.

**Dentro do escopo:**
- Orquestrador client `HomeExperience` que passa a ser dono do `activeDishId` e coordena
  hero + bento (estado compartilhado).
- `HeroShowcase` passa a ser **controlado** (recebe `activeDishId` + `onSelectDish`).
- Nova seção client `MenuBento` (bento grid de destaques do cardápio).
- Prato voador guiado por scroll (pin + scrub), com posições medidas dos nós reais.
- Reaproveitamento de `_data/dishes.ts` e do componente `AddToCartButton`.
- Degradação: `prefers-reduced-motion` / mobile-touch / ScrollTrigger ausente → sem
  pin/voo, hero e bento empilhados normalmente.

**Fora de escopo:** página de cardápio completa (o CTA é placeholder `#`); filtros/categorias;
carrinho real (Fase 07); novas imagens/assets; alterar os dados dos pratos.

---

## 2. Abordagem escolhida

**GSAP ScrollTrigger com pin + scrub e um elemento "prato voador" de posição fixa.**
Reaproveita o GSAP/ScrollTrigger já adotado. O pin segura o palco por ~1.5–2 telas
enquanto o scrub interpola o prato voador da posição do prato do hero até a célula grande
do bento e faz os demais cards surgirem. Alternativas descartadas: GSAP Flip (é *play-based*,
não casa bem com scrub); intro sem pin (o usuário escolheu explicitamente pin + scrub).

**Estado compartilhado** é necessário para que o *mesmo* prato do hero seja o que aterrissa
no bento (e para o bento reagir à troca de prato no carrossel). Por isso o `activeDishId`
sobe do `HeroShowcase` para o `HomeExperience`.

---

## 3. Arquitetura

```
app/(site)/
├── page.tsx                     # <Loader/> + <HomeExperience dishes={dishes} />
└── _components/
    ├── HomeExperience.tsx       # "use client": dono de activeDishId; orquestra pin+scrub;
    │                            # renderiza HeroShowcase (controlado) + MenuBento; monta o
    │                            # .flying-plate e o ScrollTrigger da transição
    ├── HeroShowcase.tsx         # vira CONTROLADO: recebe activeDishId + onSelectDish
    ├── MenuBento.tsx            # "use client": bento grid (card grande + 3 cards + CTA)
    └── AddToCartButton.tsx      # reutilizado sem alteração
```

**HomeExperience.tsx** (`"use client"`):
- `const [activeDishId, setActiveDishId] = useState(dishes[0]?.id ?? "")`.
- `activeDish = dishes.find(...) ?? dishes[0]`; `otherDishes = dishes.filter(d => d.id !== activeDishId)`.
- Renderiza um **palco** (`<section>` alto, ~`h-[250vh]`) contendo um contêiner **pinado**
  (`h-screen`) com: a camada do hero, a camada do bento e o `.flying-plate`.
- Cria o ScrollTrigger (`pin`, `scrub: true`, `invalidateOnRefresh: true`) cujo timeline:
  - mede (por função) o rect do prato do hero (`.plate-img`) e do assento do card grande
    (`.bento-plate-seat`);
  - interpola `.flying-plate` (x, y, scale, rotation) entre os dois;
  - controla `opacity` das camadas (hero some, bento aparece) e o stagger dos cards.
- Passa `activeDishId` + `setActiveDishId` ao `HeroShowcase`; `activeDish`/`otherDishes` à `MenuBento`.

**HeroShowcase.tsx** (mudança mínima):
- Deixa de ter `useState(activeDishId)`; recebe `activeDishId` + `onSelectDish` por props.
- `handleSelect` passa a chamar `onSelectDish(id)` (mantém o reset de aba local).
- `activeTab` continua interno. As animações de troca (dependency `[activeDishId]`) permanecem.

**MenuBento.tsx** (`"use client"`):
- Props: `{ activeDish: Dish; otherDishes: Dish[] }`.
- Cabeçalho: eyebrow "Cardápio" (`text-yellow`) + título "Destaques do cardápio" (Eczar).
- Grid bento (ver §4). Card grande com `.bento-plate-seat` (o assento onde o prato voador
  pousa) + nome/preço/tagline/`AddToCartButton`. Cards menores: imagem + nome + preço +
  `AddToCartButton`. Card CTA: "Ver cardápio completo" → `#` (placeholder).

**Prato voador (`.flying-plate`)**:
- Um único `next/image` do `activeDish.plate`, `position: fixed`, `pointer-events: none`,
  `z` alto, oculto por padrão. Só participa durante o scrub (nas condições com animação).
- No fim do voo, o assento do card grande revela o prato "pousado" (imagem estática no card),
  e o `.flying-plate` some — evitando duplicidade visual.

---

## 4. Layout do bento (§ grid)

- Desktop (`lg`): `grid grid-cols-3 grid-rows-2` (auto-rows equivalentes), `gap-4/6`.
  - **Card grande** (prato ativo): `col-span-2 row-span-2`.
  - **Card prato 2**: `col-start-3 row-start-1`.
  - **Card prato 3**: `col-start-3 row-start-2`.
  - **Card prato 4** e **Card CTA**: linha abaixo (o grid cresce para uma 3ª faixa) —
    prato 4 e CTA lado a lado sob o card grande. (Ajuste fino de `col/row` na implementação
    para casar com o mock aprovado.)
- Mobile: `grid-cols-1` (ou `grid-cols-2` para os menores) — card grande no topo, depois os
  cards de prato, CTA por último. Empilhamento sem barra horizontal.
- Cards: cantos arredondados, fundo de vidro/escuro coerente com o izakaya, leve borda
  `rgba(255,255,255,0.1)`; hover com leve `scale`/brilho.
- Fundo da seção: `--color-dark-blue` (continuidade com o mood do projeto).

---

## 5. Coreografia (GSAP ScrollTrigger — pin + scrub)

`gsap.registerPlugin(ScrollTrigger)` (import de `gsap/ScrollTrigger`).

Timeline sob o palco pinado (progress 0→1), valores de posição por função
(`invalidateOnRefresh`):
- **0 → ~0.35:** camada do hero (texto, reviews, carrossel) faz `opacity/​y` para fora;
  `.flying-plate` assume a posição/tamanho do `.plate-img` do hero e começa a encolher.
- **~0.30 → ~0.85:** `.flying-plate` interpola até o rect de `.bento-plate-seat`
  (x, y, `scale`, `rotation → 0`); camada do bento `opacity 0→1`.
- **~0.55 → 1:** cards menores + CTA entram em **stagger** (`y/scale/opacity`).
- **~0.9 → 1:** revela o prato pousado no card grande e oculta o `.flying-plate`.

Guardas:
- Desligar o **parallax de cursor** do prato do hero enquanto o voo está ativo (o parallax
  usa `quickTo` em `.plate-img`; só habilitar em progress ~0 ou desabilitar ao iniciar o pin).
- `ScrollTrigger.refresh()` após mount/resize; medir rects com `getBoundingClientRect`.
- Ao trocar o prato ativo (carrossel) durante/antes do palco, atualizar a imagem do
  `.flying-plate` e do card grande (deriva de `activeDish`); as medidas usam seletores, não
  valores fixos.

---

## 6. Degradação e acessibilidade

Condição "sem animação" = `prefers-reduced-motion: reduce` **ou** ponteiro grosso/mobile
(heurística `matchMedia("(pointer: fine)")` + largura) **ou** `gsap/ScrollTrigger` ausente:
- Não pinar nem criar o voo. Renderizar o hero (seção normal `min-h-screen`) e, abaixo, a
  `MenuBento` em fluxo normal. O card grande mostra o prato estático (o assento já contém a
  imagem). Nenhum conteúdo inicia oculto; sem scroll-jacking.
- Padrão de hidratação seguro (`useSyncExternalStore`, já usado em `AtmosphereLayer`/
  `PlayVideoButton`) para decidir `enabled` sem divergência SSR/cliente.
- `overflow-x` contido no palco e na seção.
- `.flying-plate` é decorativo (`aria-hidden`); os textos/preços/botões reais vivem nos cards.

---

## 7. Dependências

Nenhuma nova. `gsap` + `@gsap/react` já instalados; `ScrollTrigger` faz parte do pacote
`gsap`. Sem novos assets (reusa `dish.plate`).

---

## 8. Verificação

- `npm run lint` e `npx tsc --noEmit` sem erros; `npm run build` ok.
- Screenshot **full-page via CDP** (com `--force-prefers-reduced-motion`) confirmando o
  layout estático: hero seguido do bento (card grande + 3 cards + CTA), desktop e mobile,
  sem barra horizontal.
- Conferência **ao vivo** (sem reduced-motion) do voo: rolar do hero até o bento e confirmar
  o prato encolhendo/viajando até o card grande, cards surgindo em stagger, e o pin liberando
  para o fluxo normal. Trocar o prato no carrossel e confirmar que o bento reflete.

---

## 9. Pendências / riscos

- **Medição de rects com pin:** o `.plate-img` do hero pode já ter transform de parallax;
  medir com o parallax zerado (ou usar o contêiner do prato) para o voo começar alinhado.
- **Refactor do HeroShowcase para controlado:** manter as animações de troca/entrada
  intactas; regressão possível — verificar o hero após a mudança.
- **`invalidateOnRefresh`/resize:** recalcular posições ao redimensionar; conter `overflow-x`
  para os deslocamentos não gerarem barra horizontal.
- **Reveal por scroll não dispara em headless sem rolagem:** verificação do voo é ao vivo; o
  screenshot cobre só o layout estático (via reduced-motion).
- **CTA placeholder (`#`):** trocar pelo link real quando a página de cardápio existir.
```
