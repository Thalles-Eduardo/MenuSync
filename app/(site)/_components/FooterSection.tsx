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
    if (status === "loading") return;
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
              if (status === "error") setStatus("idle");
            }}
            aria-invalid={status === "error"}
            className="h-12 flex-1 rounded-xl border-0 bg-dark-blue/60 px-4 text-sm text-white shadow-[0_0_0_1.5px_rgba(255,255,255,0.12)] backdrop-blur-sm transition-all duration-300 outline-none placeholder:text-white/55 hover:shadow-[0_0_0_2px_rgba(227,165,107,0.5)] focus:shadow-[0_0_0_2px_rgba(227,199,123,0.9)]"
          />
          <button type="submit" disabled={status === "loading"} className="coupon-btn">
            <div>
              <span>
                {status === "loading" ? "Enviando…" : "Quero meu cupom"}
                {status !== "loading" && <span aria-hidden="true">→</span>}
              </span>
            </div>
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
