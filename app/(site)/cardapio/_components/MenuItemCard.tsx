import Image from "next/image";
import type { ProdutoDTO } from "@/lib/catalogo/queries";
import AddToCartButton from "../../_components/AddToCartButton";
import { brl } from "../../_lib/price";
import { deProduto } from "../../_data/cart";

export default function MenuItemCard({ item }: { item: ProdutoDTO }) {
  // Sem precoFinal() aqui: o unitPrice ja veio calculado do servidor.
  const hasDiscount = item.discount !== null && item.discount > 0;

  return (
    <article className="menu-card group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm transition hover:bg-white/[0.07]">
      {hasDiscount && (
        <span className="absolute top-3 right-3 z-10 rounded-full bg-salmon px-2 py-1 text-xs font-bold text-white">
          -{item.discount}%
        </span>
      )}

      <div className="flex items-center justify-center py-2">
        <Image
          src={item.image}
          alt={item.name}
          width={220}
          height={220}
          className="h-28 w-auto max-w-[60%] object-contain drop-shadow-xl transition duration-500 group-hover:scale-105"
        />
      </div>

      <h3
        className="mt-3 text-lg font-bold"
        style={{ fontFamily: "var(--font-eczar), serif" }}
      >
        {item.name}
      </h3>
      <p className="mt-1 flex-1 text-sm text-white/70">{item.description}</p>
      <p className="mt-2 text-xs text-white/50">{item.weight}</p>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span
          className="flex flex-col leading-tight"
          style={{ fontFamily: "var(--font-eczar), serif" }}
        >
          {hasDiscount && (
            <span className="text-xs text-white/50 line-through">
              {brl.format(item.price)}
            </span>
          )}
          <span className="text-lg font-medium">{brl.format(item.unitPrice)}</span>
        </span>
        <AddToCartButton compact item={deProduto(item)} />
      </div>
    </article>
  );
}
