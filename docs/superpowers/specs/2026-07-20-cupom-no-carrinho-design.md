# Spec — Resgate do cupom no carrinho

**Data:** 2026-07-20
**Branch:** `feat/sakura-cardapio`
**Fase (README):** Fase 07 — "Checkout" (parte do resgate)

## Contexto

O cupom já é gerado, persistido e enviado por e-mail
(`2026-07-20-cupom-backend-design.md`). Falta o outro lado: o visitante recebe
`SAKURA10-XXXXXXXX` na caixa de entrada e hoje **não tem onde usá-lo**. O `status`
`USED` do model `Coupon` nunca é escrito por ninguém.

Esta entrega adiciona o campo de resgate no `/carrinho` e fecha o ciclo.

## A decisão que define tudo: o desconto vem do servidor, sempre

O carrinho persiste em `localStorage`, que é **editável pelo usuário**. Se
guardássemos o percentual do desconto junto com o código, qualquer pessoa abriria o
DevTools e trocaria `10` por `90`.

Portanto:

- **`localStorage` guarda apenas o `code`** — nunca o percentual, nunca o valor.
- O percentual **sempre** vem da resposta da API, a cada carregamento da página.
- Na hidratação, se houver código salvo, ele é **revalidado** contra o servidor
  antes de qualquer desconto aparecer na tela.
- O total exibido é informativo. Num checkout real o servidor recalcularia o preço
  do zero; como não há model de pedido ainda, isso fica registrado como limitação.

É o mesmo princípio que tirou o código do corpo da resposta na entrega anterior:
o cliente não é fonte de verdade sobre nada que valha dinheiro.

## Mudança de schema

`Coupon` ganha um campo:

```prisma
percent   Int @default(10)   // desconto em %, decidido pelo servidor
```

Sem ele o desconto ficaria implícito no prefixo `SAKURA10-`, e o frontend teria
que inferir "10" de uma string — frágil e, pior, poria a regra de negócio no
cliente. Com a coluna, uma campanha futura de 20% é um `INSERT`, não um deploy.

## Endpoints

### `POST /api/coupons/validate` — consulta, não consome

Body `{ code }`. Responde `200 { valid: true, code, percent }` ou erro.

Códigos de erro: `INVALID_CODE` (400, formato), `NOT_FOUND` (404),
`ALREADY_USED` (409), `EXPIRED` (410), `RATE_LIMITED` (429).

**Distinguir os motivos é intencional aqui**, ao contrário do endpoint de geração:
lá a resposta genérica evitava revelar quem está na base; aqui quem chega com um
código válido **já possui o código**, que é a própria credencial. Dizer "esse cupom
já foi usado" é UX boa e não entrega nada que o portador não saiba.

**Rate limit é a defesa central deste endpoint.** São ~40 bits de entropia
(32⁸ ≈ 1,1×10¹²), inviável de força bruta *desde que* haja limite. Sem limite, um
atacante distribuído varre o espaço. Cota mais apertada que a de geração:
**10 tentativas / 10 min por IP**.

### `POST /api/coupons/redeem` — consome, atômico

Chamado ao finalizar o pedido. Marca `USED`.

**Obrigatoriamente por update condicional**, nunca ler-depois-escrever:

```ts
const { count } = await prisma.coupon.updateMany({
  where: { code, status: "ACTIVE", expiresAt: { gt: new Date() } },
  data: { status: "USED" },
});
if (count !== 1) throw ...   // ja consumido ou expirado
```

Um `findUnique` seguido de `update` tem a mesma janela de corrida do
check-then-insert que a entrega anterior evitou: dois cliques simultâneos passariam
pelas duas leituras e o cupom seria gasto duas vezes. O `updateMany` com `status`
no `where` resolve no banco, sem janela.

## Integração com o carrinho

`CartProvider` ganha:

```ts
cupom: { code: string; percent: number } | null;
aplicandoCupom: boolean;
erroCupom: string | null;
aplicarCupom(code: string): Promise<void>;
removerCupom(): void;
```

- Persiste `menusync:cupom` com **apenas o código**.
- Na hidratação, revalida contra o servidor; se a resposta não for `valid`, limpa o
  storage silenciosamente (o cupom pode ter expirado ou sido usado desde então).
- `totalFinal = total * (1 - percent / 100)`, arredondado a 2 casas.

## UI no `/carrinho`

Bloco no rodapé da lista, acima do Subtotal:

- `<form>` com `<label>` associado (visível, não `sr-only` — é um campo de ação, não
  um busca óbvio), input `text` com `autoCapitalize="characters"`, e botão "Aplicar".
- Estados obrigatórios: `default` · `hover` · `focus-visible` · `disabled` ·
  `loading` · `error` · `aplicado`.
- Aplicado: mostra o código, o percentual e um botão "remover" com `aria-label`.
- Feedback em container `aria-live="polite"`.
- Linha de desconto no resumo: `Cupom SAKURA10-XXXX (−10%)  −R$ 12,34`.
- **Contraste conferido, não estimado.** O `/carrinho` usa fundo
  `bgCardapioInk.webp` + overlay `dark-blue/70`; medir o pixel real sob o texto,
  como foi feito no rodapé (onde salmon dava 2.68:1 e reprovava).

## Arquivos

**Novos**
- `app/api/coupons/validate/route.ts`
- `app/api/coupons/redeem/route.ts`
- `lib/coupons/resgate.ts` — validar + consumir
- `app/(site)/carrinho/_components/CupomField.tsx`

**Editados**
- `prisma/schema.prisma` + migration (`percent`)
- `app/(site)/_components/CartProvider.tsx`
- `app/(site)/carrinho/_components/CarrinhoClient.tsx` (linha de desconto)
- `app/(site)/carrinho/_components/PagamentoPanel.tsx` (chama `redeem` no confirmar)

## Verificação

1. `docker compose up -d` · `prisma migrate dev` · `tsc` · `lint` · `build`
2. Suite (Vitest, ver pendência separada) cobrindo:
   - código válido → `200` com `percent`
   - **código válido NÃO vira `USED` no validate** (é o erro mais fácil de cometer)
   - inexistente → 404 · já usado → 409 · expirado → 410 · formato ruim → 400
   - **11 tentativas → 429**
   - **corrida: 5 `redeem` simultâneos do mesmo código → exatamente 1 sucesso**
   - `redeem` de cupom expirado falha mesmo com `status = ACTIVE`
3. CDP: aplicar cupom no carrinho, ver o total cair, recarregar (F5) e o desconto
   persistir; **editar `menusync:cupom` no localStorage para um percentual absurdo
   e provar que o total NÃO muda** — é a asserção que prova a decisão de design.
4. Fluxo real ponta a ponta com o cupom recebido por e-mail.

## Fora de escopo

- Model de pedido (`Orders`) — o "checkout" segue simulado
- Devolver o cupom a `ACTIVE` se o pedido for cancelado (não há cancelamento)
- Job que expira cupons (`ACTIVE` → `EXPIRED` por tempo); o `redeem` já checa
  `expiresAt`, então um cupom vencido não é resgatável mesmo marcado `ACTIVE`
- Múltiplos cupons por pedido — um por vez
