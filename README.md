# 🍽️ MenuSync

> Site de um restaurante japonês com home imersiva e painel de gestão, desenvolvido com Next.js, TypeScript, PostgreSQL, Prisma e Docker.

---

# 📌 Objetivo

Desenvolver o site de um restaurante japonês com uma home moderna e interativa, além de um painel administrativo para gerenciar cardápio, pedidos, clientes, mesas, reservas, estoque, funcionários e financeiro.

---
# 🛠 Stack

## Front-end

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- GSAP
- React Hook Form
- Zod

## Back-end

- Next.js Route Handlers
- Prisma ORM
- PostgreSQL
- Resend (e-mail transacional)

## Infraestrutura

- Docker
- Docker Compose

---

# ▶️ Como rodar

## Pré-requisitos

- **Node 20+**
- **Docker** (com Docker Compose) — sobe o Postgres

## 1. Variáveis de ambiente

```bash
cp .env.example .env
```

O que preencher no `.env`:

| Variável | O que é |
|---|---|
| `DATABASE_URL` | Já vem pronta para o Postgres do `docker-compose.yml`. Só mude a porta se você tiver mudado `POSTGRES_PORT`. |
| `RESEND_API_KEY` | **Precisa ser preenchida.** Pegue no painel da [Resend](https://resend.com) em _API Keys_. |
| `COUPON_FROM_EMAIL` | Remetente. O padrão `onboarding@resend.dev` funciona sem verificar domínio — veja a nota de sandbox abaixo. |
| `COUPON_FROM_NAME` | Nome de exibição do remetente. |

**Sem `RESEND_API_KEY` o app inteiro continua funcionando** — home, cardápio,
carrinho, banco. O que quebra é apenas o envio do cupom: `POST /api/coupons`
grava a linha e responde `502 SEND_FAILED` na hora de chamar o provedor.

## 2. Banco

```bash
docker compose up -d
```

Sobe o `postgres:17-alpine` com volume nomeado e healthcheck. A porta do **host**
é `5432` por padrão; se ela já estiver ocupada por outro Postgres na sua máquina,
defina `POSTGRES_PORT` no `.env` (ex.: `POSTGRES_PORT=5434`) **e reflita a mesma
porta na `DATABASE_URL`** — o compose lê essa variável, mas a URL não é derivada
dela automaticamente.

## 3. Dependências e migrations

```bash
npm install
npx prisma migrate dev
```

O `npm install` já roda `prisma generate` no `postinstall`. O `migrate dev` cria
o schema e aplica as migrations de `prisma/migrations/`.

## 4. Subir a aplicação

```bash
npm run dev
```

Disponível em `http://localhost:3000`.

## 5. Testes

```bash
npm test          # roda uma vez
npm run test:watch
```

Os testes de integração do cupom batem no **Postgres real**, então exigem o
container do passo 2 no ar e o `.env` com `DATABASE_URL` válida. Eles rodam em
série e limpam apenas as linhas do próprio domínio de teste (`@vitest.local`),
sem tocar nos demais dados. O envio de e-mail é sempre substituído por um stub —
nenhum teste chama a Resend.

> **Nota — modo sandbox da Resend.** O remetente padrão só entrega para o e-mail
> dono da conta; qualquer outro destinatário volta como erro. Os detalhes e como
> sair disso estão na nota da seção **Cupom por e-mail** (Fase 03).

---

# 📁 Estrutura do Projeto

```

src/
├── app/
│   ├── (site)/
│   │   ├── page.tsx
│   │   ├── cardapio/
│   │   ├── contato/
│   │   └── reserva/
│   │
│   ├── (admin)/
│   │   ├── dashboard/
│   │   ├── pedidos/
│   │   ├── estoque/
│   │   ├── funcionarios/
│   │   └── clientes/
│   │
│   ├── api/
│   ├── layout.tsx
│   └── globals.css
│
├── features/
│   ├── auth/
│   ├── menu/
│   ├── pedidos/
│   ├── mesas/
│   ├── reservas/
│   ├── estoque/
│   ├── produtos/
│   ├── categorias/
│   ├── clientes/
│   ├── funcionarios/
│   ├── pagamentos/
│   ├── relatorios/
│   └── dashboard/
│
├── shared/
├── lib/
├── config/
├── types/
└── middleware.ts
```

---

# 📌 Arquitetura

O projeto seguirá o padrão **Feature-First**, onde cada funcionalidade possui sua própria organização interna.

Exemplo:

```
features/
└── pedidos/
    ├── components/
    ├── actions/
    ├── services/
    ├── hooks/
    ├── schemas/
    ├── types/
    ├── utils/
    └── index.ts
```

Cada feature deve ser independente e reutilizável.

---

# 🚀 Roadmap

---

# Fase 01 — Planejamento

## Objetivo

Definir toda a arquitetura antes do desenvolvimento.

### Tarefas

- [x] Definir nome do sistema
- [x] Criar identidade visual
- [x] Definir paleta de cores
- [x] Definir tipografia
- [x] Criar logotipo
- [x] Configurar repositório

---

# Fase 02 — Design System

## Objetivo

Construir a base visual do projeto no Figma.

---

# Fase 03 — Home / Landing

### Seções

- [x] Hero (prato em destaque interativo)
- [x] Pratos em destaque
- [x] Sobre o restaurante (About)
- [x] Reservas (CTA)
- [x] Cupom por e-mail
- [x] Footer

## Página separada

- [x] Cardápio
- [x] Carrinho

## Cupom por e-mail

Captura de lead na home: o visitante digita um **e-mail válido** no campo de cupom e **recebe o cupom por e-mail**.

Fluxo:

1. Campo de e-mail na home, com validação (Zod: formato válido e obrigatório).
2. Submit chama uma Route Handler (`POST /api/coupons`).
3. O backend valida o e-mail, gera/associa um código de cupom (registro em `Coupons`) e o vincula ao e-mail.
4. Envio do e-mail transacional com o cupom (Resend).
5. Feedback na UI: sucesso, e-mail já cadastrado ou erro.

Regras:

- [x] Um cupom por e-mail (evitar duplicidade)
- [x] Rate limit anti-abuso no endpoint
- [x] Cupom com código, validade e status (ativo / usado / expirado)

> **Nota — modo sandbox.** O envio usa o remetente `onboarding@resend.dev`, que
> dispensa verificar um domínio, mas a Resend **só entrega para o e-mail dono da
> conta**. Qualquer outro destinatário é recusado e a API responde `502` — com o
> cupom **já gravado**, porque a persistência acontece antes do envio. Para
> entregar a endereços quaisquer, verifique um domínio no painel da Resend e
> troque `COUPON_FROM_EMAIL` no `.env`; nenhum código muda.
>
> O status `USED` ainda não é escrito por ninguém: o resgate no checkout é da
> Fase 07. Também não há job que vire `ACTIVE` em `EXPIRED` — hoje só o campo
> `expiresAt` é gravado.

---

# Fase 04 — Banco de Dados

## Modelagem

- [ ] Users
- [ ] Employees
- [ ] Customers
- [ ] Categories
- [ ] Products
- [ ] Reservations
- [ ] Orders
- [ ] OrderItems
- [ ] Payments
- [x] Coupons (código, e-mail, validade, status — ver "Cupom por e-mail" na Fase 03)

---

# Fase 05 — Autenticação (Admin)

> Apenas acesso administrativo (dono/funcionários). Sem contas nem login de cliente.

- [ ] Login
- [ ] Recuperação de senha
- [ ] Tokens
- [ ] Sessão
- [ ] Permissões (por cargo)
- [ ] Middleware

---

# Fase 06 — Dashboard ADMIN

## Dashboard

- [ ] KPIs
- [ ] Cards
- [ ] Gráficos
- [ ] Estatísticas

---

## Produtos

- [ ] CRUD
- [ ] Upload de imagens
- [ ] Categorias

---

## Estoque

- [ ] Entrada
- [ ] Saída
- [ ] Alertas

---

## Pedidos

- [ ] Criar pedido
- [ ] Atualizar status
- [ ] Histórico

---

## Clientes

- [ ] Cadastro
- [ ] Histórico
- [ ] Fidelidade

---

## Funcionários

- [ ] Cadastro
- [ ] Permissões
- [ ] Cargos

---

## Financeiro

- [ ] Receita
- [ ] Despesas
- [ ] Fluxo de caixa
- [ ] Relatórios

---

# Fase 07 — Cardápio Digital

- [ ] Categorias
- [ ] Pesquisa
- [ ] Produtos
- [ ] Carrinho
- [ ] Checkout
- [ ] QR Code

---

# Fase 08 — Reservas

- [ ] Calendário
- [ ] Reservas
- [ ] Mesas disponíveis

---

# Fase 09 — Pagamentos

- [ ] PIX
- [ ] Cartão
- [ ] Webhooks

---

# Fase 10 — Docker

- [ ] Dockerfile
- [ ] Docker Compose
- [ ] PostgreSQL
- [ ] Volumes
- [ ] Variáveis de ambiente

---

# Fase 11 — Deploy

- [ ] VPS
- [ ] SSL
- [ ] Domínio
- [ ] Nginx
- [ ] CI/CD

---

# Fase 12 — Qualidade

- [ ] Testes
- [ ] Performance
- [ ] SEO
- [ ] Lighthouse
- [ ] Responsividade
- [ ] Acessibilidade

---

