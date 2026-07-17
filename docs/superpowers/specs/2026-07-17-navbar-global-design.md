# Spec — Navbar global (presente em todas as seções e páginas)

**Data:** 2026-07-17
**Branch:** `feat/sakura-cardapio`

## Contexto

A home é uma **roleta de painéis de 100vh** (`SectionStage`): um track vertical com
5 painéis (Início, Cardápio, Sobre, Reservas, Contato) que desliza via GSAP.

Hoje a `<Navbar />` (logo `MenuSync` + busca + carrinho + hambúrguer) vive **dentro
do `HeroShowcase`** (painel 0), portanto **desliza junto com o track** e só aparece na
seção Início. As outras 4 seções ficam sem navbar. A página `/cardapio` usa um header
próprio (`MenuHeader` — logo + "← Voltar"), não a Navbar.

Além disso, o `HamburgerMenu` tem itens (Início/Cardápio/Reservas/Sobre/Contato) que
**não navegam** — só fecham o menu.

O usuário quer a **navbar presente em todas as seções e páginas**.

## Decisões (brainstorming)

1. **Persistência na roleta:** retirar a `<Navbar />` do `HeroShowcase` e renderizá-la
   **uma vez** no `SectionStage`, como **barra fixa no topo** (`fixed`), acima do track.
2. **`/cardapio`:** substituir o `MenuHeader` pela **mesma Navbar global**. O logo
   `MenuSync` passa a ser link para `/`. O "← Voltar" sai (o logo já leva à home).
3. **Hambúrguer funcional:** os itens passam a **navegar de verdade**.
4. **Fora de escopo:** busca funcional e carrinho real continuam presenciais.

## Arquitetura

### Navbar como barra fixa (roleta)

`SectionStage` renderiza `<Navbar onSelectSection={…} />` como **primeiro elemento**,
fixa no topo:

```tsx
<Navbar onSelectSection={goTo} />
```

Posicionamento: `fixed top-0 inset-x-0 z-40`.

Camadas (z-index) — sem conflito espacial:
- Navbar: `z-40` (topo).
- `SectionRoulette`: `z-50` (drum à direita / pills embaixo).
- `flying-plate`: `z-60` (voa por cima de tudo na transição Início↔Cardápio).

O menu dropdown do hambúrguer abre dentro do stacking context da navbar (`z-40`); como
ele cai do canto superior-direito e o drum fica no centro-direito, a sobreposição é
mínima/aceitável.

### Navbar reutilizável — prop `onSelectSection`

`Navbar` e `HamburgerMenu` recebem uma prop **opcional**:

```ts
onSelectSection?: (index: number) => void;
```

- **Presente (home):** os itens de seção chamam `onSelectSection(index)` → `goTo`.
- **Ausente (`/cardapio`):** os itens de seção viram `<Link href="/?section=<id>">`.

### Mapeamento dos itens do hambúrguer

Cada item ganha um `id`/alvo. A ordem de seção segue a roleta em `SectionStage`
(`ITEMS`): `inicio`(0) · `cardapio` · `sobre`(2) · `reservas`(3) · `contato`(4).
Atenção: na roleta, o índice do **Cardápio é 1**, mas o item "Cardápio" do menu aponta
para a **página `/cardapio`**, não para o painel 1.

| Item      | Home (`onSelectSection` presente) | `/cardapio` (ausente)          |
| --------- | --------------------------------- | ------------------------------ |
| Início    | `onSelectSection(0)`              | `<Link href="/">`              |
| Cardápio  | `<Link href="/cardapio">`         | `<Link href="/cardapio">`      |
| Sobre     | `onSelectSection(2)`              | `<Link href="/?section=sobre">`|
| Reservas  | `onSelectSection(3)`              | `<Link href="/?section=reservas">`|
| Contato   | `onSelectSection(4)`              | `<Link href="/?section=contato">`|

Cada item vira: se tem `href` fixo (Cardápio) → sempre `<Link>`; se é seção → `<button>`
que chama `onSelectSection(index)` quando a prop existe, senão `<Link href="/?section=id">`.
Todos fecham o menu ao acionar (`setOpen(false)`).

### Deep-link de seção (`?section=`)

`SectionStage`, no **mount**, lê `?section=<id>` de `window.location.search`, mapeia para
o índice via `ITEMS.findIndex(...)`, e se válido:
- define o `activeIndex` inicial (`setActiveIndex(index)` e sincroniza `prevIndex`);
- limpa o parâmetro com `history.replaceState` (para refresh não re-saltar).

Implementação: `useEffect(() => { … }, [])` lendo `new URLSearchParams(window.location.search)`
— evita `useSearchParams()` + Suspense, já que o componente é `"use client"` e tudo roda
no cliente. O salto inicial pode ser sem animação (o track já é posicionado por `gsap.set`
quando `!enabled`, e no primeiro efeito de layout `prevIndex===activeIndex`).

### Logo vira link

Em `Navbar`, o `<span>MenuSync</span>` passa a `<Link href="/">MenuSync</Link>`
(mantendo o estilo eczar + `text-salmon` no "Sync"). `cursor-pointer`.

### `/cardapio`

`CardapioClient` troca `<MenuHeader />` por `<Navbar />` (sem `onSelectSection`).
A Navbar é fixa (`fixed top-0`), então o conteúdo do cardápio precisa de `padding-top`
para não ficar atrás dela. `MenuHeader.tsx` é **removido** (não terá mais uso).

## Layout / espaçamento

Ao tornar a navbar `fixed`, ela sai do fluxo. Onde o conteúdo do topo puder ficar atrás
dela, reservar espaço:
- **Roleta:** os painéis são 100vh com conteúdo centralizado; o topo do `HeroShowcase`
  (que tinha a navbar em fluxo) ganha `padding-top` equivalente à altura da navbar
  (~88px) para não subir atrás dela. Ajuste fino confirmado na verificação visual.
- **`/cardapio`:** o container ganha `padding-top` para o bloco de título não ficar
  atrás da navbar.

## Arquivos

- **Editado:** `app/(site)/_components/SectionStage.tsx` — renderiza `<Navbar
  onSelectSection={goTo} />` fixa; lê `?section=` no mount.
- **Editado:** `app/(site)/_components/HeroShowcase.tsx` — remove `<Navbar />` e o import;
  ajusta `padding-top` do topo.
- **Editado:** `app/(site)/_components/Navbar.tsx` — prop `onSelectSection?`; logo vira
  `<Link href="/">`; repassa a prop ao `HamburgerMenu`.
- **Editado:** `app/(site)/_components/HamburgerMenu.tsx` — prop `onSelectSection?`;
  itens com `id`/alvo; render condicional `<button>` (seção com prop) vs `<Link>`.
- **Editado:** `app/(site)/cardapio/_components/CardapioClient.tsx` — usa `<Navbar />`
  no lugar de `<MenuHeader />`; ajusta `padding-top`.
- **Removido:** `app/(site)/cardapio/_components/MenuHeader.tsx`.

## Verificação

1. `npx tsc --noEmit` — sem erros de tipo.
2. `npm run lint` — limpo.
3. `npm run build` — build de produção passa (rotas `/` e `/cardapio`).
4. CDP (headless Chrome, 1440×900 e ~390 mobile):
   - **Roleta:** a navbar (logo + busca + carrinho + hambúrguer) aparece fixa no topo
     em **todas as 5 seções** (Início, Cardápio, Sobre, Reservas, Contato) ao navegar
     pelo drum; não desliza com o track.
   - Abrir o hambúrguer na home e clicar **Sobre/Reservas/Contato** → a roleta salta
     para a seção certa; **Cardápio** → navega para `/cardapio`; **Início** → seção 0.
   - Em `/cardapio`: a navbar aparece no topo; o logo leva à `/`; abrir o hambúrguer e
     clicar **Sobre** → vai para `/?section=sobre` e a home abre na seção Sobre (e a URL
     é limpa para `/`).
   - Conteúdo do topo (hero e título do cardápio) não fica escondido atrás da navbar.
   - Mobile: navbar no topo coexiste com as pills inferiores do `SectionRoulette`.
5. Screenshots (desktop + mobile) para revisão.

## Fora de escopo

- Busca funcional (o input continua presencial).
- Carrinho real / estado de carrinho.
- Redesign visual da navbar ou do menu (apenas reposicionar + wiring de navegação).
