import Image from "next/image";

const icons = [
  { src: "/icons/search.svg", alt: "Buscar" },
  { src: "/icons/menu.svg", alt: "Menu" },
  { src: "/icons/cart.svg", alt: "Carrinho" },
];

export default function Navbar() {
  return (
    <nav className="flex items-center justify-end gap-6 px-8 py-6 md:px-12">
      {icons.map((icon) => (
        <button
          key={icon.alt}
          aria-label={icon.alt}
          className="opacity-90 transition hover:scale-110 hover:opacity-100"
        >
          <Image src={icon.src} alt={icon.alt} width={26} height={26} />
        </button>
      ))}
    </nav>
  );
}
