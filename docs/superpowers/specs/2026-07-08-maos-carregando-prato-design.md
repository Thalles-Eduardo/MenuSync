# Design — "Mãos carregando o prato" (transição hero → bento)

**Data:** 2026-07-08
**Contexto:** Evolução do "prato voador" (ver `2026-07-08-bento-destaques-prato-voador-design.md`).
Em vez do prato viajar sozinho do hero para o bento, **duas mãos** sobem, agarram o prato,
carregam-no até o card grande do bento e o soltam — reforçando a narrativa de *serviço* do
restaurante. Estética **lúdica** (mãos ilustradas vs. comida fotorrealista, contraste proposital).

---

## 1. Objetivo e escopo

Substituir o flyer solto do voo por um **grupo "carry"** (prato + mão esquerda + mão direita)
guiado pelo mesmo scrub. As mãos são **partidas** (convergem ao pegar, afastam ao soltar) e
**vêm de baixo** (subindo da base da tela, como servindo).

**Dentro do escopo:**
- Duas mãos a partir de `public/hands.png` (707×353), exibidas como **duas metades** via
  `background-position` (sem gerar assets novos): `.hand-left` e `.hand-right`.
- Um `.carry-group` (posição fixa) que viaja e escala; prato e mãos são filhos.
- Coreografia por scrub: pegar (subir + convergir) → carregar → soltar (afastar + descer).
- Reaproveita o gate/fallback e o fix da troca de prato (`.plate-anchor`) já existentes.
- Sombra suave do prato sobre os dedos (drop-shadow) para dar contato.

**Fora de escopo:** articular dedos (imagem estática — o "agarrar" é sugerido por convergência
+ subida); mãos no mobile/reduced-motion (sem voo nesses casos); trocar/regerar o asset; física real.

---

## 2. Abordagem escolhida

**Carry-group filho de um único container fixo, viajando por scrub (coords absolutas).**
Mantém a matemática de posicionamento absoluto já validada no voo (refresh-safe). Agrupar
prato + mãos num só elemento faz as mãos **encolherem junto** com o prato automaticamente; o
gesto de pegar/soltar é um `translateX`/`translateY` extra em cada mão, componível com a escala
do grupo. Alternativa descartada: mãos como elementos independentes espelhando a trajetória do
prato (duplica a matemática do voo e desalinha em resize).

---

## 3. Arquitetura

```
app/(site)/_components/
├── HomeExperience.tsx   # caminho animado passa a montar o .carry-group (prato + 2 mãos)
│                        # e a orquestrar a coreografia no timeline do scrub
├── DishPlate.tsx        # inalterado (mantém .plate-anchor / .plate-img)
└── MenuBento.tsx        # inalterado (.bento-seat-img é o alvo do pouso)
```

Nada de componentes novos: a mudança é interna ao caminho animado do `HomeExperience`.

**Estrutura do caminho animado (`enabled`):**
```
<div ref=root className="stage-pin ...">
  <HeroShowcase/>
  <MenuBento/>
  <div className="carry-group fixed left-0 top-0 z-[60] pointer-events-none">  // origem top-left
    <img className="flying-plate" src={activeDish.plate} />   // prato, no centro do grupo
    <div className="hand hand-left"  aria-hidden />            // metade esquerda de hands.png
    <div className="hand hand-right" aria-hidden />            // metade direita
  </div>
</div>
```

- `.carry-group` recebe `x/y` (translate) e `scale` do scrub — é ele que faz a **viagem**.
- `.flying-plate`: tamanho base fixo (= largura do prato do hero, medida em runtime); fica
  centrado no grupo. A escala do grupo cuida do encolhimento (hero → assento).
- `.hand-left`/`.hand-right`: `background-image: url(/hands.png)`, `background-size: 707px 353px`,
  `background-position` left/right; posicionados flanqueando o prato. Recebem `translateX`
  (convergir/afastar) e participam do fade/subida.

---

## 4. Metades do asset (CSS, sem arquivos novos)

Cada mão é um `<div>`:
- largura ~353px, altura ~353px (metade de 707);
- `background: url(/hands.png) no-repeat; background-size: 707px 353px;`
- `.hand-left { background-position: left center; }`
- `.hand-right { background-position: right center; }`
- `filter: drop-shadow(...)` leve para profundidade.

Escala/posição finas ajustadas ao vivo para os dedos "abraçarem" as bordas do prato.

---

## 5. Coreografia (timeline do scrub, progress 0→1)

Reutiliza o mesmo ScrollTrigger/scrub (trigger = root, `start "top top"`, `end +100vh`,
`scrub`, `invalidateOnRefresh`). Posições por função em **coords absolutas** (à prova de refresh).

- **0.00–0.05 — handoff de entrada:** `.plate-anchor` do hero some (fromTo autoAlpha 1→0);
  o `.carry-group`/prato assume no mesmo lugar (o prato começa alinhado ao prato do hero).
- **0.05–0.18 — pegar:** mãos entram de baixo (`from` translateY positivo + autoAlpha 0) para a
  posição de "abraço" (`to` translateY 0 + autoAlpha 1) e **convergem** (translateX de fora →
  para dentro). O prato "assenta" entre os dedos.
- **0.18–0.82 — carregar:** o `.carry-group` viaja (x/y) e **escala** de 1 (tamanho do prato do
  hero) até `seatWidth/plateWidth` (~0,72), levando prato + mãos juntos até o assento do card.
- **0.82–0.95 — soltar:** mãos **afastam** (translateX para fora) e começam a **descer**
  (translateY positivo) + fade-out.
- **0.90–1.00 — pouso:** revela `.bento-seat-img` (autoAlpha 0→1), oculta o prato do grupo e o
  grupo; mãos terminam de recuar/sumir. Resultado: prato pousado no card, bento em fluxo normal.

Guardas: o parallax do prato do hero segue desligado dentro de `.stage-pin`; o fix da troca
(`.plate-anchor` com `fromTo` de `from` explícito) permanece — a troca de prato re-cria o
timeline e re-mede tudo.

---

## 6. Estilo (lúdico)

- Mãos cartoon mantidas contra a comida real (contraste proposital).
- `drop-shadow` suave nas mãos (profundidade) e uma **sombra leve do prato** (drop-shadow no
  prato do grupo) para dar sensação de contato — sem tint/dessaturação.

---

## 7. Degradação e acessibilidade

- Mãos e voo só no caminho `enabled` (desktop, `pointer: fine`, sem `prefers-reduced-motion`,
  largura ≥ 1024). Mobile/touch/reduced-motion/SSR → hero + bento empilhados, sem mãos.
- Mãos são decorativas (`aria-hidden="true"`, `pointer-events: none`).
- `overflow-x` contido; `will-change: transform` nos elementos animados.

---

## 8. Dependências

Nenhuma nova. GSAP/ScrollTrigger já usados. Asset já presente (`public/hands.png`) — usado como
duas metades por CSS, sem arquivos derivados.

---

## 9. Verificação

- `npm run lint`, `npx tsc --noEmit`, `npm run build` sem erros.
- Ajuste fino via CDP (scroll real): capturar frames em `progress` ~0.1 / 0.3 / 0.5 / 0.8 / 1.0
  e medir rects de `.carry-group`, `.flying-plate`, `.hand-left/right`, `.bento-seat-img` —
  confirmar pegar → carregar → soltar natural e o **pouso alinhado** do prato no card.
- Confirmar em todos os pratos (troca no carrossel) que mãos+prato aparecem e voam.
- Fallback: com `--force-prefers-reduced-motion`, sem mãos, layout empilhado íntegro.

---

## 10. Pendências / riscos

- **Re-alinhamento do pouso:** trocar o flyer solto pelo carry-group re-abre o ajuste de escala/
  posição do prato no assento — re-tunar via CDP (ferramenta já existente).
- **Enquadramento das mãos:** posição/escala das metades vs. as bordas do prato é iterativa (ao vivo).
- **Peso visual:** manter o gesto enxuto (subir, pegar, descer no bento, recuar) para não competir
  com o conteúdo; ajustar os pontos de tempo (0.05 / 0.18 / 0.82 / 0.95) se ficar carregado.
- **Escala do bg-image ao ampliar:** metades de um PNG 707×353 escaladas — conferir nitidez;
  se necessário, aumentar a resolução base do asset (fora do escopo atual).
