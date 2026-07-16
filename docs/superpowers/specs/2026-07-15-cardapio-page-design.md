# Spec — Página `/cardapio` (menu completo, só front)

**Data:** 2026-07-15
**Branch:** `feat/sakura-cardapio`
**Fase (README):** página de cardápio completo, acessível pelo botão "Explore" da
section Cardápio (`MenuBento`).

## Contexto

A home é uma **roleta de painéis de 100vh** (`SectionStage`). A section Cardápio
(`MenuBento`) mostra 4 pratos em destaque + um card CTA com um botão **"Explore"**
que hoje aponta para `href="#"`. O usuário quer que esse botão leve a uma **nova
página `/cardapio`** — um menu completo, baseado numa referência visual (página escura
com título "МЕНЮ", coluna de categorias à esquerda e grid de cards de produto em 3
colunas com foto, nome, descrição, peso/porção, preço, badge de desconto e paginação).

Escopo: **somente o front**, na **paleta e nos padrões do projeto**. Sem carrinho real,
sem persistência, sem backend. Reaproveita componentes/estética existentes.

## Paleta (de `app/globals.css` `@theme`)

`--color-brown #574c41` · `--color-salmon #e36b6b` · `--color-caramel #e3a56b` ·
`--color-yellow #e3c77b` · `--color-green #96875a` · `--color-dark-blue #2A2E37` ·
fonte de títulos `--font-eczar`.

## Decisões (brainstorming)

1. **Dados:** expandir o menu — dataset novo e realista de ~18–20 itens em 6 categorias.
2. **Categorias:** filtro **funcional** (client-side); categoria ativa destacada.
3. **Conteúdo do card:** descrição + peso/porção + preço, **botão adicionar ao
   carrinho** (reaproveita `AddToCartButton`, versão compacta) e **badge de desconto**
   em alguns itens. **Sem** coração/favoritar.
4. **Navegação:** **página própria** scrollável, com **header** (logo `MenuSync` +
   link ← voltar para a home). Não reusa a roleta.
5. **Imagem dos cards:** **reusar as imagens `plate*/food*` ciclando** entre os itens
   (mesmo padrão que a `MenuBento` já usa para os cards menores).
6. **Sem paginação** (YAGNI — o filtro por categoria já reduz a lista).

## Arquitetura e componentes

### Rota
- **Novo:** `app/(site)/cardapio/page.tsx` — server component dentro do grupo `(site)`
  (herda `layout.tsx`, fontes e `globals.css`). Importa os dados e renderiza o client.
- Página com **scroll normal** (não é painel de roleta).

### Dados — **novo** `app/(site)/_data/menu.ts`
```ts
export type MenuCategory =
  | "sushi" | "rolls" | "entradas" | "quentes" | "sobremesas" | "bebidas";

export type MenuItem = {
  id: string;
  name: string;
  description: string;   // curta, estilo ingredientes
  weight: string;        // ex.: "200g" ou "8 un."
  price: number;         // BRL
  category: MenuCategory;
  image: string;         // reusa /plate*.webp|png ou /food*.webp (ciclado)
  discount?: number;     // % (ex.: 15) → badge "-15%" + preço antigo riscado
};

export const CATEGORIES: { id: MenuCategory; label: string }[] = [ ... ];
export const menu: MenuItem[] = [ ~18–20 itens ];
```
- 6 categorias com rótulos PT: **Sushi · Rolls & Temaki · Sopas & Entradas ·
  Pratos Quentes · Sobremesas · Bebidas**.
- Reaproveita os 4 pratos de `dishes.ts` (Teishoku, Sopa de Missô, Sushi 10 P/c,
  Okonomiyaki) distribuídos nas categorias certas + novos itens plausíveis.
- 2–3 itens com `discount` para exercitar o badge.
- `image` cicla entre `/plate1.webp`, `/plate2.png`, `/plate3.png`, `/plate4.png`,
  `/food1.webp`…`/food4.webp`.

### Client — **novo** `app/(site)/cardapio/_components/CardapioClient.tsx`
`"use client"`. Responsabilidades:
- Estado `active: MenuCategory | "todos"` (inicia numa categoria com itens, ex. `sushi`;
  ou "todos" — a definir na implementação, default `sushi` como na referência).
- Renderiza header, título, rail de categorias e grid filtrado (`menu.filter(...)`).
- Animação de entrada/re-filtragem com GSAP (`useGSAP`, `prefers-reduced-motion`).

### Sub-componentes (mesma pasta `cardapio/_components/`)
- **`MenuHeader.tsx`** — barra superior: `Menu`+`Sync` (salmon) em eczar + link
  `<Link href="/">` com seta ← "Voltar". `cursor-pointer`, hover `text-caramel`.
- **Rail de categorias** — lista vertical (dentro do client ou componente próprio
  `CategoryRail.tsx`): cada categoria é `<button>` que seta `active`; a ativa recebe
  `text-yellow` + underline; inativas `text-white/70` hover `text-caramel`. Em telas
  pequenas (`< md`) vira faixa horizontal com `overflow-x-auto`.
- **`MenuItemCard.tsx`** — card do produto:
  - imagem (`next/image`) centralizada no topo (plate transparente) sobre o card;
  - nome (eczar), descrição (`text-white/70`), peso/porção (`text-white/50` pequeno);
  - preço em eczar; se `discount`, badge `-{n}%` (canto, `bg-salmon`/`text-white`) e
    preço antigo riscado (`line-through text-white/50`) ao lado do preço com desconto;
  - `AddToCartButton` (compacto).

### AddToCartButton
Reaproveitar o componente existente. Se o tamanho atual (`h-[52px] min-w-[170px]`)
ficar grande no card, adicionar uma prop opcional `compact?: boolean` que reduz altura/
largura/label — **sem** alterar o comportamento/animação. Decisão final na implementação;
preferir reuso sem refactor se couber.

## Layout (fiel à referência, na paleta)

Container da página: fundo `dark-blue` + textura `url('/bgCardapioInk.webp')`
(`bg-cover bg-center`), `text-white`, `SakuraCorners`. Enquadramento lateral como o
restante (`px-8 md:px-12`).

- **Header** no topo (logo + voltar).
- **Bloco de título:** eyebrow `メニュー · Cardápio` (tracking largo, `text-yellow`
  uppercase) + `h1` "MENU" grande em eczar.
- **Corpo em 2 colunas** (`grid` / `flex`): rail de categorias à esquerda
  (largura fixa ~200px em `lg`), grid de cards à direita
  (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4/6`).
- Responsivo: em `< lg`, rail vira faixa horizontal acima do grid; grid cai para
  2 e depois 1 coluna.

## Animação

- Entrada: cards sobem com `gsap.from({ y: 24, opacity: 0, stagger: 0.06,
  ease: "power3.out" })` ao montar.
- Ao trocar de categoria: re-tocar um fade/slide curto nos cards visíveis (via key/
  dependência no `useGSAP`), restrained.
- `if (reduce) return;` — respeita `prefers-reduced-motion` (estado final estático já
  legível).

## Wiring do "Explore"

Em `MenuBento.tsx`, o card CTA `<a href="#">` (que contém o botão "Explore") passa a ser
`<Link href="/cardapio">` (import de `next/link`). Mantém o visual atual do botão.

## Arquivos

- **Novo:** `app/(site)/cardapio/page.tsx`
- **Novo:** `app/(site)/cardapio/_components/CardapioClient.tsx`
- **Novo:** `app/(site)/cardapio/_components/MenuHeader.tsx`
- **Novo:** `app/(site)/cardapio/_components/MenuItemCard.tsx`
- **Novo (opcional):** `app/(site)/cardapio/_components/CategoryRail.tsx`
  (se o rail não ficar embutido no client)
- **Novo:** `app/(site)/_data/menu.ts`
- **Editado:** `app/(site)/_components/MenuBento.tsx` (Explore → `Link href="/cardapio"`)
- **Editado (talvez):** `app/(site)/_components/AddToCartButton.tsx` (prop `compact`)

## Verificação

1. `npx tsc --noEmit` — sem erros de tipo.
2. `npm run lint` — limpo.
3. `npm run build` — build de produção passa (rota `/cardapio` gerada).
4. CDP (headless Chrome, 1440×900 e ~390 mobile):
   - abrir a home → section Cardápio → clicar **Explore** → navega para `/cardapio`;
   - página renderiza: header + voltar, título MENU, rail de categorias, grid de cards
     com foto/nome/descrição/peso/preço, badge de desconto onde aplicável;
   - clicar numa categoria **filtra** o grid; categoria ativa destacada;
   - `AddToCartButton` funciona no card;
   - link "Voltar" retorna para `/`;
   - fundo `bgCardapioInk` na paleta, sem 404; layout responsivo (mobile: rail
     horizontal, grid 1 coluna).
5. Screenshots (desktop + mobile) para revisão.

## Fora de escopo

- Carrinho real / estado global de carrinho, checkout, quantidades.
- Favoritar (coração), busca, ordenação, paginação.
- Páginas de detalhe por item, imagens reais individuais por prato.
- Backend / persistência de qualquer tipo.
