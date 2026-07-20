# Spec — Carrinho (`/carrinho` + estado global)

**Data:** 2026-07-19
**Branch:** `feat/sakura-cardapio`
**Fase (README):** "Página separada → Carrinho".

## Contexto

O projeto tem botões de compra desde a fase do hero, mas **nenhum carrinho real**. Três
pontas estão soltas:

1. `AddToCartButton` (`app/(site)/_components/AddToCartButton.tsx`) é **puramente
   cosmético** — roda uma timeline GSAP que mostra "Adicionado" e não recebe sequer o
   produto. Assinatura atual: `({ compact = false }: { compact?: boolean })`. Quatro
   call sites (`MenuItemCard:55`, `HeroText:24`, `MenuBento:39` e `:107`) têm o item em
   escopo e não o passam.
2. O ícone de carrinho na `Navbar` (`Navbar.tsx:42-55`) é um `<button>` **sem `onClick`,
   sem badge, sem destino**.
3. Não existe estado de carrinho em lugar nenhum — sem context, sem zustand, sem
   persistência. As specs de cardápio e navbar registram isso como adiamento deliberado
   ("Fora de escopo: carrinho real / estado global").

Esta spec fecha as três pontas: cria o estado, liga os botões e entrega a página
`/carrinho`. Continua **só front**, sem backend.

## Decisões (brainstorming)

1. **Escopo:** página `/carrinho` + **badge de contagem na navbar** (o ícone passa a
   navegar). Sem mini-drawer lateral.
2. **Persistência:** `localStorage` — sobrevive a refresh e a fechar o navegador.
3. **Finalização:** **confirmação local** — "Finalizar pedido" mostra sucesso na própria
   página e limpa o carrinho, no mesmo espírito do form de cupom do footer, que já é
   simulado.
4. **Menu hambúrguer** ganha o item "Carrinho" (caminho claro no mobile).
5. **`weight` dos pratos do hero** é resolvido pelo `id` contra o `menu.ts` (os 4 ids do
   hero existem lá com o mesmo preço).

## Paleta e fontes

Tokens de `app/globals.css` `@theme`: `--color-brown #574c41` · `--color-salmon #e36b6b`
· `--color-caramel #e3a56b` · `--color-yellow #e3c77b` · `--color-green #96875a` ·
`--color-dark-blue #2A2E37`. Títulos em `--font-eczar` via
`style={{ fontFamily: "var(--font-eczar), serif" }}`, como no resto do projeto.

## Modelo de dados

### O problema

Há **dois tipos de produto incompatíveis que compartilham ids**:

```ts
// _data/menu.ts
type MenuItem = { id; name; description; weight; price; category; image; discount? };
// _data/dishes.ts
type Dish = { id; name; tagline; price; plate; thumb; video?; reviews; ingredients };
```

`teishoku`, `sopa-misso`, `sushi-10` e `okonomiyaki` existem nos dois, com o mesmo
preço. `Dish` não tem `weight` nem `discount`; `MenuItem` não tem `plate`/`thumb`.

### A forma normalizada — **novo** `app/(site)/_data/cart.ts`

```ts
export type CartItem = {
  id: string;
  name: string;
  image: string;
  weight: string;
  precoOriginal: number; // preço de tabela ("de")
  unitPrice: number;     // JÁ com desconto aplicado ("por")
  quantity: number;
};

export type CartInput = Omit<CartItem, "quantity">;

export function deMenuItem(item: MenuItem): CartInput;
export function deDish(dish: Dish): CartInput; // weight/desconto resolvidos pelo id no menu
```

`unitPrice` entra **já descontado**, então a página do carrinho nunca reimplementa regra
de preço. `precoOriginal` viaja junto porque a linha precisa exibir o preço riscado e o
resumo precisa calcular o desconto total — nenhum dos dois é derivável de `unitPrice`
sozinho. Quando não há desconto, `precoOriginal === unitPrice` e a UI simplesmente não
mostra o riscado.

`deDish` procura o `MenuItem` de mesmo `id` para herdar `weight` e `discount`; se não
achar, cai para `weight: ""` e o preço do próprio `Dish` nos dois campos.

### Preço compartilhado — **novo** `app/(site)/_lib/price.ts`

Hoje o formatador `brl` está **duplicado em 3 arquivos** (`MenuItemCard:5`,
`HeroText:5`, `MenuBento:9`) e a fórmula de desconto vive inline só no `MenuItemCard`:

```ts
const hasDiscount = typeof item.discount === "number" && item.discount > 0;
const finalPrice = hasDiscount ? item.price * (1 - item.discount! / 100) : item.price;
```

Extrair para um módulo único evita que o carrinho vire a 4ª cópia:

```ts
export const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function temDesconto(item: { discount?: number }): boolean;
export function precoFinal(item: { price: number; discount?: number }): number;
```

`_lib/` é pasta nova — justificada por ser lógica pura, não dado (`_data/`) nem
componente (`_components/`). Os 3 arquivos passam a importar daqui.

## Estado — **novo** `app/(site)/_components/CartProvider.tsx`

`"use client"`. Espelha o padrão já estabelecido pelo `RouteTransitionProvider`
(contexto + hook exportado, montado uma vez no root layout).

```ts
type CartState = { items: CartItem[]; hydrated: boolean };

type CartAction =
  | { type: "HYDRATE"; items: CartItem[] }
  | { type: "ADD"; item: CartInput }
  | { type: "REMOVE"; id: string }
  | { type: "SET_QTY"; id: string; quantity: number }
  | { type: "CLEAR" };
```

Hook exportado:

```ts
useCart(): {
  items: CartItem[];
  hydrated: boolean;
  count: number;      // soma das quantidades
  subtotal: number;   // soma de precoOriginal × qtd
  desconto: number;   // subtotal − total (≥ 0)
  total: number;      // soma de unitPrice × qtd
  add(item: CartInput): void;
  remove(id: string): void;
  setQty(id: string, quantity: number): void;
  clear(): void;
}
```

Regras do reducer:

- `ADD` com `id` já presente **incrementa a quantidade**, não duplica a linha.
- `SET_QTY` com `quantity <= 0` **remove** a linha (o stepper no `−` do 1 remove).
- Totais derivados via `useMemo`, nunca guardados no estado.

### Hidratação — o ponto de risco

Ler `localStorage` no `useState` inicial **quebra o SSR**: o servidor renderiza vazio e o
cliente cheio. O padrão obrigatório:

1. `useReducer` começa em `{ items: [], hydrated: false }` — servidor e cliente batem.
2. `useEffect` de montagem lê a chave `menusync:cart`, valida e despacha `HYDRATE`.
3. `useEffect` de persistência **só grava quando `hydrated === true`**. Sem essa guarda,
   o primeiro render sobrescreve o carrinho salvo com `[]`.

Leitura defensiva: `JSON.parse` em `try/catch`, descartando o valor se não for array ou
se as linhas não tiverem `id`/`unitPrice` numérico — dado de storage é entrada não
confiável e o formato pode mudar entre versões.

Montagem em `app/layout.tsx`, por fora do provider de transição:

```tsx
<CartProvider>
  <RouteTransitionProvider>{children}</RouteTransitionProvider>
</CartProvider>
```

## Navbar — **novo** `app/(site)/_components/CartButton.tsx`

`Navbar` é **server component** e deve continuar sendo. Só o botão vira client:

- `"use client"`, usa `useCart()`
- `TransitionLink href="/carrinho"` envolvendo o `<Image src="/icons/cart.svg">` atual,
  preservando `aria-label="Carrinho"` e as classes de hover existentes
- Badge: pastilha `bg-salmon` no canto superior direito, renderizada **apenas quando
  `hydrated && count > 0`** — evita piscar "0" na hidratação
- `aria-label` passa a incluir a contagem (ex.: `"Carrinho, 3 itens"`)

`Navbar.tsx` troca o bloco do `<button>` morto por `<CartButton />`.

`HamburgerMenu.tsx` ganha o item `{ label: "Carrinho", href: "/carrinho", icon: <svg…> }`,
sem `index` — ou seja, item de rota, renderizado como `TransitionLink`, exatamente como
o "Cardápio" já é.

## `AddToCartButton` — de cosmético a funcional

Nova assinatura:

```tsx
export default function AddToCartButton({
  item,
  compact = false,
}: { item: CartInput; compact?: boolean })
```

`handleClick` chama `add(item)` **no início** da timeline GSAP; a animação
"idle → carrinho/caixa → Adicionado" e o debounce `busy` ficam **intactos**. Os 4 call
sites passam o produto:

- `MenuItemCard.tsx:55` → `<AddToCartButton compact item={deMenuItem(item)} />`
- `HeroText.tsx:24`, `MenuBento.tsx:39` e `:107` → `item={deDish(dish)}`

## Página `/carrinho`

**Novo** `app/(site)/carrinho/page.tsx` — server component, exporta `metadata`
(`title: "Carrinho — MenuSync"`), renderiza `<CarrinhoClient />`. Mesmo formato do
`cardapio/page.tsx`.

**Novo** `app/(site)/carrinho/_components/CarrinhoClient.tsx` — `"use client"`.

Estrutura espelhando o `CardapioClient`: fundo `backgroundColor: var(--color-dark-blue)`
+ `backgroundImage: url('/bgCardapioInk.webp')`, `<Navbar />` próprio (sem
`onSelectSection`), e `px-8 pt-28 pb-10 md:px-12` para compensar a navbar fixa.

- **Cabeçalho:** kana `カート · Carrinho` (padrão do `メニュー · Cardápio`) + h1 em Eczar.
- **Layout:** `lg:grid-cols-3` — lista ocupando 2 colunas, resumo `lg:sticky lg:top-28`
  na terceira. Empilha no mobile.
- **Linha do carrinho** (`.cart-line`): `next/image` do produto, nome, `weight`, stepper
  `− quantidade +`, total da linha, e botão remover com `aria-label="Remover {nome}"`.
  Preço unitário riscado quando houver desconto, seguindo o `MenuItemCard`.
- **Resumo:** Subtotal → Desconto (em `text-yellow`, só se `> 0`) → Total, e o botão
  "Finalizar pedido".
- **Finalizar:** troca o card por um estado de sucesso (ex.: "Pedido enviado!") e chama
  `clear()`. Sem backend, sem rota nova.
- **Vazio:** mensagem + `TransitionLink href="/cardapio"` ("Ver o cardápio").
- **Antes da hidratação** (`!hydrated`): renderiza um esqueleto neutro, não o estado
  vazio — senão quem tem itens salvos vê "carrinho vazio" piscar.
- **Entrada:** `gsap.fromTo(".cart-line", { y: 24, opacity: 0 }, { y: 0, opacity: 1,
  duration: 0.5, stagger: 0.06, ease: "power3.out" })` dentro de `useGSAP` com `scope` e
  guarda `reduce`, idêntico ao `.menu-card` do `CardapioClient`.

## Acessibilidade

- Stepper com `aria-label` explícito em `−`/`+` e a quantidade em `aria-live="polite"`.
- Badge da navbar não é a única pista: o `aria-label` do link carrega a contagem.
- Estado de sucesso do pedido anunciado via `role="status"`.

## Fora de escopo

Frete e endereço · cupom aplicado no carrinho · checkout ou pagamento real · backend ou
persistência remota · mini-drawer lateral · sincronizar carrinho entre abas
(`storage` event) · quantidade máxima por item.

## Verificação

1. `npx tsc --noEmit` e `npm run lint` sem erros.
2. `npm run build` — confirma que nenhum `useSearchParams`/hook de cliente quebrou o
   prerender das rotas.
3. **CDP** (headless Chrome, 1440×900), roteiro:
   - `/cardapio` → clicar "Adicionar" em 2 itens → badge da navbar mostra `2`
   - clicar o ícone → navega para `/carrinho` com transição (sem flash)
   - as 2 linhas aparecem; `+` sobe a quantidade e o total acompanha
   - `−` no 1 remove a linha; remover tudo mostra o estado vazio
   - **F5 na `/carrinho`** com itens → o carrinho persiste e o badge volta correto
     (regressão de hidratação)
   - "Finalizar pedido" → sucesso + carrinho zerado + badge some
4. Conferir no DevTools que **não há warning de hydration mismatch** no console.
5. Rodar com `prefers-reduced-motion: reduce` — sem animação de entrada, tudo funcional.
