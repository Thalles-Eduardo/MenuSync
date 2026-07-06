# Design — Hero interativo da Home (MenuSync)

**Data:** 2026-07-06
**Fase (README):** 03 — Landing Page (primeiro sub-projeto)
**Alvo:** `app/(site)/page.tsx` — tela única de hero interativo para um restaurante japonês.

---

## 1. Objetivo e escopo

Construir a **home** do site do restaurante MenuSync como uma **tela única de hero interativo**, fiel ao esboço do Figma (`esbocoHero.png`). Ao clicar num prato do carrossel inferior, a tela toda atualiza (prato central, título, preço e painel de avaliações/ingredientes).

**Dentro do escopo:**
- Componente de hero interativo com estado (prato ativo + aba ativa).
- 4 pratos com dados **hardcoded** (sem banco/Prisma ainda).
- Animações com **GSAP** (entrada, troca de prato, troca de aba) + hover em CSS.
- Desktop-first fiel ao esboço; empilhamento legível no mobile.

**Fora do escopo (passos futuros):**
- Páginas `cardapio/`, `contato/`, `reserva/`.
- Seções "Sobre", "Reserva/Contato", "Footer".
- Backend, carrinho funcional, reprodução real de vídeo, busca funcional.
- Polimento fino de mobile.

---

## 2. Layout (5 regiões do esboço)

1. **Navbar** (topo, ícones alinhados à direita): buscar (`search.svg`), menu (`menu.svg`), carrinho (`cart.svg`).
2. **Hero (esquerda):** label/tagline (`#1 Melhor prato da casa!`), título grande com o nome do prato (2 linhas, sobre o pergaminho 和食 que já faz parte de `bgHero.webp`), preço (`R$ 149,99`), e dois botões: `▶ Play no vídeo` (`play.svg`) e `🛍 Adicionar` (`cart.svg`/`order.svg`).
3. **Prato central:** imagem em alta do prato ativo (fundo transparente), sobreposta ao emblema do Fuji do `bgHero`.
4. **Painel glass (direita):** glassmorphism; abas **Comentários / Ingredientes**; conteúdo do prato ativo (cards de avaliação com avatar, nome, ★★★ e texto; ou lista de ingredientes).
5. **Carrossel (base):** 4 miniaturas clicáveis (`food1–4.webp`) com nome; marca o prato ativo.

---

## 3. Arquitetura de componentes

```
app/(site)/
├── page.tsx                 # server: importa dishes, renderiza <HeroShowcase dishes={dishes} />
├── _data/
│   └── dishes.ts            # array hardcoded dos 4 pratos + tipos
└── _components/
    ├── HeroShowcase.tsx     # "use client": dono do estado + timelines GSAP; orquestra os filhos
    ├── Navbar.tsx           # apresentação: ícones buscar · menu · carrinho
    ├── HeroText.tsx         # apresentação: tagline, título, preço, botões
    ├── DishPlate.tsx        # apresentação: imagem do prato central
    ├── ReviewsPanel.tsx     # apresentação: abas + cards de avaliação / ingredientes
    └── DishCarousel.tsx     # apresentação: miniaturas clicáveis (recebe onSelect + activeId)
```

**Princípio:** um só componente client (`HeroShowcase`) detém o estado; os demais são de apresentação (recebem props), testáveis isoladamente. Migração para `features/menu/` fica para quando o banco entrar (Fase 04).

---

## 4. Modelo de dados (`_data/dishes.ts`)

```ts
export type Review = {
  author: string;
  rating: number;      // 1–5, exibido como estrelas
  text: string;
};

export type Dish = {
  id: string;          // "teishoku" | "sopa-misso" | "sushi-10" | "okonomiyaki"
  name: string;        // "Teishoku Japonês"
  tagline: string;     // "#1 Melhor prato da casa!"
  price: number;       // 149.99
  plate: string;       // "/plate1.webp" (central, alta)
  thumb: string;       // "/food1.webp"  (miniatura)
  reviews: Review[];   // ~4 por prato
  ingredients: string[];
};

export const dishes: Dish[];
```

**Mapeamento de assets:**

| id | name | plate (central) | thumb |
|---|---|---|---|
| `teishoku` | Teishoku Japonês | `/plate1.webp` (692²) | `/food1.webp` |
| `sopa-misso` | Sopa de Missô | `/plate3.png` (1024²) | `/food3.webp` |
| `sushi-10` | Sushi 10 P/c | `/plate4.png` (1024²) | `/food4.webp` |
| `okonomiyaki` | Okonomiyaki | `/plate2.png` (1024²) | `/food2.webp` |

Dados de `reviews`/`ingredients` são fictícios porém plausíveis por prato. Preço formatado com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.

---

## 5. Estado e comportamento

Estado em `HeroShowcase`:
- `activeDishId: string` (default `"teishoku"`).
- `activeTab: 'reviews' | 'ingredients'` (default `"reviews"`).

Regras:
- Clicar numa miniatura → `setActiveDishId`. Prato central, título, preço e painel refletem o novo prato. **Trocar de prato reseta `activeTab` para `reviews`.**
- Clicar numa aba → `setActiveTab`.
- Botões `Play no vídeo` / `Adicionar` são placeholders sem ação real neste passo (podem logar/no-op).

---

## 6. Estilo

- **Fundo:** `bgHero.webp` cobrindo a viewport (`bg-cover bg-center`), altura de tela.
- **Painel glass:** `backdrop-blur`, fundo translúcido claro (~`rgba(255,255,255,.15)`), borda clara sutil, cantos arredondados.
- **Paleta** (já em `globals.css`): CTA salmão `#e36b6b`; estrelas amarelo `#e3c77b`; textos em tons claros sobre o fundo escuro.
- **Tipografia** (já em `globals.css`): título em fonte display (Ming Imperial / Eczar); corpo em sans (Geist/Mina).
- **Limpeza:** remover a regra `.hero` obsoleta de `globals.css` (o fundo passa a ser aplicado via classe utilitária no componente) e ajustar `lang="en"` → `lang="pt-BR"` em `layout.tsx`.

---

## 7. Animações (GSAP)

Dependências novas: `gsap` e `@gsap/react` (hook `useGSAP`). Nenhuma outra lib de animação.

1. **Entrada (page load):** `useGSAP` cria uma timeline no mount — hero text (fade+up), prato central (fade+scale/rotação leve), painel glass (slide da direita), miniaturas do carrossel em **stagger**.
2. **Troca de prato:** ao mudar `activeDishId`, GSAP faz cross-fade + leve rotação/escala do prato central e fade/slide de título e preço.
3. **Troca de aba:** ao mudar `activeTab`, cards do painel entram em **stagger** (fade+up).
4. **Hover/micro-interações:** elevação/escala nas miniaturas e botões via **CSS transitions** (sem lib).

`useGSAP` com `scope` no container e `dependencies` em `activeDishId`/`activeTab` para re-executar as animações certas. `prefers-reduced-motion` respeitado (animações reduzidas/desativadas).

---

## 8. Responsividade

- **Desktop (≥1024px):** grid de 3 colunas fiel ao esboço (hero | prato | painel), carrossel ancorado na base.
- **Mobile/tablet (<1024px):** regiões empilham na ordem: navbar → hero text → prato central → carrossel → painel. Legível, sem polimento fino (passo futuro).

---

## 9. Verificação

- `npm run build` e `npm run lint` sem erros.
- Rodar `npm run dev` e conferir manualmente: layout bate com o esboço no desktop; clicar em cada uma das 4 miniaturas troca prato/título/preço/painel; abas alternam comentários/ingredientes; animações de entrada, troca de prato e troca de aba ocorrem; empilhamento no mobile é legível.

---

## 10. Pendências / riscos

- Dados fictícios de avaliações/ingredientes — substituir por reais quando houver banco (Fase 04).
- Navbar sem marca/logo à esquerda (fiel ao esboço); logotipo é tarefa da Fase 01.
- Busca, carrinho e vídeo são placeholders visuais neste passo.
