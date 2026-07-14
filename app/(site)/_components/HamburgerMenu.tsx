"use client";

import { useState, type ReactNode } from "react";

type Item = { label: string; icon: ReactNode };

const items: Item[] = [
  {
    label: "Início",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 11 12 3l9 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10v10h14V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Cardápio",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 8h6M9 12h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Reservas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 6h16v15H4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M4 10h16M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Sobre",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Contato",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 6h18v12H3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="m3 7 9 6 9-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="wrap">
      {open && (
        <button type="button" aria-label="Fechar menu" className="overlay" onClick={() => setOpen(false)} />
      )}

      <label className="hamburger">
        <input
          type="checkbox"
          checked={open}
          onChange={(e) => setOpen(e.target.checked)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        />
        <svg viewBox="0 0 32 32">
          <path
            d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
            className="line line-top-bottom"
          />
          <path d="M7 16 27 16" className="line" />
        </svg>
      </label>

      {open && (
        <div className="panel">
          <div className="list">
            {items.map((it) => (
              <button key={it.label} type="button" className="item" onClick={() => setOpen(false)}>
                {it.icon}
                {it.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .wrap {
          position: relative;
          display: inline-flex;
          line-height: 0;
        }

        
        .hamburger {
          cursor: pointer;
          display: inline-flex;
        }
        .hamburger input {
          display: none;
        }
        .hamburger svg {
          height: 2.1rem;
          width: 2.1rem;
          transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .line {
          fill: none;
          stroke: #fff;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-width: 3;
          transition: stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1),
            stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .line-top-bottom {
          stroke-dasharray: 12 63;
        }
        .hamburger input:checked + svg {
          transform: rotate(-45deg);
        }
        .hamburger input:checked + svg .line-top-bottom {
          stroke-dasharray: 20 300;
          stroke-dashoffset: -32.42;
        }

        /* Fecha ao clicar fora */
        .overlay {
          position: fixed;
          inset: 0;
          z-index: 40;
          background: transparent;
          border: 0;
          cursor: default;
        }

        /* Painel do menu (fuzzy-cow-8) */
        .panel {
          position: absolute;
          right: 0;
          top: calc(100% + 14px);
          z-index: 50;
          transform-origin: top right;
          animation: menuIn 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        @keyframes menuIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .list {
          display: flex;
          flex-direction: column;
          width: 220px;
          background: rgba(18, 20, 26, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 10px;
          overflow: hidden;
        }
        .item {
          font-size: 15px;
          background: transparent;
          border: 2px solid transparent;
          padding: 10px;
          color: #fff;
          display: flex;
          align-items: center;
          position: relative;
          gap: 10px;
          cursor: pointer;
          border-radius: 10px;
          transition: 320ms;
          box-sizing: border-box;
          text-align: left;
        }
        .item:hover,
        .item:focus {
          border: 2px solid rgba(255, 255, 255, 0.12);
          color: #e7c9c9;
        }
        .item:focus,
        .item:active {
          background: rgba(255, 255, 255, 0.06);
          outline: none;
          margin-left: 14px;
        }
        .item::before {
          content: "";
          position: absolute;
          top: 5px;
          left: -14px;
          width: 4px;
          height: 80%;
          background: #e36b6b;
          border-radius: 5px;
          opacity: 0;
          transition: 320ms;
        }
        .item:focus::before,
        .item:active::before {
          opacity: 1;
        }
        .item :global(svg) {
          width: 20px;
          height: 20px;
          flex: none;
        }

        /* Efeito "fuzzy": desfoca os outros itens ao passar o mouse em um */
        .list:hover > :not(.item:hover) {
          transition: 300ms;
          filter: blur(1.4px);
          transform: scale(0.96);
        }
      `}</style>
    </div>
  );
}
