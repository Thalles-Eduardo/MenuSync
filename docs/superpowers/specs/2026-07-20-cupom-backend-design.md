# Spec — Cupom por e-mail: backend real (API + Postgres + MailerSend)

**Data:** 2026-07-20
**Branch:** `feat/sakura-cardapio`
**Fase (README):** Fase 03 "Cupom por e-mail" (regras) + levanta a Fase 04 (banco)

## Contexto

A UI do cupom existe desde `2026-07-15-cupom-footer-design.md` e está completa:
validação Zod, estados idle/loading/error/success, `aria-live`, label `sr-only`.
O submit é **simulado** — `await new Promise(r => setTimeout(r, 700))` seguido de um
`makeCoupon()` client-side. A própria spec anterior marcou como fora de escopo:
Route Handler, persistência, envio, rate limit e dedupe.

Esta entrega implementa exatamente esse resto. Como não existe **nenhum** backend no
projeto (sem `prisma/`, sem `app/api/`, sem Docker, sem `.env`), ela também levanta a
infraestrutura da Fase 04 — que as features seguintes (pedidos, reservas) reaproveitam.

### Duas falhas do estado atual que motivam a mudança

1. **`makeCoupon()` roda no cliente com `Math.random()`.** Um código que concede 10% de
   desconto é fabricável no DevTools sem nunca tocar a API. A geração vai para o
   servidor com `crypto.randomInt`.
2. **Não há dedupe.** O README exige "um cupom por e-mail"; hoje nada impede repetição.

## Decisões (confirmadas com o usuário)

| Decisão | Escolha |
|---|---|
| Persistência | Docker + Postgres + Prisma (Fase 04 de verdade) |
| Envio | **MailerSend** (`POST https://api.mailersend.com/v1/email`) |
| Resposta a e-mail já cadastrado | **Genérica** — não revela se o e-mail está na base |

## Consequência da resposta genérica: o código sai da tela

A UI hoje exibe `{coupon}` em destaque após o sucesso. Isso não sobrevive à decisão de
resposta genérica: se a API devolvesse o código no corpo, qualquer um digitaria
`vitima@exemplo.com` e receberia um cupom válido sem provar acesso àquela caixa. O
código passa a existir **somente no e-mail** — que é o que o README descreve
("recebe o cupom por e-mail"). `makeCoupon()` e o estado `coupon` são removidos.

## Modelo de dados

`prisma/schema.prisma`:

```prisma
enum CouponStatus { ACTIVE USED EXPIRED }

model Coupon {
  id        String       @id @default(cuid())
  email     String       @unique          // dedupe: "um cupom por e-mail"
  code      String       @unique
  status    CouponStatus @default(ACTIVE)
  expiresAt DateTime
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  @@map("coupons")
}
```

- `email @unique` é a **única** garantia de dedupe. Nada de `findFirst` antes do
  `create` — check-then-insert tem janela de corrida e duas requisições simultâneas
  passam pelas duas. Capturamos o erro do banco (`P2002` no Prisma, `23505` no Postgres).
- **E-mail normalizado** (`trim().toLowerCase()`) antes de gravar. Sem isso
  `Foo@x.com` e `foo@x.com` viram duas linhas e o dedupe é contornável trivialmente.
- `expiresAt` = criação + 30 dias. Cobre "validade" do README.
- `status` cobre "ativo / usado / expirado". Só `ACTIVE` é escrito nesta entrega;
  `USED` fica para o checkout (Fase 07).

## Geração do código

`lib/coupons/code.ts` — `crypto.randomInt`, nunca `Math.random`:

- Alfabeto `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (32 chars, sem `I`/`O`/`0`/`1` ambíguos),
  reaproveitado do `makeCoupon()` atual.
- **8 caracteres** (≈40 bits) e não 4 (≈20 bits) — 4 chars são força-brutáveis.
- Formato `SAKURA10-XXXXXXXX`, mantendo o prefixo de marca já usado.
- Colisão de `code` é praticamente nula, mas é tratada: em `P2002` no campo `code`,
  regenera (até 3 tentativas).

## Fluxo do `POST /api/coupons`

```
1. Rate limit por IP                    → 429 se estourar
2. Zod valida o corpo                   → 400 (mensagem de validação é segura)
3. Normaliza o e-mail
4. Tenta criar o cupom
   ├─ ok        → envia e-mail com o código novo
   └─ P2002     → carrega o cupom existente e reenvia o MESMO código
5. Sempre 200 { ok: true } — sem código no corpo, sem distinguir os dois ramos
```

Falha no envio: a linha já está persistida, então retornamos erro genérico pedindo nova
tentativa. O retry reenvia o mesmo código (idempotente), não gera outro.

## Aplicação das regras de `th-backend-design`

A skill é escrita para **Express**; aqui são Route Handlers do Next. Os princípios são
agnósticos de transporte, os exemplos de middleware não. Adaptações:

| Regra da skill | Aplicação aqui |
|---|---|
| Unicidade por constraint, não check-then-insert | `email @unique` + captura de `P2002` |
| Rate limit anti-abuso | Janela fixa em memória por IP (ver limitação abaixo) |
| Erro genérico ao cliente, detalhe no log | Shape único `{ error: { code, message } }`; stack só no servidor |
| Segredos do env, validados, nunca commitados | `lib/env.ts` com Zod; `.env*` já está no `.gitignore` |
| Nunca logar PII | E-mail redigido no log (`f***@dominio.com`), nunca inteiro |
| Testar os caminhos de falha | Suite de integração cobrindo 400/429/dedupe/corrida |

Não se aplicam nesta entrega: hashing de senha, JWT, CORS, autorização por dono —
o endpoint é público e anônimo por natureza (captação de lead).

### Limitação declarada do rate limit

Janela fixa em memória: **zera a cada restart e é por instância**. Adequado para o
deploy single-container da Fase 10; ao escalar horizontalmente vira Redis ou tabela.
O IP vem de `x-forwarded-for`, que é **forjável** se nada confiável o define — em
produção o nginx da Fase 11 o define. Em dev pode vir nulo; cai num bucket único.
Isso está documentado no código, não escondido.

## Arquivos

**Novos — infra**
- `docker-compose.yml` — `postgres:17-alpine`, volume nomeado, healthcheck
- `.env.example` — template commitado (`DATABASE_URL`, `MAILERSEND_API_KEY`,
  `COUPON_FROM_EMAIL`, `COUPON_FROM_NAME`)
- `prisma/schema.prisma` + `prisma/migrations/`

**Novos — servidor**
- `lib/env.ts` — env validado por Zod, `getEnv()` com cache (ver nota de build)
- `lib/prisma.ts` — singleton do `PrismaClient` com guarda de HMR do Next dev
- `lib/rate-limit.ts` — janela fixa em memória
- `lib/coupons/code.ts` — geração com `crypto.randomInt`
- `lib/coupons/service.ts` — criar-ou-recuperar + orquestração do envio
- `lib/coupons/mailer.ts` — adaptador MailerSend atrás de uma interface
  (`fetch` direto, sem SDK). Sucesso é **202 com corpo vazio**, `to` é **array**
  de objetos, auth em `Authorization: Bearer`, e há timeout de 10s para um
  provedor lento não segurar a requisição do usuário.
- `app/api/coupons/route.ts` — handler POST

`lib/` no topo (não `app/(site)/_lib/`, que é escopo de UI) — é a pasta que o próprio
README já prevê na estrutura do projeto.

**Editados**
- `app/(site)/_components/FooterSection.tsx` — `fetch` no lugar da simulação; remove
  `makeCoupon()` e o estado `coupon`; mensagem de sucesso genérica; trata 429
- `package.json` — dep `@prisma/client`; dev `prisma`; `postinstall: prisma generate`
- `README.md` — marca as regras do cupom e os itens de Fase 04 efetivamente entregues

### Nota de build (`getEnv()` e não validação no import)

A skill pede validação de segredo **no boot**. Em Next, validar no escopo do módulo
quebraria `npm run build` em qualquer ambiente sem `.env` — e o build é um dos nossos
portões de verificação. Então `getEnv()` valida na primeira chamada e cacheia; como só
é chamado de dentro do handler, o build nunca dispara. O fail-fast continua valendo, só
que na primeira requisição em vez do import. A rota leva `runtime = 'nodejs'` e
`dynamic = 'force-dynamic'` para nunca ser prerenderizada.

## Verificação

O projeto **não tem framework de teste** (sem jest/vitest/playwright). O padrão
estabelecido é script Node + `tsc`/`lint`/`build` + CDP. Sigo esse padrão para não
introduzir vitest de carona nesta entrega — mas isso é uma **lacuna real**, e a suite
abaixo é um script, não testes de verdade. Vitest é o próximo passo natural.

1. `docker compose up -d` → Postgres saudável
2. `npx prisma migrate dev` → migration aplica limpa
3. `npx tsc --noEmit` · `npm run lint` · `npm run build` → limpos
4. **Integração contra o banco real** (`scratchpad/verify-coupons.mjs`):
   - e-mail válido → 200; uma linha; `code` casa `^SAKURA10-[A-Z2-9]{8}$`
   - mesmo e-mail de novo → 200; **continua uma linha**; mesmo código
   - `FOO@X.com` depois de `foo@x.com` → **continua uma linha** (normalização)
   - e-mail inválido → 400
   - estourar a janela → 429
   - **o corpo da resposta nunca contém o código** (asserção explícita)
   - **corrida:** 5 requisições simultâneas para um e-mail novo → **exatamente 1 linha**
     (é o teste que prova constraint em vez de check-then-insert)
5. CDP (1440×900): home → painel Contato → submit → mensagem genérica de sucesso e
   **nenhum código na tela**; e-mail inválido → erro
6. Envio real: com `MAILERSEND_API_KEY` no `.env` e o domínio do remetente
   verificado na MailerSend, um e-mail de verdade chega à caixa

## Fora de escopo

- Resgate/validação do cupom no checkout (`status: USED`) — Fase 07
- Job de expiração (`ACTIVE` → `EXPIRED`) — hoje `expiresAt` só é gravado
- Demais models da Fase 04 (Users, Orders, …) — só `Coupon` entra
- Migrar o rate limit para Redis — só ao escalar horizontalmente
