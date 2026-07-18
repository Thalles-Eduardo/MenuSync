# Transição de página imperceptível — View Transitions API nativa

Data: 2026-07-18
Branch: feat/sakura-cardapio

## Objetivo

Ao navegar entre as rotas reais do site (`/` ↔ `/cardapio`), a troca deve ser
**imperceptível**: o fundo faz um crossfade suave e a navbar fixa permanece
estável (sem piscar/recarregar), passando a sensação de que o usuário continua
na mesma página. Sem flash branco, sem "corte" de navegação dura.

## Contexto do projeto

- **Stack:** Next 16.2.9 (App Router, Turbopack), React 19.2.4 **estável**,
  GSAP + `@gsap/react`, styled-jsx, Tailwind v4 (`@theme` em `globals.css`).
- **Rotas existentes:** `/` (home = roleta de 5 painéis `SectionStage`, com um
  `Loader` de abertura), `/cardapio` (página rolável). `/reserva` é referenciada
  por `ReservasCTA` mas **ainda não existe** (Fase 08).
- **Navbar:** global, fixa no topo (`z-[55]`), porém renderizada **dentro de cada
  página** (não no layout compartilhado) — em `SectionStage` (com
  `onSelectSection`) e em `CardapioClient`.
- **Navegação de rota hoje** (via `<Link>`):
  - `Navbar.tsx` — logo → `/`
  - `HamburgerMenu.tsx` — Cardápio → `/cardapio`; deep-links → `/?section=...`
  - `MenuBento.tsx` — CTA → `/cardapio`
  - `ReservasCTA.tsx` — → `/reserva` (rota inexistente)
  - Botões de **seção da roleta** (Início/Sobre/Reservas/Contato) NÃO são troca de
    rota: usam `onSelectSection` → GSAP. Ficam fora do escopo do VT.

## Decisão técnica (e por quê)

A **View Transitions API nativa do browser** (`document.startViewTransition`),
acionada por um wrapper de navegação client-side.

Alternativas descartadas:
- **`experimental.viewTransition` + `<ViewTransition>` do React:** a flag existe no
  Next 16.2.9, mas o componente `<ViewTransition>` só existe no **canal
  experimental do React**. O projeto usa React estável 19.2.4, que não exporta
  `unstable_ViewTransition` (verificado: `Object.keys(require('react'))` não
  contém). Exigiria trocar o React para o canal experimental — arriscado e fora
  do escopo "básico".
- **Router do Next embrulhar navegação automaticamente:** verificado que
  `node_modules/next/dist/client/` não usa `startViewTransition` — o router-client
  não faz isso sozinho.
- **Biblioteca `next-view-transitions`:** funciona, mas adiciona dependência; o
  padrão canônico hand-rolled é pequeno o suficiente e mantém o projeto enxuto.
- **Overlay de tinta/cortina (GSAP):** é uma transição **visível** — contraria o
  requisito "o usuário nem percebe".

## Arquitetura

### 1. `RouteTransitionProvider` (novo, client)
`app/(site)/_components/RouteTransitionProvider.tsx`

- Montado em `app/layout.tsx` envolvendo `{children}` (nível persistente).
- Expõe `navigate(href: string)` via React Context.
- Implementa o padrão canônico de View Transitions no App Router:
  ```tsx
  const router = useRouter();
  const pathname = usePathname();
  const finishRef = useRef<(() => void) | null>(null);

  // Quando a nova rota commita, resolve a promise → o browser conclui o snapshot novo.
  useEffect(() => {
    finishRef.current?.();
    finishRef.current = null;
  }, [pathname]);

  const navigate = useCallback((href: string) => {
    // Fallback: browser sem suporte ou reduced-motion → navegação instantânea.
    const doc = document as Document & { startViewTransition?: (cb: () => Promise<void> | void) => unknown };
    if (typeof doc.startViewTransition !== "function") {
      router.push(href);
      return;
    }
    doc.startViewTransition(
      () => new Promise<void>((resolve) => {
        finishRef.current = resolve;
        router.push(href);
      }),
    );
  }, [router]);
  ```
- Contexto: `RouteTransitionContext = createContext<(href: string) => void>(() => {})`.
- Exporta um hook `useRouteTransition()` que retorna `navigate`.

**Nota de robustez:** todas as navegações **de rota em escopo** mudam o `pathname`
(`/` ↔ `/cardapio`; os deep-links `/?section=` só são renderizados como link quando
o usuário está em `/cardapio` — na home as seções usam `onSelectSection`/botões, não
navegação). Logo, observar `usePathname()` cobre 100% dos casos. **Não** usar
`useSearchParams()` aqui: o provider vive no root layout e `useSearchParams` exigiria
um `<Suspense>` boundary global (erro de build no Next). Salvaguardas contra promise
presa: (a) em `navigate`, se `href` apontar para o mesmo `pathname` atual, resolver
imediatamente / fazer `router.push` sem abrir transição; (b) a própria View
Transitions API tem timeout interno (~4s).

### 2. `TransitionLink` (novo, client)
`app/(site)/_components/TransitionLink.tsx`

- Wrapper de `next/link` com a mesma superfície visual (`href`, `className`,
  `children`, `aria-*`, `onClick` opcional encadeado).
- No `onClick`: se for click "simples" (sem `metaKey/ctrlKey/shiftKey/altKey`, sem
  `target="_blank"`, botão esquerdo) → `e.preventDefault()` + `navigate(href)`;
  caso contrário, deixa o comportamento padrão do `<Link>` (abrir em nova aba etc.).
- Encadeia um `onClick` externo, se fornecido (ex.: `setOpen(false)` do menu).
- `href` restrito a `string` (as rotas do projeto são strings).

### 3. Substituições de `<Link>` → `TransitionLink`
Apenas as navegações **de rota**:
- `Navbar.tsx` — logo (`/`).
- `HamburgerMenu.tsx` — o `<Link>` dos itens (Cardápio + deep-links `/?section=`),
  preservando o `onClick={() => setOpen(false)}`.
- `MenuBento.tsx` — CTA `/cardapio`.
- `ReservasCTA.tsx` — `/reserva` (a rota não existe ainda; o link fica pronto).

Os botões de seção da roleta (`onSelectSection`) permanecem inalterados.

### 4. CSS em `globals.css`
```css
@media (prefers-reduced-motion: no-preference) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 350ms;
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
}
/* Navbar fixa permanece estável durante a transição (morph, sem crossfade). */
nav.navbar-vt {
  view-transition-name: navbar;
}
```
- O crossfade `old/new(root)` é o comportamento padrão da API; só ajustamos
  duração/ease para casar com o projeto.
- A `<nav>` fixa recebe uma classe `navbar-vt` (novo) e `view-transition-name:
  navbar` → o browser casa a navbar antiga e a nova pelo nome e a mantém estável.
- Como só existe **uma** navbar por vez, o nome `navbar` é único por snapshot (a
  regra da API).

### 5. Loader once-per-session
`Loader.tsx` hoje re-dispara a intro a cada mount da home → ao voltar de
`/cardapio` tocaria a abertura inteira, quebrando a fluidez.

Fix: gravar um flag em `sessionStorage` (`"loaderShown"`).
- Na 1ª carga da sessão (flag ausente): toca a intro normalmente e, ao concluir,
  grava o flag.
- Nas cargas seguintes (flag presente) e em `reduced-motion`: `setDone(true)`
  imediato (sem intro).
- Leitura do flag deve ser hydration-safe: `useState(false)` inicial (server e
  client começam iguais, mostrando/preparando o loader) e a decisão de pular ocorre
  dentro do `useGSAP`/effect no cliente. Não usar inicializador que leia
  `sessionStorage` no primeiro render (causaria mismatch de hidratação).

## Arquivos

- **Novo:** `app/(site)/_components/RouteTransitionProvider.tsx`
- **Novo:** `app/(site)/_components/TransitionLink.tsx`
- **Editado:** `app/layout.tsx` (montar o provider em volta de `{children}`)
- **Editado:** `app/(site)/_components/Navbar.tsx` (logo → TransitionLink; classe
  `navbar-vt` no `<nav>`)
- **Editado:** `app/(site)/_components/HamburgerMenu.tsx` (Link de item →
  TransitionLink)
- **Editado:** `app/(site)/_components/MenuBento.tsx` (CTA → TransitionLink)
- **Editado:** `app/(site)/_components/ReservasCTA.tsx` (Reservar → TransitionLink)
- **Editado:** `app/(site)/_components/Loader.tsx` (once-per-session)
- **Editado:** `app/globals.css` (regras de view-transition + navbar-vt)

## Verificação

1. `npx tsc --noEmit` e `npm run lint` — sem erros.
2. `npm run build` — rotas `/` e `/cardapio` compilam.
3. CDP (headless Chrome, 1440×900), com dev server:
   - Navegar `/` → clicar Cardápio no menu → `/cardapio` → logo → `/`.
   - Confirmar: (a) sem flash branco/corte; (b) navbar imóvel entre as rotas;
     (c) fundo em crossfade suave; (d) `Loader` NÃO re-dispara ao voltar para `/`;
     (e) deep-link `/?section=sobre` a partir de `/cardapio` continua funcionando
     (transição + seção correta ativa + query limpa).
   - `Runtime.evaluate` para inspecionar `document.startViewTransition` presente e
     `getComputedStyle(nav).viewTransitionName === "navbar"`.
   - Emular `prefers-reduced-motion: reduce` → navegação instantânea, sem quebra.
4. Grep: nenhum `<Link>` de rota remanescente onde deveria ser `TransitionLink`.

## Fora de escopo

- Criar a rota `/reserva` (Fase 08) — apenas deixamos o link pronto.
- Transições de **elemento compartilhado** avançadas (morph do prato/hero entre
  rotas) — a base com `view-transition-name` fica pronta para evoluir depois.
- Transições dentro da roleta da home (já são GSAP; não são troca de rota).
