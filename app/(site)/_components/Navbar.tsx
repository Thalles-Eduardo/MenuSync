import TransitionLink from "./TransitionLink";
import HamburgerMenu from "./HamburgerMenu";
import CartButton from "./CartButton";
import Image from "next/image";

export default function Navbar({
  onSelectSection,
}: {
  onSelectSection?: (index: number) => void;
}) {
  return (
    // px-8 md:px-12 espelha a goteira lateral das paginas (/cardapio, /carrinho e
    // as secoes da home). Com px-6 o logo ficava 8px a esquerda do conteudo no
    // mobile, quebrando o alinhamento vertical da coluna.
    <nav className="navbar-vt fixed inset-x-0 top-0 z-[55] flex items-center justify-between px-8 py-6 md:px-12">
      <TransitionLink
        href="/"
        className="text-2xl font-semibold tracking-wide text-white transition hover:opacity-90 md:text-3xl"
        style={{ fontFamily: "var(--font-eczar), serif" }}
      >
        {/* O arquivo e 160x160. Com `h-20 w-25` (80x100) o logo era esticado 25%
            na horizontal; `w-auto` preserva a proporcao. O width/height de 160
            continua sendo o dobro do tamanho exibido, para nao borrar em telas 2x. */}
        <Image
          src="/logoMenuSync.webp"
          width={160}
          height={160}
          alt="Logo MenuSync"
          className="h-20 w-auto"
          priority
        />
      </TransitionLink>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Busca — componente uiverse (tidy-pig-67), recolorido para a paleta do projeto */}
        <div className="group relative hidden max-w-[190px] items-center md:flex">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="pointer-events-none absolute left-4 z-[1] h-4 w-4 fill-white/70 transition-colors duration-300 group-focus-within:fill-caramel"
          >
            <g>
              <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z" />
            </g>
          </svg>
          <input
            id="query"
            name="searchbar"
            type="search"
            placeholder="Buscar..."
            aria-label="Buscar"
            className="h-11 w-full rounded-xl border-0 bg-dark-blue/60 pl-10 text-sm text-white shadow-[0_0_0_1.5px_rgba(255,255,255,0.12),0_0_25px_-17px_#000] backdrop-blur-sm transition-all duration-300 outline-none placeholder:text-white/55 hover:shadow-[0_0_0_2px_rgba(227,165,107,0.5),0_0_25px_-15px_#000] focus:shadow-[0_0_0_2px_rgba(227,199,123,0.9)] active:scale-[0.97]"
          />
        </div>

        {/* Carrinho */}
        <CartButton />

        <HamburgerMenu onSelectSection={onSelectSection} />
      </div>
    </nav>
  );
}
