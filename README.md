# 🍽️ MenuSync

> Site de um restaurante japonês com home imersiva e painel de gestão, desenvolvido com Next.js, TypeScript, PostgreSQL, Prisma e Docker.

---

# 📌 Objetivo

Desenvolver o site de um restaurante japonês com uma home moderna e interativa, além de um painel administrativo para gerenciar cardápio, pedidos, clientes, mesas, reservas, estoque, funcionários e financeiro.

---
# 🛠 Stack

## Front-end

- Next.js 15
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

## Infraestrutura

- Docker
- Docker Compose

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
4. Envio do e-mail transacional com o cupom (MailerSend).
5. Feedback na UI: sucesso, e-mail já cadastrado ou erro.

Regras:

- [ ] Um cupom por e-mail (evitar duplicidade)
- [ ] Rate limit anti-abuso no endpoint
- [ ] Cupom com código, validade e status (ativo / usado / expirado)

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
- [ ] Coupons (código, e-mail, validade, status — ver "Cupom por e-mail" na Fase 03)

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

