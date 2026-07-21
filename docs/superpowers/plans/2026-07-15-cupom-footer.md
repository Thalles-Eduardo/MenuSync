# Painel final "Cupom + Footer" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar o 5º e último painel da roleta da home — "Contato" — unificando a captura de cupom por e-mail (só front, com validação Zod e simulação de sucesso) e o conteúdo de footer, com fundo recolorido no duotone do projeto.

**Architecture:** Novo client component `FooterSection` renderizado como 5º painel de 100vh dentro de `SectionStage`, seguindo o padrão dos demais (`active` prop, `useGSAP` com `scope`, guarda `prefers-reduced-motion`). O fundo é uma textura de pinceladas recolorida via `sharp`. A navegação do footer aciona a roleta via callback `onNavigate`. O submit do cupom é simulado no cliente (Zod valida → estado loading → código fake), com um `TODO` marcando a troca pelo backend futuro.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, GSAP + @gsap/react, Zod (nova dependência), sharp (recolor de imagem).

**Verificação (sem test runner neste projeto):** cada tarefa verifica com `npx tsc --noEmit`, `npm run lint`, `npm run build` e, ao final, verificação visual via CDP (headless Chrome). Este é o padrão estabelecido do projeto (ver plano da Reservas).

---

## Estrutura de arquivos

- **Criar:** `app/(site)/_components/FooterSection.tsx` — o painel Cupom+Footer inteiro (uma responsabilidade: a seção final). Componente autocontido.
- **Criar:** `public/bgFooterInk.webp` — fundo recolorido (gerado por script sharp).
- **Modificar:** `app/(site)/_components/SectionStage.tsx` — registrar o item da roleta e o painel, passando `onNavigate={goTo}`.
- **Modificar:** `package.json` + lockfile — dependência `zod`.
- **Temporário (scratchpad):** `recolor-footer.mjs` (recolor), `verify-footer.mjs` (CDP).

---

## Task 1: Instalar Zod

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Instalar a dependência**

Run:
```bash
npm install zod
```
Expected: `zod` aparece em `dependencies` no `package.json`, sem erros de instalação.

- [ ] **Step 2: Confirmar a instalação**

Run:
```bash
node -e "console.log(require('zod/package.json').version)"
```
Expected: imprime uma versão (ex.: `3.x.x` ou `4.x.x`) sem erro.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: adiciona zod para validação do cupom"
```

---

## Task 2: Recolorir `bgFooter.webp` → `bgFooterInk.webp`

**Files:**
- Create: `public/bgFooterInk.webp`
- Temp: `<scratchpad>/recolor-footer.mjs`

**Contexto:** `public/bgFooter.webp` é uma textura de pinceladas P&B crua (2560×1440). Recolorir no mesmo duotone das outras seções: claro → caramel (rgb 227,165,107), escuro → dark-blue (rgb 42,46,55). Usar buffer raw intermediário (2 passes) para evitar perda de recompressão dupla de webp. `sharp` é acessado a partir do `package.json` do projeto via `createRequire`.

- [ ] **Step 1: Escrever o script de recolor no scratchpad**

Criar `<scratchpad>/recolor-footer.mjs` (substitua `<scratchpad>` pelo diretório de scratchpad da sessão):

```js
import { createRequire } from "node:module";
const require = createRequire("C:/Projects/menusync/package.json");
const sharp = require("sharp");

const SRC = "C:/Projects/menusync/public/bgFooter.webp";
const OUT = "C:/Projects/menusync/public/bgFooterInk.webp";

// duotone: L=0 (preto) -> dark-blue ; L=255 (branco) -> caramel
// out_c = darkblue_c + (L/255)*(caramel_c - darkblue_c)  ==> linear(a,b) com
// a = (caramel - darkblue)/255 ; b = darkblue
const a = [(227 - 42) / 255, (165 - 46) / 255, (107 - 55) / 255]; // ~[0.72549,0.46667,0.20392]
const b = [42, 46, 55];

// Pass 1: grayscale -> duotone, saída raw (sem recompressão)
const { data, info } = await sharp(SRC)
  .grayscale()
  .toColourspace("srgb")
  .linear(a, b)
  .raw()
  .toBuffer({ resolveWithObject: true });

// Pass 2: raw -> webp q90 (uma única compressão)
await sharp(data, {
  raw: { width: info.width, height: info.height, channels: info.channels },
})
  .webp({ quality: 90 })
  .toFile(OUT);

console.log("ok:", OUT, info.width + "x" + info.height, "channels=" + info.channels);
```

- [ ] **Step 2: Rodar o script**

Run:
```bash
node "<scratchpad>/recolor-footer.mjs"
```
Expected: imprime `ok: .../bgFooterInk.webp 2560x1440 channels=3` e o arquivo existe.

- [ ] **Step 3: Conferir o arquivo gerado**

Run:
```bash
ls -la public/bgFooterInk.webp
```
Expected: arquivo existe, tamanho plausível (dezenas a ~200KB). Abrir a imagem para inspeção visual: base dark-blue com pinceladas em tom caramel (mesma família das outras seções).

- [ ] **Step 4: Commit**

```bash
git add public/bgFooterInk.webp
git commit -m "feat(footer): fundo bgFooterInk recolorido no duotone do projeto"
```

---

## Task 3: Criar `FooterSection.tsx`

**Files:**
- Create: `app/(site)/_components/FooterSection.tsx`

**Contexto:** Componente autocontido do painel final. Ver `ReservasCTA.tsx` e `AboutSection.tsx` para o padrão (mesmo import de `PLACE`, mesma guarda de reduced-motion, mesmo estilo de fundo).

- [ ] **Step 1: Escrever o componente completo**

Criar `app/(site)/_components/FooterSection.tsx` com exatamente:

```tsx
"use client";

import { useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { z } from "zod";
import { PLACE } from "./about/about-data";

const PHONE = "(11) 3200-1590";
const PHONE_HREF = "tel:+551132001590";

// Índices correspondem à ordem dos painéis na roleta (SectionStage ITEMS).
const NAV = [
  { label: "Início", index: 0 },
  { label: "Cardápio", index: 1 },
  { label: "Sobre", index: 2 },
  { label: "Reservas", index: 3 },
];

// Ícones sociais (SVG inline, path único). href placeholder por enquanto (só front).
const SOCIALS: { label: string; path: string }[] = [
  {
    label: "Instagram",
    path: "M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 1.8.25 2.2.42.6.2 1 .5 1.4 1 .5.4.8.8 1 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-1 1.4-.4.5-.8.8-1.4 1-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-1-.5-.4-.8-.8-1-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 1-1.4.4-.5.8-.8 1.4-1 .4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.07-1.1.05-1.7.24-2.1.4-.5.2-.9.44-1.3.84-.4.4-.64.8-.84 1.3-.16.4-.35 1-.4 2.1-.06 1.2-.07 1.6-.07 3.7s.01 2.5.07 3.7c.05 1.1.24 1.7.4 2.1.2.5.44.9.84 1.3.4.4.8.64 1.3.84.4.16 1 .35 2.1.4 1.2.06 1.6.07 4.7.07s3.5-.01 4.7-.07c1.1-.05 1.7-.24 2.1-.4.5-.2.9-.44 1.3-.84.4-.4.64-.8.84-1.3.16-.4.35-1 .4-2.1.06-1.2.07-1.6.07-3.7s-.01-2.5-.07-3.7c-.05-1.1-.24-1.7-.4-2.1-.2-.5-.44-.9-.84-1.3-.4-.4-.8-.64-1.3-.84-.4-.16-1-.35-2.1-.4C15.5 4 15.1 4 12 4zm0 3.1a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8zm0 8.1a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm6.2-8.3a1.15 1.15 0 1 1-2.3 0 1.15 1.15 0 0 1 2.3 0z",
  },
  {
    label: "Facebook",
    path: "M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.75-1.6 1.5V12h2.8l-.45 2.9h-2.35v7A10 10 0 0 0 22 12z",
  },
  {
    label: "WhatsApp",
    path: "M17.5 14.4c-.3-.15-1.8-.9-2-1-.3-.1-.5-.15-.7.15-.2.3-.75 1-.9 1.15-.15.2-.35.2-.65.07-.3-.15-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.65-2.1-.15-.3 0-.45.13-.6.13-.13.3-.35.45-.5.15-.15.2-.3.3-.5.1-.2.05-.4-.02-.55-.08-.15-.7-1.65-.95-2.25-.25-.6-.5-.5-.7-.5h-.6c-.2 0-.5.07-.8.37-.3.3-1.1 1.05-1.1 2.55s1.12 2.95 1.28 3.15c.15.2 2.2 3.35 5.3 4.7.75.32 1.32.5 1.77.65.75.24 1.42.2 1.95.12.6-.09 1.8-.73 2.05-1.44.25-.7.25-1.3.18-1.44-.07-.13-.27-.2-.57-.35zM12 2a10 10 0 0 0-8.6 15.05L2 22l5.05-1.32A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3 .78.8-2.92-.2-.3A8.2 8.2 0 1 1 12 20.2z",
  },
];

const couponSchema = z.object({
  email: z.string().min(1, "Informe seu e-mail").email("E-mail inválido"),
});

function makeCoupon() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `SAKURA10-${s}`;
}

type Status = "idle" | "loading" | "success" | "error";

export default function FooterSection({
  active = false,
  onNavigate,
}: {
  active?: boolean;
  onNavigate?: (index: number) => void;
}) {
  const scope = useRef<HTMLElement>(null);
  const reduce = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const played = useRef(false);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [coupon, setCoupon] = useState<string | null>(null);

  useGSAP(
    () => {
      if (reduce || !active || played.current) return;
      played.current = true;
      const tl = gsap.timeline();
      tl.from(".footer-reveal", {
        y: 28,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: "power3.out",
      });
      tl.from(
        ".footer-col",
        { y: 24, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" },
        0.3,
      );
    },
    { scope, dependencies: [reduce, active] },
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = couponSchema.safeParse({ email });
    if (!parsed.success) {
      setStatus("error");
      setCoupon(null);
      setMessage(parsed.error.issues[0]?.message ?? "E-mail inválido");
      return;
    }
    setStatus("loading");
    setMessage("");
    // TODO(backend): trocar por POST /api/coupons (gera/persiste cupom + envia e-mail)
    await new Promise((r) => setTimeout(r, 700));
    setCoupon(makeCoupon());
    setStatus("success");
    setMessage("Cupom gerado! Use no checkout — enviamos uma cópia para o seu e-mail.");
  }

  return (
    <footer
      ref={scope}
      className="relative flex min-h-screen flex-col overflow-hidden bg-cover bg-center bg-no-repeat px-8 py-12 text-white md:px-12"
      style={{
        backgroundColor: "var(--color-dark-blue)",
        backgroundImage: "url('/bgFooterInk.webp')",
      }}
      aria-label="Cupom e contato"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[var(--color-dark-blue)]/75"
        aria-hidden="true"
      />

      {/* Região A — Cupom */}
      <div className="relative z-10 flex flex-1 flex-col justify-center">
        <p className="footer-reveal text-sm font-semibold tracking-[0.25em] text-yellow uppercase">
          クーポン · Newsletter
        </p>
        <h2
          className="footer-reveal mt-2 text-4xl font-bold md:text-6xl"
          style={{ fontFamily: "var(--font-eczar), serif" }}
        >
          Ganhe <span className="text-salmon">10%</span> no primeiro pedido
        </h2>
        <p className="footer-reveal mt-4 max-w-xl text-white/80">
          Cadastre seu e-mail e receba um cupom exclusivo direto na sua caixa de entrada.
        </p>

        <form
          onSubmit={onSubmit}
          className="footer-reveal mt-6 flex w-full max-w-xl flex-col gap-3 sm:flex-row"
          noValidate
        >
          <label htmlFor="coupon-email" className="sr-only">
            Seu e-mail
          </label>
          <input
            id="coupon-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status !== "idle") setStatus("idle");
            }}
            aria-invalid={status === "error"}
            className="h-12 flex-1 rounded-xl border-0 bg-dark-blue/60 px-4 text-sm text-white shadow-[0_0_0_1.5px_rgba(255,255,255,0.12)] backdrop-blur-sm transition-all duration-300 outline-none placeholder:text-white/55 hover:shadow-[0_0_0_2px_rgba(227,165,107,0.5)] focus:shadow-[0_0_0_2px_rgba(227,199,123,0.9)]"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-yellow px-6 text-sm font-semibold text-dark-blue transition-transform duration-200 hover:brightness-105 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "loading" ? "Enviando…" : "Quero meu cupom"}
            {status !== "loading" && <span aria-hidden="true">→</span>}
          </button>
        </form>

        <div className="footer-reveal mt-3 min-h-[1.5rem] text-sm" aria-live="polite">
          {status === "error" && <span className="text-salmon">{message}</span>}
          {status === "success" && (
            <span className="text-green">
              <strong className="font-semibold text-yellow">{coupon}</strong> — {message}
            </span>
          )}
        </div>
      </div>

      {/* Região B — Footer */}
      <div className="relative z-10 mt-10 border-t border-white/10 pt-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Marca + redes */}
          <div className="footer-col">
            <p className="text-xl font-bold" style={{ fontFamily: "var(--font-eczar), serif" }}>
              Menu<span className="text-salmon">Sync</span>
            </p>
            <p className="mt-2 max-w-xs text-sm text-white/70">
              Cozinha japonesa na Liberdade, desde 2009.
            </p>
            <div className="mt-4 flex gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="text-white/70 transition-colors hover:text-caramel"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Navegação */}
          <nav className="footer-col" aria-label="Navegação do rodapé">
            <p className="text-sm font-semibold tracking-wide text-yellow uppercase">Navegação</p>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              {NAV.map((n) => (
                <li key={n.label}>
                  <button
                    type="button"
                    onClick={() => onNavigate?.(n.index)}
                    className="transition-colors hover:text-caramel"
                  >
                    {n.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contato */}
          <div className="footer-col">
            <p className="text-sm font-semibold tracking-wide text-yellow uppercase">Contato</p>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li>{PLACE.address}</li>
              <li>{PLACE.hours}</li>
              <li>
                <a href={PHONE_HREF} className="transition-colors hover:text-caramel">
                  {PHONE}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-xs text-white/60">
          © 2026 MenuSync · feito com ♥ em São Paulo
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: sem erros. (O arquivo ainda não é importado por ninguém, mas deve compilar isolado.)

- [ ] **Step 3: Lint**

Run:
```bash
npm run lint
```
Expected: sem erros nem warnings novos.

- [ ] **Step 4: Commit**

```bash
git add "app/(site)/_components/FooterSection.tsx"
git commit -m "feat(footer): componente FooterSection (cupom + footer)"
```

---

## Task 4: Integrar no `SectionStage`

**Files:**
- Modify: `app/(site)/_components/SectionStage.tsx`

**Contexto:** Registrar o novo painel como 5º item da roleta e renderizar `FooterSection`, passando `onNavigate={goTo}`. O `goTo` já existe no componente (usado pela `SectionRoulette`). `activeIndex === 4` marca o painel como ativo.

- [ ] **Step 1: Adicionar o import**

Em `app/(site)/_components/SectionStage.tsx`, junto aos outros imports de componentes (após `import ReservasCTA from "./ReservasCTA";`), adicionar:

```tsx
import FooterSection from "./FooterSection";
```

- [ ] **Step 2: Adicionar o item na roleta**

No array `ITEMS`, após `{ id: "reservas", label: "Reservas" }`, adicionar a 5ª entrada:

```tsx
const ITEMS: RouletteItem[] = [
  { id: "inicio", label: "Início" },
  { id: "cardapio", label: "Cardápio" },
  { id: "sobre", label: "Sobre" },
  { id: "reservas", label: "Reservas" },
  { id: "contato", label: "Contato" },
];
```

- [ ] **Step 3: Adicionar o 5º painel**

Após o painel da Reservas (`<div className={panelClass}><ReservasCTA active={activeIndex === 3} /></div>`), adicionar:

```tsx
        {/* Painel 4 — Contato (cupom + footer) */}
        <div className={panelClass}>
          <FooterSection active={activeIndex === 4} onNavigate={goTo} />
        </div>
```

- [ ] **Step 4: Type-check + lint**

Run:
```bash
npx tsc --noEmit && npm run lint
```
Expected: ambos sem erros. (Confirma que `goTo` tem a assinatura `(index: number) => void` compatível com `onNavigate`.)

- [ ] **Step 5: Build de produção**

Run:
```bash
npm run build
```
Expected: build conclui sem erros.

- [ ] **Step 6: Commit**

```bash
git add "app/(site)/_components/SectionStage.tsx"
git commit -m "feat(home): registra painel Contato (cupom + footer) na roleta"
```

---

## Task 5: Verificação visual (CDP)

**Files:**
- Temp: `<scratchpad>/verify-footer.mjs`

**Contexto:** Servidor dev precisa estar rodando (`npm run dev` em background na porta 3000). Padrão CDP estabelecido: headless Chrome com `--autoplay-policy=no-user-gesture-required`, `Target.createTarget`/`attachToTarget` flatten, `Runtime.evaluate` com `awaitPromise`, `Page.captureScreenshot`. Ver `<scratchpad>/sakura-loop.mjs` como referência de estrutura.

- [ ] **Step 1: Subir o dev server**

Run (background):
```bash
npm run dev
```
Expected: servidor sobe em `http://localhost:3000`.

- [ ] **Step 2: Escrever o script CDP**

Criar `<scratchpad>/verify-footer.mjs` baseado em `sakura-loop.mjs`, adaptado para:
1. Navegar `http://localhost:3000`, esperar ~4.5s.
2. Clicar na pill "Contato" da roleta:
   ```js
   await evalJS(`[...document.querySelectorAll('nav[aria-label="Seções"] button')].filter(x=>x.offsetParent!==null).find(x=>x.textContent.trim().startsWith("Contato")).click()`);
   ```
   (Confirmar o `aria-label` real da roleta em `SectionRoulette.tsx`; ajustar o seletor se necessário.)
3. Esperar ~1.5s (animação de entrada) e capturar screenshot full 1440×900 → `footer-1-layout.png`.
4. Testar e-mail inválido:
   ```js
   await evalJS(`(()=>{const i=document.getElementById('coupon-email');i.value='invalido';i.dispatchEvent(new Event('input',{bubbles:true}));const nativeSetter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;nativeSetter.call(i,'invalido');i.dispatchEvent(new Event('input',{bubbles:true}));i.closest('form').requestSubmit();return true;})()`);
   ```
   Esperar ~0.4s, screenshot → `footer-2-erro.png`. Verificar mensagem vermelha "E-mail inválido".
5. Testar e-mail válido (mesmo padrão de setter nativo com `'teste@exemplo.com'`), `requestSubmit()`, esperar ~1.2s, screenshot → `footer-3-sucesso.png`. Verificar código `SAKURA10-XXXX` verde.
6. Ler o `currentTime`/estado não se aplica; apenas fechar.

- [ ] **Step 3: Rodar a verificação**

Run:
```bash
node "<scratchpad>/verify-footer.mjs"
```
Expected: gera os 3 screenshots sem erro.

- [ ] **Step 4: Inspecionar os screenshots**

Abrir `footer-1-layout.png`, `footer-2-erro.png`, `footer-3-sucesso.png` e confirmar:
- Fundo `bgFooterInk` recolorido (caramel/dark-blue), boa qualidade, sem 404.
- Layout: cupom no topo centralizado + faixa de footer (3 colunas) alinhada às laterais como as demais seções; barra de copyright embaixo.
- Erro: mensagem "E-mail inválido" em salmon abaixo do campo.
- Sucesso: código `SAKURA10-XXXX` em destaque + microcopy verde.
- (Opcional) Clicar numa pill de navegação do footer e confirmar que a roleta se move.

- [ ] **Step 5: Encerrar o dev server**

Parar o processo `npm run dev` em background.

- [ ] **Step 6 (se houver ajustes):** Corrigir o que os screenshots revelarem em `FooterSection.tsx`, repetir tsc/lint/build + CDP, e commitar as correções com mensagem descritiva.

---

## Limpeza final (após aprovação visual)

- [ ] Avaliar remover `public/bgFooter.webp` (fonte crua, não mais referenciada) via `git rm` — confirmar com o usuário antes, seguindo o padrão de limpeza da sessão anterior.

---

## Self-Review (cobertura do spec)

- Componente `FooterSection` com `active` + `onNavigate` → Task 3. ✓
- Fundo recolorido duotone (raw intermediário, q90) → Task 2. ✓
- Layout: cupom topo + footer 3 colunas + copyright, alinhado às laterais → Task 3. ✓
- Cupom: Zod, estados idle/loading/success/error, código fake, aria-live, TODO backend → Tasks 1 + 3. ✓
- Navegação do footer aciona a roleta (`onNavigate`/`goTo`) → Tasks 3 + 4. ✓
- Redes sociais SVG inline placeholder, contato com PLACE + telefone → Task 3. ✓
- Animação restrained com guarda reduced-motion → Task 3. ✓
- Integração na roleta como 5º painel "Contato" → Task 4. ✓
- Verificação tsc/lint/build + CDP → Tasks 3–5. ✓
