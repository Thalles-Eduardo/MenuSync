# Design — Timeline radial (dial) na seção "Sobre"

**Data:** 2026-07-08
**Contexto:** Substitui a linha do tempo vertical (scroll-driven) da seção "Sobre" por um **dial
radial** interativo por **clique** (rótulos de ano em arco; ao clicar num ano a roda gira e revela
o marco no centro). Baseado no CodePen do cbolson (`rNEdgKo`), adaptado ao tema dark do site,
contido na seção e sem dependências externas. CSS puro (radio + `:has()`), sem JS de interação.

---

## 1. Objetivo e escopo

Trocar `Timeline.tsx` (vertical) por um **dial radial** com ~11 marcos, mantendo a posição na
seção "Sobre" (entre a história e o bloco de localização).

**Dentro do escopo:**
- Expandir `MILESTONES` (em `about-data.ts`) para 11 marcos plausíveis (2009→2025).
- `Timeline.tsx` reescrito como o dial (estrutura radio + label + h2 + p por item).
- `Timeline.module.css` com o layout radial adaptado (tema dark + salmon; contido; sem `@import`).
- Interação por **clique** (radio + `:has()`); primeiro marco `checked` por padrão.
- Degradação `prefers-reduced-motion` (sem rotação animada; troca instantânea).

**Fora de escopo:** girar por scroll, autoplay, arrastar a roda, imagens por marco, alterar as
outras partes da seção (história, mapa).

---

## 2. Abordagem escolhida

**CSS puro dirigido por `radio` + `:has()`, via CSS Module.** Reproduz o mecanismo do CodePen
(cada `li` rotacionado por `--i`; o `.cards` gira para `--index` do item `:checked`; o marco
selecionado revela `h2`/`p`). CSS Module (em vez de styled-jsx) porque os seletores `:has()` e
`nth-child` ficam mais previsíveis sem o escopo/hash do styled-jsx. Sem JS de estado — os radios
nativos cuidam da seleção (acessível por teclado). Alternativa descartada: reimplementar a rotação
em JS/GSAP (desnecessário; o CSS já resolve e é mais leve).

---

## 3. Arquitetura

```
app/(site)/_components/about/
├── about-data.ts        # MILESTONES expandido para 11 (year, title, text)
├── Timeline.tsx         # dial radial (estrutura a partir de MILESTONES)
└── Timeline.module.css  # estilos radiais (dark + salmon, contidos, com regras --index)
```

- **about-data.ts:** `MILESTONES` passa a ter 11 itens (mesma shape `{ year, title, text }`).
- **Timeline.tsx** (`"use client"` opcional — é estático; pode ser server component, mas fica
  client por consistência com a seção): renderiza `.cards-container > ul.cards` com
  `style={{ "--items": MILESTONES.length }}`; cada item é um `<li style={{ "--i": i }}>` com
  `<input type="radio" name="about-timeline" id=... defaultChecked={i===0}>`, `<label htmlFor=...>{year}</label>`,
  `<h2>{year}</h2>`, `<p>{text}</p>`. (O `title` do marco pode compor o `h2`/`p` — ver §4.)
- **Timeline.module.css:** adapta o CSS do CodePen: variáveis de raio/tamanho por breakpoint;
  tema dark; **remove** o `@import` externo (replica só o reset/centralização necessários);
  regras `.cards:has(li:nth-child(N)>input:checked){ --index: N-1 }` para 11 itens.

---

## 4. Conteúdo (11 marcos, fictícios/editáveis)

2009 Fundação · 2010 Balcão de sushi · 2012 Nasce o teishoku da casa · 2013 Primeiro
reconhecimento · 2015 Forno robata · 2017 Reforma e ampliação · 2019 Menu vegetariano sazonal ·
2021 Menu autoral do sushiman-chefe · 2022 Delivery próprio · 2024 Noites de omakasê · 2025
MenuSync. Cada marco tem `title` (ex.: "Fundação") e `text` (1 frase). No dial: o `label`/`h2`
mostram o **ano**; o `title` aparece como destaque e o `text` como descrição no centro (layout
exato ajustado ao vivo).

---

## 5. Adaptações do CodePen

- **Posicionamento:** trocar `position: fixed; inset: 0; margin: 25rem auto` por um wrapper
  **relativo** com altura dedicada ao semicírculo (o `clip-path` do topo continua, mostrando o
  arco de rótulos + o conteúdo central). Sem overlay de viewport.
- **Tema dark:** `--label-color` branco suave; `--label-color-hover`/selecionado → **salmon**
  (`#e05a5a`/token do tema); ponto (`::before`) e linha (`::after`) em salmon; `h2`/`p` em branco;
  borda do círculo sutil (`rgba(255,255,255,.1)` ou transparente).
- **Sem import externo:** remover `@import "https://codepen.io/..." layer(template)`; trazer só o
  mínimo (box-sizing/reset local, centralização) para dentro do módulo.
- **Itens:** `--items: 11`; regras `--index` para 11 (`nth-child(1..11)`).
- **Interação:** clique nos rótulos (labels) alterna o radio; primeiro `checked` por padrão.

---

## 6. Degradação e acessibilidade

- Radios nativos + labels associadas (`htmlFor`/`id`) → navegável por teclado (Tab/Setas) e por
  leitor de tela; os inputs ficam visualmente escondidos (clip), não `display:none`, para manter o
  foco.
- `@media (prefers-reduced-motion: reduce)`: zerar as `transition`/`--duration` (troca instantânea
  ao selecionar), sem rotação animada; todo conteúdo do item selecionado visível.
- `overflow-x` contido; nada depende de JS para funcionar.

---

## 7. Dependências

Nenhuma nova. Remove uma dependência externa (o `@import` do codepen). Sem assets novos.

---

## 8. Verificação

- `npm run lint`, `npx tsc --noEmit`, `npm run build` sem erros (tipar as custom props inline:
  `style={{ "--i": i } as React.CSSProperties}`).
- Screenshot **CDP**: estado inicial (marco 2009 selecionado, arco de anos no topo) e, após marcar
  outro radio via CDP (`document.querySelector('#item-...').click()`), confirmar a **rotação** da
  roda + o **reveal** do novo marco. Ajuste fino de raio/altura/clip/posições **ao vivo**.
- `--force-prefers-reduced-motion`: dial visível e utilizável, sem animação de rotação.

---

## 9. Pendências / riscos

- **Enquadramento radial:** raio, altura da seção, `clip-path` e posição dos rótulos precisam de
  ajuste ao vivo para caber bem na seção (iterativo, via CDP) — principal risco.
- **`:has()` + CSS Module:** confirmar que os seletores `.cards:has(li:nth-child(n)>input:checked)`
  funcionam com o hash do módulo (classes hasheiam, seletores de elemento não) — validar no build/CDP.
- **Legibilidade do texto no centro** com poucos/muitos itens — ajustar `--info-width`/tamanhos.
- **Marcos fictícios:** trocar por reais quando existirem.
