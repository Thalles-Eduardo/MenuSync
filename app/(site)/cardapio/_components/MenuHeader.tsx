import Link from "next/link";

export default function MenuHeader() {
  return (
    <header className="flex items-center justify-between">
      <Link
        href="/"
        className="text-xl font-bold"
        style={{ fontFamily: "var(--font-eczar), serif" }}
      >
        Menu<span className="text-salmon">Sync</span>
      </Link>
      <Link
        href="/"
        className="group inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-caramel"
      >
        <span
          aria-hidden="true"
          className="transition-transform group-hover:-translate-x-1"
        >
          ←
        </span>
        Voltar
      </Link>
    </header>
  );
}
