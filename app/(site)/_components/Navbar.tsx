import Image from "next/image";

const icons = [
  { src: "/icons/search.svg", alt: "Buscar" },
  { src: "/icons/cart.svg", alt: "Carrinho" },
  { src: "/icons/menu.svg", alt: "Menu" },
];

export default function Navbar() {
  return (
    <nav className="relative z-20 flex items-center justify-between px-6 py-6 md:px-12">
      <span
        className="text-2xl font-semibold tracking-wide text-white md:text-3xl"
        style={{ fontFamily: "var(--font-eczar), serif" }}
      >
        Menu<span className="text-salmon">Sync</span>
      </span>

      <div className="flex items-center gap-4 md:gap-6">
        {icons.map((icon) => (
          <button
            key={icon.alt}
            type="button"
            aria-label={icon.alt}
            className="opacity-90 transition hover:scale-110 hover:opacity-100"
          >
            <Image
              src={icon.src}
              alt={icon.alt}
              width={32}
              height={32}
              className="h-7 w-7 md:h-8 md:w-8"
            />
          </button>
        ))}
      </div>
    </nav>
  );
}
