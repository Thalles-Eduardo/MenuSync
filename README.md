# 🍽️ Restaurante

> Um sistema completo para gestão de restaurantes desenvolvido com Next.js, TypeScript, PostgreSQL, Prisma e Docker.

---

# 📌 Objetivo

Desenvolver um sistema moderno para restaurantes, permitindo o gerenciamento de cardápio, pedidos, clientes, mesas, reservas, estoque, funcionários e financeiro.

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

- [ ] Definir nome do sistema
- [ ] Criar identidade visual
- [ ] Definir paleta de cores
- [ ] Definir tipografia
- [ ] Criar logotipo
- [ ] Configurar repositório

---

# Fase 02 — Design System

## Objetivo

Construir a base visual do projeto no Figma.

### Tarefas

- [ ] Tema Light
- [ ] Tema Dark
- [ ] Cores
- [ ] Tipografia
- [ ] Espaçamentos
- [ ] Botões
- [ ] Inputs
- [ ] Cards
- [ ] Dialogs
- [ ] Toasts
- [ ] Tabelas
- [ ] Sidebar
- [ ] Navbar

---

# Fase 03 — Landing Page

### Seções

- [ ] Hero
- [ ] Funcionalidades
- [ ] Benefícios
- [ ] Demonstração
- [ ] Planos
- [ ] FAQ
- [ ] Contato
- [ ] Footer

---

# Fase 04 — Banco de Dados

## Modelagem

- [ ] Users
- [ ] Restaurants
- [ ] Employees
- [ ] Customers
- [ ] Categories
- [ ] Products
- [ ] Reservations
- [ ] Orders
- [ ] OrderItems
- [ ] Payments
- [ ] Coupons

---

# Fase 05 — Autenticação

- [ ] Login
- [ ] Cadastro
- [ ] Recuperação de senha
- [ ] Tokens
- [ ] Sessão
- [ ] Permissões
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