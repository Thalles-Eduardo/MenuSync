# Galeria / Ambiente — Design

**Data:** 2026-07-11
**Branch:** feat/bento-cardapio
**Status:** Aprovado

## Objetivo

Adicionar uma nova section "Galeria / Ambiente" à landing page do MenuSync, mostrando 6 fotos curadas (ambiente, pratos, equipe) num mosaico editorial, com hover rico e um lightbox navegável. A section entra entre o Bento (cardápio) e o Sobre.

## Decisões (do brainstorming)

| Tema | Decisão |
|------|---------|
| Posição na página | Entre `HomeExperience` (hero + bento) e `AboutSection` |
| Fonte das imagens | O usuário adiciona arquivos em `public/gallery/` |
| Quantidade | 6 fotos |
| Formatos | Mistos (paisagem + retrato) |
| Layout | **C · Mosaico editorial** — foto-herói vertical + mosaico |
| Clique na foto | **Lightbox com navegação** (setas, teclado ←/→/Esc, legenda) |
| Hover | Zoom sutil + legenda subindo sob gradiente |
| Entrada no scroll | **Revelação escalonada** (fade + subida, stagger) |
| Fundo da section | Dark-blue limpo (sem imagem de fundo — as fotos são a estrela) |

## Arquitetura

Três unidades novas + uma edição de wiring, cada uma com responsabilidade única.

### 1. Dados — `app/(site)/_data/gallery.ts`

```ts
export type GalleryImage = {
  src: string;      // /gallery/g1.webp ... g6.webp
  alt: string;      // texto alternativo (acessibilidade)
  caption: string;  // legenda exibida no hover e no lightbox
};

export const galleryImages: GalleryImage[] = [ /* 6 itens */ ];
```

- Nomes de arquivo fixos e previsíveis: `/gallery/g1.webp` … `/gallery/g6.webp`. O usuário só precisa soltar 6 arquivos com esses nomes.
- `g1` é a foto-herói (retrato, ocupa a coluna esquerda em 2 linhas). As demais são o mosaico.
- Legendas iniciais plausíveis (ex.: "Balcão de sushi", "Salão principal", "Chef ao robata", "Detalhe do prato", "Adega de saquê", "Fachada na Liberdade") — o usuário ajusta.

### 2. `app/(site)/_components/GallerySection.tsx` (client)

- `"use client"` — precisa de estado (lightbox) e GSAP (entrada).
- **Header:** rótulo `Galeria` (amarelo, uppercase, tracking) + título "O ambiente e os pratos" em Eczar — mesmo padrão tipográfico de Bento/Sobre.
- **Fundo:** `backgroundColor: var(--color-dark-blue)`, sem imagem. Fotos são o foco.
- **Estado:** `const [openIndex, setOpenIndex] = useState<number | null>(null)`.
- **Grid mosaico** com `grid-template-areas` (desktop, `md:` pra cima):
  ```
  "hero  a  a"
  "hero  b  c"
  "d     e  e"
  ```
  - `hero` = g1 (retrato, coluna esquerda, 2 linhas); `a`=g2, `b`=g3, `c`=g4, `d`=g5, `e`=g6.
  - Colunas: `1.3fr 1fr 1fr`; linhas de altura consistente (`grid-auto-rows` ~ 200px, ajustado no live-tuning via CDP).
  - Responsivo: abaixo de `md`, colapsa para 1 coluna empilhada (ou 2 colunas simples) — o mosaico assimétrico não se aplica em telas estreitas.
- Cada célula é um `<button type="button" aria-label={...} onClick={() => setOpenIndex(i)}>` com classe `.gallery-cell` (alvo da animação de entrada) e `group` (para o hover).
  - Dentro: `<Image fill className="object-cover ... group-hover:scale-105">` + overlay de legenda (`div` com gradiente escuro + texto) que sobe com `translate-y` no `group-hover`.
- Renderiza `<GalleryLightbox images={galleryImages} openIndex={openIndex} onClose={...} onNavigate={...} />`.

### 3. `app/(site)/_components/GalleryLightbox.tsx` (client)

- Portal via `createPortal` para `document.body` — escapa de ancestrais com `transform` (mesmo padrão já usado no `PlayVideoButton`).
- Gate `useHydrated` (`useSyncExternalStore`) para render seguro no cliente.
- Aberto quando `openIndex !== null`. Mostra `images[openIndex]` em tela cheia:
  - Fundo escuro (`bg-black/90`), imagem `object-contain` com `max-h-[85vh]`.
  - Botões anterior/próximo (setas) — navegação circular entre as 6.
  - Legenda (`caption`) exibida embaixo.
  - Botão de fechar (X).
- **Teclado:** `←`/`→` navegam, `Esc` fecha (listener em `window` enquanto aberto).
- **Backdrop:** clique fora da imagem fecha.
- **Scroll lock:** trava o scroll do body enquanto aberto (restaura ao fechar).
- **Acessibilidade:** `role="dialog"`, `aria-modal="true"`, foco movido para o dialog ao abrir e devolvido ao botão de origem ao fechar; foco preso no dialog.
- Animação de abertura: fade/scale suave via GSAP (curto), respeitando reduced-motion.

### 4. Animações

- **Entrada (scroll):** `useGSAP` + `ScrollTrigger` no escopo da section:
  ```
  gsap.from(".gallery-cell", {
    scrollTrigger: { trigger: scope, start: "top 75%", once: true },
    y: 28, opacity: 0, duration: 0.7, stagger: 0.1, ease: "power3.out",
  });
  ```
  Guarda de `prefers-reduced-motion` (retorna cedo, igual ao `AboutSection`).
- **Hover (CSS):** `group-hover:scale-105` na imagem (transição ~500ms) + legenda revelada por `translate-y` sob gradiente. No touch, a legenda pode ficar sempre visível (sem depender de hover).

### 5. Wiring — `app/(site)/page.tsx`

```tsx
<Loader />
<HomeExperience dishes={dishes} />
<GallerySection />
<AboutSection />
```

## Acessibilidade

- Fotos são `<button>` com `aria-label` descritivo (usa `caption`/`alt`).
- Lightbox: modal com `role="dialog"`, `aria-modal`, Esc, trap e restauração de foco.
- Todas as imagens têm `alt`.
- `prefers-reduced-motion`: desliga a entrada escalonada e a animação de abertura do lightbox; o lightbox continua funcional (sem transições).

## Responsivo / fallback

- Desktop (`md+`): mosaico completo com `grid-template-areas`.
- Mobile/tablet estreito: grid colapsa para empilhamento (1 col) ou 2 colunas simples; sem a assimetria hero.
- SSR-safe: lightbox só renderiza conteúdo após hidratação; portal só no cliente.

## Verificação (live, via CDP)

- Screenshot da section em desktop e mobile (mosaico + colapso).
- Abrir lightbox, navegar ←/→, fechar com Esc/backdrop.
- Confirmar entrada escalonada no scroll e o fallback com reduced-motion.
- Placeholders temporários (blocos com legenda) até os arquivos reais existirem, para validar layout sem depender das fotos.

## Fora de escopo (YAGNI)

- Upload/gerenciamento de imagens (arquivos estáticos apenas).
- Filtros/categorias, paginação, zoom-pan dentro do lightbox.
- Vídeos na galeria.
- Legendas multi-idioma.

## Restrição do repositório

Commitar **apenas** os arquivos desta feature via caminhos explícitos (nunca `git add -A`/`.`). Preservar todo o WIP não commitado do usuário (`.gitignore`, `README.md`, `HeroShowcase.tsx`, `app/globals.css`, `next.config.ts`, ícones, etc.).
