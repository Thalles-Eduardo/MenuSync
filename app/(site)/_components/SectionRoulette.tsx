"use client";

// Navegador de seções. Desktop: tambor vertical fixo na lateral direita.
// Mobile: barra inferior de pills. Apresentacional — não guarda estado.

export type RouletteItem = { id: string; label: string };

export default function SectionRoulette({
  items,
  activeIndex,
  onSelect,
}: {
  items: RouletteItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      onSelect(Math.min(items.length - 1, activeIndex + 1));
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      onSelect(Math.max(0, activeIndex - 1));
    }
  }

  return (
    <>
      {/* Desktop: tambor lateral direito */}
      <nav
        aria-label="Seções"
        onKeyDown={onKeyDown}
        className="pointer-events-auto fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-end gap-3 lg:flex"
      >
        {items.map((it, i) => {
          const active = i === activeIndex;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onSelect(i)}
              aria-current={active ? "true" : undefined}
              className={
                "group flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold tracking-wide backdrop-blur-sm transition-all duration-300 " +
                (active
                  ? "border-yellow/70 bg-yellow text-dark-blue scale-105"
                  : "border-white/20 bg-white/5 text-white/80 hover:border-yellow/50 hover:text-white")
              }
            >
              <span>{it.label}</span>
              <span
                aria-hidden="true"
                className={
                  "h-2 w-2 rounded-full transition " +
                  (active ? "bg-dark-blue" : "bg-yellow/70 group-hover:bg-yellow")
                }
              />
            </button>
          );
        })}
      </nav>

      {/* Mobile: pills embaixo */}
      <nav
        aria-label="Seções"
        className="pointer-events-auto fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2 border-t border-white/10 bg-dark-blue/80 px-4 py-3 backdrop-blur-sm lg:hidden"
      >
        {items.map((it, i) => {
          const active = i === activeIndex;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onSelect(i)}
              aria-current={active ? "true" : undefined}
              className={
                "rounded-full border px-4 py-2 text-sm font-semibold transition " +
                (active
                  ? "border-yellow/70 bg-yellow text-dark-blue"
                  : "border-white/20 bg-white/5 text-white/80")
              }
            >
              {it.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
