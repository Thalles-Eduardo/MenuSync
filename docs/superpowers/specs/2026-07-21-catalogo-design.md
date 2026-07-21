# Spec — Catálogo no banco: `Category` + `Product`

**Data:** 2026-07-21
**Branch:** `feat/sakura-cardapio`
**Fase (README):** Fase 04 — Modelagem (`Categories`, `Products`)

## Contexto

A Fase 04 lista 10 modelos; só `Coupons` existe. Esta spec entrega os dois primeiros
— `Category` e `Product` — e migra o cardápio de arquivo estático para o banco.

Ela é deliberadamente a **primeira** peça da Fase 04, antes de auth e antes do
front-end admin, por um motivo concreto: o catálogo é a única parte que **não cria
nenhum endpoint de mutação**. As páginas leem o banco direto do Server Component;
não nasce nenhuma rota nova, logo não nasce nenhuma rota desprotegida. Todo CRUD de
produto depende da autenticação da Fase 05 e vem depois dela.

## O estado de hoje: duas fontes de verdade para os mesmos pratos

`app/(site)/_data/menu.ts` — 22 itens, 6 categorias, consumido por `CardapioClient`.
`app/(site)/_data/dishes.ts` — 4 itens de vitrine da home, com `tagline`, `plate`,
`thumb`, `video`, `reviews`, `ingredients`.

Os 4 `dishes` **repetem `id`, `name` e `price`** dos itens equivalentes do `menu`.
`_data/cart.ts:34` já trata isso como risco conhecido:

```ts
// `Dish` não tem `weight` nem `discount`. Os 4 pratos do hero existem no `menu`
// com o mesmo id, então herdamos de lá para a linha do carrinho ficar consistente
// venha de onde vier.
export function deDish(dish: Dish): CartInput {
  const equivalente = menu.find((m) => m.id === dish.id);
  ...
```

Ou seja: o carrinho já ignora `dish.price` de propósito. Editar o preço em
`dishes.ts` hoje muda o que a home **mostra** sem mudar o que o carrinho **cobra**.
Levar isso para o banco sem resolver seria eternizar a divergência.

**Decisão:** `Product` é a fonte única de `name`, `price` e `discount`. `dishes.ts`
perde esses três campos e fica só com o que é editorial da home (`tagline`, `plate`,
`thumb`, `video`, `reviews`, `ingredients`), casando por `slug`. `reviews` e
`ingredients` **não** viram tabela nesta spec — reviews são uma fase própria e
ingredientes não têm consumidor além do painel da home.

## Modelo

```prisma
model Category {
  id       String    @id @default(cuid())
  slug     String    @unique          // "sushi", "rolls", ...
  label    String                     // "Sushi", "Rolls & Temaki"
  position Int                        // ordem das abas do /cardapio
  products Product[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("categories")
}

model Product {
  id String @id @default(cuid())

  // O slug é o id humano de hoje ("sushi-10", "niguiri-salmao"). Ele NÃO é
  // decorativo: é o valor que já está gravado no localStorage dos carrinhos em
  // uso. `parseItems` (CartProvider.tsx:68) só valida `typeof id === "string"`,
  // então um item antigo sobrevive ao parse e só quebraria mais tarde, ao ser
  // casado com o banco. Mantendo o slug, esses carrinhos continuam resolvendo.
  slug String @unique

  name        String
  description String
  weight      String   // "10 un.", "300 ml" — texto livre, como hoje

  // Decimal, não Float. O erro é real e observável: 100 * (1 - 90/100) devolve
  // 9.999999999999998. Hoje `brl.format` e `arredondar()` mascaram isso, mas as
  // colunas de Orders/OrderItems/Payments têm que casar com esta decisão, e lá
  // o centavo perdido é dinheiro perdido. Definir agora evita migrar depois.
  price Decimal @db.Decimal(10, 2)

  // Percentual inteiro 0..100, como hoje. Nulo = sem desconto.
  discount Int?

  image String // caminho em /public por enquanto; ver "Fora de escopo"

  available Boolean @default(true) // esgotar sem apagar o histórico

  categoryId String
  // Restrict, não Cascade: apagar uma categoria não pode evaporar produtos que
  // já aparecem em pedidos. O admin terá que mover os produtos primeiro.
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([categoryId])
  @@map("products")
}
```

### Por que `Category` é tabela e não continua sendo union de string

`MenuCategory` é hoje um union type. A Fase 06 pede "Categorias" como item de CRUD —
e um union no TypeScript não sobrevive a isso: criar categoria viraria deploy. O
array `CATEGORIES` de `menu.ts` vira o seed, com `position` preservando a ordem atual
das abas (sushi, rolls, entradas, quentes, sobremesas, bebidas).

### Por que `available` e não `deletedAt`

Esgotar um prato e removê-lo do cardápio são ações diferentes com a mesma restrição:
nenhuma das duas pode sumir com o produto, porque `OrderItems` vai apontar para ele.
`available` cobre o caso do dia a dia. Remoção definitiva fica para quando `Orders`
existir e a regra de integridade puder ser escrita contra ele.

## Camada de leitura

`lib/catalogo/queries.ts` — funções `server-only`, sem rota HTTP:

```ts
export type ProdutoDTO = {
  slug: string;
  name: string;
  description: string;
  weight: string;
  image: string;
  price: number;       // preço de tabela ("de")
  unitPrice: number;   // já com desconto ("por"), calculado no servidor
  discount: number | null;
};
```

Dois motivos para o DTO existir em vez de devolver o registro do Prisma:

1. **`Decimal` não é serializável** entre Server e Client Component. A conversão
   precisa acontecer em algum lugar; melhor que seja um lugar só.
2. **`unitPrice` sai pronto do servidor.** Hoje `precoFinal()` (`_lib/price.ts`) roda
   no cliente com float. Passando já calculado, o cliente deixa de fazer aritmética
   de dinheiro — o mesmo princípio que já vale para o percentual do cupom, que o
   cliente nunca calcula nem persiste.

`_lib/price.ts` deixa de ser usado para o cardápio. Fica só se sobrar consumidor.

## Mudanças nas páginas

**`/cardapio`** — `page.tsx` (já Server Component) busca categorias + produtos e
passa como props para `CardapioClient`, que hoje importa `menu` e `CATEGORIES`
diretamente. O estado de aba ativa e o filtro continuam client-side, sem mudança
visual. `MenuItemCard` passa a receber `ProdutoDTO`.

**Home** — `page.tsx` (já Server Component, já passa `dishes` como prop) busca os 4
produtos pelos slugs de `dishes.ts` e mescla: `Dish` fica com os campos editoriais e
recebe `name`/`price`/`unitPrice` do banco. `SectionStage` e a árvore GSAP abaixo
dela não mudam de formato de prop além disso.

**`deDish` / `deMenuItem`** (`_data/cart.ts`) — passam a receber o DTO. O `menu.find`
de contorno some, porque a divergência que ele contornava deixa de existir.

**`_data/menu.ts` é deletado.** Seu conteúdo vira o seed.

## Seed

`prisma/seed.ts`, idempotente por slug:

- `upsert` de categoria por `slug`, depois `upsert` de produto por `slug`.
- **Nunca `deleteMany` nem `TRUNCATE`.** Rodar duas vezes atualiza, não duplica.
- Preços entram como **string** (`"89.90"`), não `number` — passar float para uma
  coluna Decimal reintroduz pela porta dos fundos exatamente o erro que a coluna
  existe para evitar.
- No Prisma 7 o seed **não** se configura mais pela chave `prisma.seed` do
  `package.json`: vai em `prisma.config.ts`, em `migrations.seed`. Rodar um `.ts`
  ali exige um runner — `tsx` entra como devDependency (o projeto ainda não tem
  um; `vitest` não serve para isso).

## Verificação

1. `npx prisma migrate dev` cria as duas tabelas; `npm run db:seed` popula 6
   categorias e 22 produtos; rodar o seed **duas vezes** e conferir que continua 22.
2. Query direta confirmando que `price` de `sushi-10` é `89.90` exato.
3. `npx tsc --noEmit` e `npm run lint` limpos. A deleção de `menu.ts` tem que
   quebrar o build se algum consumidor tiver escapado — é o teste de cobertura.
4. Testes existentes (58) continuam passando; a tabela `coupons` não é tocada.
5. CDP no `/cardapio`: as 6 abas filtram, os 22 cards renderizam, os 3 itens com
   desconto (`sashimi-misto` 15%, `temaki-salmao` 10%, `yakisoba` 15%,
   `sake-quente` 10%) mostram badge e preço riscado iguais aos de antes.
6. CDP na home: os 4 pratos do hero exibem preço, e adicionar ao carrinho grava a
   mesma linha que o `/cardapio` grava para o mesmo produto.
7. **Compatibilidade de carrinho antigo:** semear o `localStorage` com um item de id
   `sushi-10` no formato atual, recarregar `/carrinho`, e confirmar que a linha
   continua aparecendo com o preço correto.

## Fora de escopo (deliberado)

- **CRUD e upload de imagem.** Dependem de auth (Fase 05). `image` continua `String`
  com caminho relativo; onde o upload grava (disco, S3, Blob) não altera o schema.
- **`Reviews` e `Ingredients` como tabelas.** Ficam em `dishes.ts` como conteúdo
  editorial da home.
- **Os outros 7 modelos** (`Users`, `Employees`, `Customers`, `Reservations`,
  `Orders`, `OrderItems`, `Payments`).
- **Ligar `Coupon` a `Customer`/`Order`.** Continua pendente e documentado: hoje
  `Coupon.email` não tem FK e não há `orderId`, então não existe trilha de auditoria
  do resgate. Resolver isso exige `Customers` e `Orders`, que não existem ainda.
