# Spec — Painel final "Cupom por e-mail + Footer" (só front)

**Data:** 2026-07-15
**Branch:** `feat/sakura-cardapio`
**Fase (README):** Fase 03 — "Cupom por e-mail" + "Footer" (unificados num só painel)

## Contexto

A home é uma **roleta de painéis de 100vh** (`SectionStage`): Início → Cardápio →
Sobre → Reservas, trocados pela `SectionRoulette` lateral. Não há scroll contínuo,
então um footer tradicional (faixa no fim de uma página longa) não existe. Decisão de
design (aprovada): **unificar** "Cupom por e-mail" e "Footer" num único painel final —
o cupom como protagonista no topo e o conteúdo de footer numa faixa embaixo. Vira a 5ª
e última parada da roleta (`Contato`).

Escopo desta entrega: **somente o front**. Sem Route Handler `POST /api/coupons` e sem
envio de e-mail. O submit é simulado visualmente (opção 1): validação real do e-mail +
estados de loading → sucesso (mostra um código de cupom fake) ou erro. A UI fica pronta
para plugar o backend depois.

## Paleta (de `app/globals.css` `@theme`)

`--color-brown #574c41` · `--color-salmon #e36b6b` · `--color-caramel #e3a56b`
(rgb 227,165,107) · `--color-yellow #e3c77b` (rgb 227,199,123) · `--color-green #96875a`
· `--color-dark-blue #2A2E37` (rgb 42,46,55) · fonte de títulos `--font-eczar`.

## Componentes e integração

### Novo: `app/(site)/_components/FooterSection.tsx`
Client component no padrão dos demais painéis:
- Props: `{ active?: boolean; onNavigate?: (index: number) => void }`.
- `scope` ref + `useGSAP({ scope, dependencies: [reduce, active] })`.
- Guarda `reduce = useMemo(() => matchMedia("(prefers-reduced-motion: reduce)").matches)`
  e `played` ref para tocar a entrada uma única vez.
- Elemento raiz `<footer>` de 100vh.

### Editado: `app/(site)/_components/SectionStage.tsx`
- Import `FooterSection`.
- `ITEMS`: acrescentar `{ id: "contato", label: "Contato" }` como 5º item.
- 5º painel: `<div className={panelClass}><FooterSection active={activeIndex === 4} onNavigate={goTo} /></div>`.
- `goTo` já existe no componente; passá-lo como `onNavigate`.

## Fundo

- Origem: `public/bgFooter.webp` — textura de pinceladas P&B crua (2560×1440), ainda
  não referenciada, no mesmo estilo das outras antes de recolorir.
- Recolorir para **`public/bgFooterInk.webp`** no mesmo duotone das seções anteriores:
  claro → **caramel**, escuro → **dark-blue**. Via `sharp` com **buffer raw
  intermediário** (2 passes) para evitar a perda de recompressão dupla de webp; qualidade
  webp ~90.
  - `linear(a, b)` por canal com `a = (caramel − darkblue)/255` e `b = darkblue`:
    `a ≈ [0.72549, 0.46667, 0.20392]`, `b = [42, 46, 55]`.
  - `grayscale()` antes do `linear`, `toColourspace('srgb')` para garantir 3 canais.
- Aplicar em `<footer>` via `backgroundImage: url('/bgFooterInk.webp')` +
  `backgroundColor: var(--color-dark-blue)`, `bg-cover bg-center`.
- Overlay `dark-blue/75` (pointer-events-none, absolute inset-0) para legibilidade do
  texto e do form.

## Layout (100vh, alinhado às laterais como as demais)

Container `<footer>`: `relative flex min-h-screen flex-col overflow-hidden px-8 py-12
md:px-12 text-white`. Conteúdo em `relative z-10 w-full` (sem `max-w-*` centralizado —
segue o enquadramento lateral do restante do site). Layout em duas regiões empilhadas:

### Região A — Cupom (topo, cresce para ocupar o espaço: `flex-1` centralizado)
- Eyebrow: `クーポン · Newsletter` (tracking largo, uppercase, `text-yellow`).
- `h2` (`font-eczar`): "Ganhe **10%** no primeiro pedido" (destaque `text-salmon` no "10%").
- Subtexto (`text-white/80`, `max-w-xl`): "Cadastre seu e-mail e receba um cupom
  exclusivo direto na sua caixa de entrada."
- **Form** (ver "Cupom — comportamento").
- Área de feedback logo abaixo do form (`aria-live="polite"`).

### Região B — Faixa de footer (embaixo)
Grid responsivo (`grid-cols-1 gap-8 md:grid-cols-3`), com borda superior sutil
(`border-t border-white/10 pt-8`):

1. **Marca:** "Menu" + `Sync` (em `text-salmon`), tagline curta ("Cozinha japonesa na
   Liberdade, desde 2009."), e uma linha de **redes sociais** — Instagram, Facebook,
   WhatsApp como SVGs inline; `href="#"` placeholder (só-front), `aria-label` em cada,
   `cursor-pointer`, hover para `text-caramel`.
2. **Navegação:** lista com Início, Cardápio, Sobre, Reservas. Cada item é um
   `<button>` que chama `onNavigate(index)` (0..3) → move a roleta. `cursor-pointer`,
   hover `text-caramel`.
3. **Contato:** endereço (`PLACE.address`), horário (`PLACE.hours`) de
   `about-data.ts`, e telefone `(11) 3200-1590` como `<a href="tel:+551132001590">`.

### Barra de copyright (rodapé da região B)
`border-t border-white/10 pt-6 mt-8`, texto pequeno `text-white/60`:
"© 2026 MenuSync · feito com ♥ em São Paulo".

## Cupom — comportamento (só-front, opção 1)

- **Dependência nova:** instalar `zod` (alinha com o README e reaproveita no backend).
- Schema:
  ```ts
  const couponSchema = z.object({
    email: z.string().min(1, "Informe seu e-mail").email("E-mail inválido"),
  });
  ```
- Estado local (`useState`): `status: "idle" | "loading" | "success" | "error"`,
  `message: string`, `coupon: string | null`.
- Submit (`onSubmit`, `preventDefault`):
  1. Valida o campo com `couponSchema.safeParse`.
  2. Se inválido → `status: "error"`, mensagem do Zod abaixo do campo (vermelho).
  3. Se válido → `status: "loading"` (botão desabilitado + spinner/estado), simula
     latência ~700ms (`setTimeout`/`await`), gera código fake
     `SAKURA10-` + 4 chars alfanuméricos aleatórios (uppercase), `status: "success"`.
  4. Sucesso: mensagem verde com o código do cupom e um microcopy
     ("Use no checkout. Enviamos uma cópia para o seu e-mail." — texto ilustrativo).
- Acessibilidade: `<label>` associado (sr-only ok), `input type="email"
  autoComplete="email"`, `aria-invalid` no erro, feedback em container `aria-live`.
- Nada é persistido nem enviado; é simulação visual. `TODO` no código apontando a
  troca por `POST /api/coupons` na fase de backend.

## Animação (entra quando `active`)

Restrained — é o fecho do site, não repete o paint-reveal (assinatura da Reservas):
- Bloco do cupom (`.footer-reveal` em eyebrow, h2, sub, form): `gsap.from({ y: 28,
  opacity: 0, duration: 0.7, stagger: 0.12, ease: "power3.out" })`.
- Colunas da faixa de footer (`.footer-col`): sobem com stagger leve iniciando ~0.3s
  depois (delay pequeno), mesma ease.
- `if (reduce || !active || played.current) return;` — toca uma vez, respeita
  `prefers-reduced-motion` (estado final estático já legível).

## Arquivos

- **Novo:** `app/(site)/_components/FooterSection.tsx`
- **Novo:** `public/bgFooterInk.webp` (recolor de `bgFooter.webp`)
- **Editado:** `app/(site)/_components/SectionStage.tsx` (item + painel + `onNavigate`)
- **Editado:** `package.json` / lockfile (dependência `zod`)
- **Temporário (scratchpad):** script `recolor-footer.mjs`, script CDP de verificação.
- `public/bgFooter.webp` pode ser removido após o recolor (não mais referenciado) — a
  confirmar na limpeza; por ora manter (fonte do recolor).

## Verificação

1. `npx tsc --noEmit` — sem erros de tipo.
2. `npm run lint` — limpo.
3. `npm run build` — build de produção passa.
4. CDP (headless Chrome, 1440×900): abrir a home, clicar **Contato** na roleta e
   conferir:
   - fundo `bgFooterInk` recolorido (caramel/dark-blue), sem 404, boa qualidade;
   - layout: cupom no topo + faixa de footer alinhada às laterais como as demais;
   - animação de entrada dispara ao ativar o painel;
   - form: e-mail válido → estado loading → sucesso com código fake; e-mail inválido →
     erro vermelho; navegação do footer move a roleta.
5. Screenshot para revisão.

## Fora de escopo (fica para a fase de backend)

- Route Handler `POST /api/coupons`, geração/persistência real de cupom (tabela
  `Coupons`), envio transacional (Resend/Nodemailer), rate limit, dedupe por e-mail.
- Links reais de redes sociais e páginas `/cardapio` e `/reserva` (ainda não existem).
