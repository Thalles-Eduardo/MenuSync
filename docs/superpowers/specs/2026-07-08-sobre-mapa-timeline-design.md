# Design — Seção "Sobre" (história + linha do tempo + mapa interativo)

**Data:** 2026-07-08
**Contexto:** Terceira seção da home (Fase 03), abaixo do bento "Destaques do cardápio".
Conta a história do restaurante numa **linha do tempo animada** e mostra a localização num
**mapa interativo** (Leaflet + OpenStreetMap, dark), com animações de scroll (GSAP/ScrollTrigger).

---

## 1. Objetivo e escopo

Adicionar a seção **"Sobre"** com: bloco de história, uma **timeline vertical animada** de marcos
e um **mapa interativo** (Leaflet) apontando o restaurante na Liberdade (São Paulo), com um
card de endereço/horário ao lado.

**Dentro do escopo:**
- Componente `AboutSection.tsx` (client) montado após o bento.
- Timeline vertical com a linha central "desenhando" por scroll e marcos entrando com *pop*.
- Mapa `react-leaflet` (carregado client-only via `dynamic`, `ssr:false`), tiles dark (CARTO),
  marcador custom com anel pulsante e popup, `scrollWheelZoom` desligado.
- Card de endereço + horário (texto), com atribuição dos tiles.
- Parallax sutil de um motivo de fundo atrás da história.
- Degradação `prefers-reduced-motion` e SSR-safe (mapa client-only + placeholder).

**Fora de escopo:** rotas/direções no mapa, múltiplas unidades, busca de endereço, geolocalização
do usuário, integração com Google/Mapbox, backend de contato (Fase posterior).

---

## 2. Abordagem escolhida

**Leaflet + OpenStreetMap (react-leaflet), tiles dark do CARTO, sem API key.** Interativo
(arrastar/zoom por botões), gratuito e estilizável para o mood izakaya. Renderizado só no
cliente (Leaflet acessa `window`) via `next/dynamic` com `ssr:false`. Animações reaproveitam
GSAP + ScrollTrigger já adotados. Alternativas descartadas: Google Maps embed (pouco
estilizável/animável), Mapbox GL (exige API key/token).

---

## 3. Arquitetura

```
app/(site)/
├── page.tsx / HomeExperience        # monta <AboutSection/> após o bento
└── _components/
    ├── AboutSection.tsx             # "use client": história + timeline + bloco de localização
    ├── about/
    │   ├── Timeline.tsx             # linha do tempo vertical animada (marcos)
    │   ├── RestaurantMap.tsx        # <MapContainer> Leaflet (importado dinâmico, ssr:false)
    │   └── about-data.ts            # marcos da timeline + dados de local/horário
    └── (reuso de tokens do tema)
```

- **AboutSection.tsx**: `<section>` escura (`--color-dark-blue`), cabeçalho (eyebrow "Nossa
  história" + `<h2>` Eczar), bloco de história (2 parágrafos) sobre um motivo de fundo
  (parallax), a `<Timeline/>`, e o bloco de localização (mapa + card).
- **Timeline.tsx**: lista de marcos (`about-data.ts`) numa coluna com uma linha central; a linha
  tem uma parte "preenchida" cuja altura cresce por ScrollTrigger; cada marco (`.tl-item`,
  alternando `left/right` no desktop) entra com `scale/opacity`; o nó do ano pulsa/destaca.
- **RestaurantMap.tsx**: `"use client"`; `MapContainer` com `center`/`zoom` na Liberdade,
  `scrollWheelZoom={false}`, `dragging`, `zoomControl`. `TileLayer` CARTO dark
  (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`, `subdomains: "abcd"`,
  attribution OSM + CARTO). `Marker` com `L.divIcon` custom (ponto salmon + anel pulsante via
  CSS) e `Popup` "MenuSync — Liberdade". Importado em AboutSection via
  `dynamic(() => import("./about/RestaurantMap"), { ssr: false, loading: <placeholder> })`.
- **about-data.ts**: `MILESTONES` (ano, título, texto) e `PLACE` (nome, endereço, coords, horário).

**Dados concretos (fictícios, editáveis):**
- Local: **Liberdade, São Paulo — SP**; endereço "Rua dos Estudantes, 123 — Liberdade";
  coords `[-23.5589, -46.6347]`; horário "Ter–Dom, 18h–23h".
- Marcos: 2009 (Fundação — abertura na Liberdade), 2013 (Primeiro reconhecimento), 2017
  (Reforma e ampliação do salão), 2021 (Menu autoral do novo sushiman-chefe), 2025 (Presença
  digital — MenuSync).

---

## 4. Mapa (detalhes)

- Dependências novas: `leaflet` + `react-leaflet`; CSS `leaflet/dist/leaflet.css` importado em
  `RestaurantMap.tsx`.
- **Client-only:** `dynamic(..., { ssr:false })`; placeholder (skeleton escuro + "Carregando
  mapa…") enquanto carrega.
- **Sem scroll-jacking:** `scrollWheelZoom={false}` (zoom pelos botões `+/-`); `dragging` on.
- **Marcador custom:** `L.divIcon({ className, html })` com um ponto salmon e um anel que pulsa
  (keyframes CSS); popup com nome + endereço.
- **Estilo dark:** container com `border`/`rounded` do tema; tiles dark; atribuição visível
  (obrigatória): "© OpenStreetMap · © CARTO".
- **Ícone default do Leaflet:** não usamos os pins PNG default (evita o bug de ícone quebrado no
  bundler) — só `divIcon`.

---

## 5. Animações (GSAP + ScrollTrigger)

- `gsap.registerPlugin(ScrollTrigger)` (import `gsap/ScrollTrigger`).
- **Reveal:** cabeçalho e parágrafos de história entram (`y`, `opacity`) ao chegar na viewport.
- **Timeline:** ScrollTrigger com `scrub` liga o crescimento da linha preenchida à rolagem da
  seção da timeline; cada `.tl-item` revela uma vez (`start ~top 80%`) com `scale`+`opacity`+
  deslocamento lateral conforme o lado.
- **Mapa:** ao entrar na viewport, o marcador "cai" com `ease: bounce`; o anel pulsa em loop
  (CSS). O parallax de fundo move um elemento decorativo levemente com o scroll.
- **`prefers-reduced-motion`:** sem reveal/scrub/parallax/queda; o anel do marcador não pulsa;
  conteúdo e mapa já visíveis. Padrão de guarda memoizada já usado no projeto.

---

## 6. Degradação e acessibilidade

- Mapa client-only (sem quebra de SSR); placeholder no load; falha de rede nos tiles → o mapa
  mostra fundo escuro + o card de endereço em texto garante a informação.
- Endereço/horário em **texto** (não só no mapa). Atribuição dos tiles presente.
- Timeline e reveals degradam com reduced-motion (nada inicia oculto nesse caso).
- Navegação por teclado do Leaflet mantida; `overflow-x` contido.

---

## 7. Dependências

- **Adicionar:** `leaflet`, `react-leaflet` (+ `@types/leaflet` em dev). CSS do Leaflet importado.
- Já instalados: `gsap`, `@gsap/react`. Sem API key. Sem assets novos obrigatórios (motivo de
  fundo pode ser um SVG/gradiente inline; se precisar de imagem, é opcional).

---

## 8. Verificação

- `npm run lint`, `npx tsc --noEmit`, `npm run build` sem erros (conferir que o Leaflet entra em
  chunk client-only e não quebra o SSR/prerender).
- Screenshot **CDP** do layout da seção (timeline + bloco de localização). **Ressalva:** os tiles
  do mapa vêm da rede — em headless podem não carregar; então valido layout/placeholder/card e
  confirmo o **mapa interativo ao vivo** (arrastar/zoom, marcador pulsando).
- Reduced-motion: seção visível e íntegra, sem movimento.

---

## 9. Pendências / riscos

- **SSR do Leaflet:** garantir `ssr:false` + import de CSS só no componente client (não no server).
  Sem isso, `window is not defined` no build.
- **Ícone quebrado do Leaflet:** evitar os markers PNG default (usar `divIcon`).
- **Tiles em headless/offline:** verificação do mapa é ao vivo; screenshot cobre o layout estático.
- **Peso do Leaflet:** carregar lazy (dynamic) para não pesar o bundle inicial; medir na Fase 12.
- **Dados fictícios:** endereço/coords/marcos são placeholders plausíveis — trocar pelos reais
  quando existirem.
