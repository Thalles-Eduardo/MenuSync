# Plano — Cupom por e-mail: backend real

**Spec:** `docs/superpowers/specs/2026-07-20-cupom-backend-design.md`
**Branch:** `feat/sakura-cardapio`

Regras gerais para quem executar:

- Um commit por task, mensagem em pt-BR no padrão do repo (`feat(scope): ...`).
- **Nunca** usar here-string de PowerShell (`@'...'@`) na ferramenta Bash — use heredoc
  (`git commit -F - <<'EOF'`). Isso já quebrou commits nesta branch antes.
- Comentários em pt-BR, explicando **por quê**, no estilo do código existente.
- Não commitar `.env`. `.gitignore` já cobre `.env*` — confirme, não presuma.

---

## Task 1 — Infra: Docker Compose + Postgres

- `docker-compose.yml` na raiz: serviço `db`, imagem `postgres:17-alpine`, volume
  nomeado `menusync-pgdata`, porta `5432:5432`, `healthcheck` com `pg_isready`.
- Credenciais vindas do env com defaults de desenvolvimento explícitos.
- `.env.example` commitado:
  ```
  DATABASE_URL="postgresql://menusync:menusync@localhost:5432/menusync?schema=public"
  MAILERSEND_API_KEY=""
  COUPON_FROM_EMAIL="cupom@seudominio.com"
  COUPON_FROM_NAME="MenuSync"
  ```
- **Verificar:** `docker compose up -d` e `docker compose ps` mostrando `healthy`.

## Task 2 — Prisma: schema, client, migration

- Instalar `prisma` (dev) e `@prisma/client`.
- `prisma/schema.prisma` com o enum `CouponStatus` e o model `Coupon` **exatamente**
  como na spec (`email @unique`, `code @unique`, `@@map("coupons")`).
- `lib/prisma.ts`: singleton com guarda de HMR —
  `globalThis.prisma ?? new PrismaClient()`, só reatribuindo o global fora de produção.
  Sem isso o dev do Next abre uma conexão por reload e estoura o pool.
- `package.json`: `"postinstall": "prisma generate"`.
- **Verificar:** `npx prisma migrate dev --name init_coupons` aplica; a tabela
  `coupons` existe com os índices únicos em `email` e `code`.

## Task 3 — `lib/env.ts`

- Schema Zod: `DATABASE_URL` url obrigatória; `MAILERSEND_API_KEY` string mín. 1;
  `COUPON_FROM_EMAIL` e-mail válido; `COUPON_FROM_NAME` com default `"MenuSync"`.
- Exportar `getEnv()` que valida na primeira chamada e cacheia o resultado.
  **Não** validar no escopo do módulo — quebraria `npm run build` sem `.env`
  (ver "Nota de build" na spec).
- Em falha, lançar erro listando as chaves faltantes **sem** imprimir os valores.
- **Verificar:** `npm run build` passa mesmo sem `.env` presente.

## Task 4 — Geração do código

- `lib/coupons/code.ts`: `gerarCodigo()` usando `crypto.randomInt` (nunca
  `Math.random`), alfabeto `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, 8 chars,
  prefixo `SAKURA10-`.
- Comentário explicando por que a origem é criptográfica: o código concede desconto.
- **Verificar:** 10.000 códigos gerados, todos casando `^SAKURA10-[A-Z2-9]{8}$` e sem
  duplicatas.

## Task 5 — Rate limit

- `lib/rate-limit.ts`: janela fixa em memória, `Map<string, {count, resetAt}>`,
  default 5 requisições / 10 min por chave, com limpeza dos registros expirados.
- Comentário declarando a limitação (zera no restart, é por instância, `x-forwarded-for`
  é forjável sem proxy confiável) — declarada, não escondida.
- **Verificar:** unitariamente — 5 passam, a 6ª é bloqueada, e após a janela libera.

## Task 6 — Mailer (MailerSend)

- `lib/coupons/mailer.ts`: interface `EnviadorDeCupom` + implementação MailerSend
  via `fetch` (sem SDK — o contrato é um POST JSON simples).
- `POST https://api.mailersend.com/v1/email`, `Authorization: Bearer <token>`.
  Sucesso é **202 Accepted com corpo vazio** — não tente `.json()` no sucesso.
  `to` é **array** de `{ email }`. Timeout de 10s via `AbortSignal.timeout`.
- Assunto/corpo em pt-BR com o código e a validade. HTML simples, sem imagem externa.
- **Nunca** logar o e-mail inteiro nem o código; helper de redação
  (`f***@dominio.com`) para os logs.
- Erro de envio propaga como erro tipado, para o handler transformar em resposta
  genérica.

## Task 7 — Serviço do cupom

- `lib/coupons/service.ts`: `criarOuRecuperarCupom(email)`.
- Normaliza (`trim().toLowerCase()`), gera código, tenta `prisma.coupon.create`.
- Em `P2002`:
  - alvo `email` → `findUnique` e devolve o existente, marcado como `jaExistia: true`;
  - alvo `code` → regenera e tenta de novo (máx. 3).
- **Proibido** `findFirst` antes do `create` — a constraint é a garantia (ver spec).
- Retorna `{ coupon, jaExistia }`; quem chama **não** usa `jaExistia` para variar a
  resposta HTTP, só para telemetria/log.
- **Verificar:** coberto pela suite da Task 9 (inclusive o teste de corrida).

## Task 8 — `POST /api/coupons`

- `app/api/coupons/route.ts`, com `export const runtime = "nodejs"` e
  `export const dynamic = "force-dynamic"`.
- Ordem exata: rate limit → Zod → serviço → envio → resposta.
- Shape de erro único: `{ error: { code, message } }`; códigos
  `RATE_LIMITED` (429), `INVALID_EMAIL` (400), `SEND_FAILED` (502), `INTERNAL` (500).
- Sucesso: **sempre** `200 { ok: true }`. Nunca o código do cupom, nunca sinal de que
  o e-mail já existia.
- `catch` final loga `error.stack` no servidor com um id de erro e devolve só o id ao
  cliente. Nada de stack/detalhe do banco na resposta.
- **Verificar:** Task 9.

## Task 9 — Suite de integração

- `scratchpad/verify-coupons.mjs`, contra o Postgres do Docker, servidor em dev.
- Casos, todos com asserção explícita (ver spec, seção Verificação):
  válido → 200 + 1 linha + formato do código · repetido → mesma linha, mesmo código ·
  `FOO@X.com` → não cria segunda linha · inválido → 400 · janela estourada → 429 ·
  **corpo nunca contém o código** · **5 requisições simultâneas → exatamente 1 linha**.
- Limpar a tabela no começo para o estado ser determinístico.
- Registrar o mailer como stub nesta suite (não gastar cota do provedor); o envio real
  é a Task 11.

## Task 10 — Frontend: plugar a API

- `FooterSection.tsx`:
  - remover `makeCoupon()` e o estado `coupon`;
  - `onSubmit` → `fetch("/api/coupons", ...)`, mantendo a validação Zod client-side
    (feedback imediato) — a do servidor é a que vale;
  - sucesso: mensagem genérica, **sem código na tela**
    ("Pronto! Se estiver tudo certo com o e-mail, o cupom já está a caminho.");
  - 429 → "Muitas tentativas. Tente de novo em alguns minutos.";
  - falha de rede/5xx → estado de erro;
  - preservar `aria-live`, `aria-invalid`, label `sr-only` e o `disabled` do botão.
- **Bug pré-existente a corrigir junto:** a classe do input está `bg-dark-blue\60`
  (contrabarra) onde deveria ser `bg-dark-blue/60`. Confirme no arquivo antes de mexer.
- **Verificar:** CDP em 1440×900 — sucesso genérico sem código visível, erro no e-mail
  inválido, e contraste do texto de feedback conferido (não estimado).

## Task 11 — Envio real + README

- Com `MAILERSEND_API_KEY` real no `.env` e o domínio do remetente verificado no
  painel da MailerSend (o usuário fornece os dois), disparar um envio de verdade e
  confirmar a chegada. Sem o domínio verificado a API devolve 422 `#MS42207`.
- `README.md` — marcar **só** o que foi entregue:
  - Fase 03, regras do cupom: marcar "Um cupom por e-mail" e "Rate limit anti-abuso";
    marcar "Cupom com código, validade e status".
  - Fase 04: marcar **apenas** `Coupons`. Os demais models continuam pendentes.
  - **Não** marcar nada da Fase 07 nem da Fase 10 — Docker aqui é só de desenvolvimento,
    o Dockerfile da aplicação não existe.
- Atualizar a stack no topo do README se ela ficar desatualizada (hoje diz "Next.js 15";
  o projeto está no 16.2.9) — corrija apenas se for verdade.
