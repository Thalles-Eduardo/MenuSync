# Design — Seção "Pratos em destaque" (Home)

**Data:** 2026-07-07
**Contexto:** Segunda seção da home (Fase 03), abaixo do hero. Apresenta os pratos
num formato editorial "zig-zag", reaproveitando os dados e a animação add-to-cart
já existentes.

---

## 1. Objetivo e escopo

Adicionar uma seção **Pratos em destaque** logo abaixo do hero, transformando a home
em uma página rolável (esta é a primeira seção com scroll). Cada prato é apresentado
em uma linha alternada (imagem de um lado, texto do outro), com *reveal* ao rolar.

**Dentro do escopo:**
- Componente client `FeaturedDishes.tsx`, recebendo `dishes` como prop.
- Reaproveitamento dos 4 pratos de `app/(site)/_data/dishes.ts`.
- Reaproveitamento do componente `AddToCartButton` (botão "Adicionar" com animação).
- Layout zig-zag alternado (desktop) / empilhado (mobile).
- Reveal por scroll com GSAP ScrollTrigger; degradação com `prefers-reduced-motion`.

**Fora de escopo:** categorias/filtro, adicionar novos pratos, integração com carrinho
real (Fase 07), navegação para página de cardápio, nota de avaliação (⭐) no card.

---

## 2. Arquitetura

```
app/(site)/
├── page.tsx                     # adiciona <FeaturedDishes dishes={dishes} /> após o hero
└── _components/
    ├── FeaturedDishes.tsx       # "use client": <section> com cabeçalho + linhas zig-zag,
    │                            # useGSAP + ScrollTrigger para o reveal
    └── AddToCartButton.tsx      # reutilizado sem alteração
```

- `page.tsx` (server component) passa `dishes` para `FeaturedDishes`, mesmo padrão de
  `HeroShowcase`.
- `FeaturedDishes` é `"use client"` (usa GSAP/ScrollTrigger e renderiza `AddToCartButton`,
  que já é client).
- A home passa a rolar: `<Loader />`, `<HeroShowcase />` (hero em `min-h-screen`), e abaixo
  `<FeaturedDishes />`.

---

## 3. Componente `FeaturedDishes`

**Props:** `{ dishes: Dish[] }`.

**Cabeçalho da seção:**
- Eyebrow "Cardápio" (cor `text-yellow`, tracking largo).
- Título "Pratos em destaque" em Eczar (`var(--font-eczar)`).

**Linhas (uma por prato):**
- `grid grid-cols-1 lg:grid-cols-2 items-center gap-8/12`.
- Alternância por índice: índice par → imagem à esquerda / texto à direita; índice ímpar →
  invertido via `lg:order-*` (no mobile a ordem é sempre imagem em cima, texto embaixo).
- **Primeira linha (index 0):** imagem à esquerda.
- Coluna de imagem: `dish.plate` via `next/image`, `rounded`, `drop-shadow-2xl`, leve rotação
  estética; `max-w` limitado; `object-contain`.
- Coluna de texto: nome (`dish.name`, Eczar, grande), tagline (`dish.tagline`, `text-yellow`),
  preço (`Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })` — mesmo padrão do
  `HeroText`), e `<AddToCartButton />`.

**Fundo / mood:** fundo escuro dando continuidade ao izakaya — `background` usando
`--color-dark-blue` (#2A2E37) com leve gradiente quente opcional. `overflow-hidden` na seção
para conter os deslocamentos horizontais do reveal.

---

## 4. Animação (GSAP + ScrollTrigger)

- `gsap.registerPlugin(ScrollTrigger)` (import de `gsap/ScrollTrigger`).
- `useGSAP({ scope })`: para cada `.featured-row`, cria um ScrollTrigger (start ~`top 80%`) que
  dispara uma vez: imagem entra pelo seu lado (x conforme a paridade + `opacity` + leve `scale`),
  texto sobe em stagger (`y`, `opacity`). Cabeçalho também revela ao entrar.
- **`prefers-reduced-motion: reduce`:** não anima; conteúdo já visível (sem `opacity:0` inicial).
  Isso mantém acessibilidade e permite verificação por screenshot headless.
- **Fallback:** se `gsap/ScrollTrigger` não estiver disponível no pacote instalado, usar
  `IntersectionObserver` para adicionar uma classe `.is-visible` que dispara uma transição CSS
  equivalente. (Verificar disponibilidade no início da implementação; GSAP 3.12+ inclui
  ScrollTrigger no pacote gratuito.)

Guardas já usadas no projeto: memoizar `reduce` e evitar estado inicial oculto quando reduzido.

---

## 5. Dependências

Nenhuma nova. Usa `gsap` + `@gsap/react` já instalados; `ScrollTrigger` faz parte do pacote
`gsap`. Nenhum asset novo (reusa `dish.plate`).

---

## 6. Verificação

- `npm run lint` e `npx tsc --noEmit` sem erros.
- `npm run dev` + screenshot headless (com `--force-prefers-reduced-motion`) confirmando o
  layout das 4 linhas alternadas (desktop) e o empilhamento (mobile, `--window-size` estreito).
- Conferência ao vivo do reveal ao rolar e do botão "Adicionar" (animação add-to-cart) em cada
  linha.

---

## 7. Pendências / riscos

- Reveal por scroll não dispara em headless sem rolagem — verificação de *motion* é ao vivo;
  o screenshot cobre o layout estático (via reduced-motion).
- `ScrollTrigger` precisa de `registerPlugin`; confirmar import correto (`gsap/ScrollTrigger`).
- Conter `overflow-x` para os offsets do reveal não gerarem barra horizontal.
