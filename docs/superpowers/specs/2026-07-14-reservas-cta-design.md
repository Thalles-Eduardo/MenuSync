# Spec — Seção Reservas (CTA) com fundo pintado + entrada elástica

**Data:** 2026-07-14
**Branch:** `feat/sakura-cardapio`
**Status:** aprovado (aguardando revisão do spec)

## Contexto

A home imersiva do MenuSync é um "drum" full-screen (`SectionStage`) com 3 seções
navegáveis por uma roleta lateral (`SectionRoulette`): **Início** (Hero), **Cardápio**
(MenuBento) e **Sobre** (AboutSection). O README (Fase 03 — Home/Landing) lista a
próxima seção pendente: **Reservas (CTA)**.

Trata-se de um **call-to-action de reserva na home**, não do sistema completo de
reservas (isso é a Fase 08 — calendário, mesas, disponibilidade). O objetivo aqui é
convidar o visitante a reservar, com um layout moderno no tema japonês e duas
animações de entrada marcantes.

O usuário forneceu a arte `public/bgCTAs.webp` (2560×1440, pintura P&B: massa branca
pintada no canto inferior-esquerdo, área preta com respingos no canto superior-direito;
contém marca d'água "Magnific" na área escura por ser upscale de stock).

## Objetivo

Adicionar uma 4ª seção **Reservas (CTA)** ao drum, com:

1. Fundo derivado de `bgCTAs.webp` recolorido na **paleta do projeto** (mesmo duotone
   dos outros backgrounds).
2. Ao ativar a seção: **animação de "pintura"** — a área caramelo (ex-branca) é
   revelada como tinta sendo jogada/espalhada sobre a tela dark-blue.
3. Em seguida: os elementos da seção **entram das laterais com efeito elástico**.
4. Layout **Split editorial** (aprovado): conteúdo/CTA à esquerda, card de reserva
   rápida à direita.

## Paleta (de `app/globals.css` `@theme`)

- `--color-dark-blue: #2A2E37` (rgb 42,46,55) — base / "tela"
- `--color-caramel: #e3a56b` (rgb 227,165,107) — "tinta" (área clara recolorida)
- `--color-salmon: #e36b6b` — acento de headline
- `--color-yellow: #e3c77b` — botões primários
- `--font-eczar` — títulos serif

## Background recolorido

**Arquivo novo:** `public/bgCTAsInk.webp` (2560×1440, webp q82).

Mesmo mapeamento duotone já aplicado a `bgHeroInk`/`bgCardapioInk`/`bgAbout`
(verificado por amostragem: claro→caramel, escuro→dark-blue):

```
sharp(bgCTAs.webp)
  .resize(2560, 1440, { fit: 'cover', kernel: 'lanczos3' })
  .removeAlpha()
  .linear([0.72549, 0.46667, 0.20392], [42, 46, 55])
  .webp({ quality: 82 })
```

Onde `a = (caramel − darkblue)/255` por canal e `b = darkblue`. Resultado: massa
caramelo (ex-branca) sobre tela dark-blue (ex-preta).

**Marca d'água:** cai na área escura; sob o duotone + overlay da seção deve ficar
imperceptível. Verificar no CDP; se aparente, atenuar (crop/reposicionar o `fit:cover`
ou leve blur localizado). Não é bloqueante.

## Componente novo: `app/(site)/_components/ReservasCTA.tsx`

`"use client"`. Assinatura no padrão das outras seções ativáveis:

```ts
export default function ReservasCTA({ active = false }: { active?: boolean })
```

### Estrutura (camadas)

```
<section min-h-screen relative overflow-hidden bg-dark-blue>   // "tela vazia"
  <div .cta-paint  absolute inset-0 bg(bgCTAsInk) />           // camada de tinta (revelada)
  <div .cta-splatter ...>  2–3 respingos caramelo  </div>      // acentos do "jogar tinta"
  <div grid 2 colunas (lg) / stack (mobile)>
    <div .cta-left>   eyebrow, headline, subtexto, botão, chips  </div>
    <aside .cta-card> card de reserva rápida </aside>
  </div>
</section>
```

- **`.cta-paint`**: `background-image: url('/bgCTAsInk.webp')`, `bg-cover bg-center`.
  Estado inicial escondido via `clip-path: circle(0% at 22% 78%)`; final
  `clip-path: circle(150% at 22% 78%)`.
- **Contraste de texto:** a coluna esquerda fica sobre o caramelo → texto
  **dark-blue** (`text-dark-blue`), leitura editorial. O card direito fica sobre a
  área escura → **card de vidro** dark com texto claro. No mobile, garantir
  legibilidade (a área caramelo pode não cobrir toda a altura): usar
  `drop-shadow`/scrim leve atrás do bloco de texto se o CDP mostrar baixa leitura.

### Conteúdo

**Coluna esquerda (`.cta-left`):**
- Eyebrow: `予約 · RESERVAS` (tracking wide, cor de acento).
- Headline (Eczar, ~text-5xl/6xl): `Reserve sua ` + `<span text-salmon>mesa</span>`.
- Subtexto (~max-w-md): convite curto, ex.: "Uma noite de sabores autênticos à sua
  espera. Garanta seu lugar no balcão ou no salão."
- Botão primário amarelo **Reservar mesa** → `href="/reserva"` (rota prevista no
  README; página é Fase 08). Estilo reutilizando o botão amarelo existente
  (arredondado, `bg-yellow text-dark-blue`, hover caramel).
- Linha de **info chips**: `Ter–Dom · 18h–23h` · telefone · `Liberdade, SP`.
  Reaproveitar `PLACE` de `./about/about-data` (address, hours); telefone como
  constante local no componente.

**Card direito (`aside.cta-card`) — "Reserva rápida":**
- Card de vidro: `rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur`,
  texto claro.
- Título curto: "Reserva rápida".
- Campos visuais: **Data** (`<input type="date">`), **Pessoas** (`<select>` 1–8+),
  **Horário** (`<select>` faixas 18h–23h). Estilizados no tema.
- Botão **Reservar** (amarelo) que navega para `/reserva` (via `<form action="/reserva">`
  ou `<Link>`). CTA visual — **sem backend** nesta fase (YAGNI; fluxo real é Fase 08).

## Animações (GSAP + `@gsap/react`)

Guardas idênticas às outras seções:
- `reduce = matchMedia("(prefers-reduced-motion: reduce)").matches` via `useMemo`.
- `played = useRef(false)` — toca **uma vez** quando `active` fica true.
- `useGSAP(() => {...}, { scope, dependencies: [reduce, active] })`.

### Reduced-motion
Sem timeline: estado final imediato — `clip-path` totalmente revelado, elementos em
posição/opacidade final, respingos visíveis. (GSAP `.set` ou classes iniciais já no
estado final quando `reduce`.)

### Sequência normal (ao ativar)
1. **Pintura (~0.8s):** `gsap.fromTo(".cta-paint", { clipPath: "circle(0% at 22% 78%)",
   scale: 1.08 }, { clipPath: "circle(150% at 22% 78%)", scale: 1, duration: 0.8,
   ease: "power2.out" })`. GSAP anima `circle()` (mesmo tipo de forma) sem plugin.
2. **Respingos:** `.cta-splatter > *` com `back.out(2.5)`, `scale: 0→1`, `stagger`,
   iniciando ~0.15s dentro da pintura (vendem o "jogar tinta").
3. **Entrada elástica (~0.6s, começa ~0.5s):**
   - `.cta-left > *`: `x: -120 → 0`, `autoAlpha: 0 → 1`, `ease: "elastic.out(1, 0.75)"`,
     `stagger: 0.08`.
   - `.cta-card`: `x: +120 → 0`, `autoAlpha: 0 → 1`, `ease: "elastic.out(1, 0.75)"`,
     ligeiramente após a coluna esquerda.
   - Botões podem usar `back.out(1.7)` para overshoot mais contido.

Toda a sequência montada num `gsap.timeline()` com offsets relativos.

## Integração: `app/(site)/_components/SectionStage.tsx`

- Import de `ReservasCTA`.
- `ITEMS`: adicionar `{ id: "reservas", label: "Reservas" }` como **4º** item (após
  "sobre").
- Adicionar 4º painel (mesmo `panelClass`):
  ```tsx
  <div className={panelClass}>
    <ReservasCTA active={activeIndex === 3} />
  </div>
  ```
- Nenhuma mudança na lógica de slide (track anima para `-activeIndex * vh`; funciona
  para 4 painéis) nem no voo do prato (restrito a from/to 0↔1).

## Fora de escopo (YAGNI)

- Backend de reservas, persistência, disponibilidade de mesas (Fase 08).
- Página `/reserva` (o botão aponta para a rota prevista; criação é outra tarefa).
- Validação/submit real do mini-form (é CTA visual).

## Verificação

1. `npx tsc --noEmit` e `npm run lint` — sem erros.
2. Dev server + CDP (headless Chrome 1440×900):
   - Navegar Início → clicar **Reservas** na roleta.
   - Conferir: (a) animação de pintura revelando o caramelo a partir do canto inf-esq;
     (b) entrada elástica de esquerda/direita; (c) layout Split legível (texto
     dark-blue sobre caramelo, card de vidro sobre área escura).
   - Screenshots em momentos-chave (início da pintura, meio, pós-entrada).
3. Reduced-motion (`--force-prefers-reduced-motion=reduce`): estado final estático,
   sem animação, tudo legível.
4. Mobile (ex.: 390×844): stack empilhado, legibilidade do texto sobre o fundo, sem
   overflow horizontal, pills não cobrindo conteúdo (usar `pb` do painel).
5. Marca d'água "Magnific" imperceptível; caso contrário, atenuar no recolor.

## Observações operacionais

- Nada de WIP não relacionado será commitado; código novo permanece na working tree
  para revisão do usuário (padrão desta branch). Apenas o spec/plano/docs são
  commitados.
- Script de recolor temporário no scratchpad (padrão `createRequire` para achar o
  `sharp` do projeto).
