import { buscarProdutosPorSlug } from "@/lib/catalogo/queries";
import SectionStage from "./_components/SectionStage";
import Loader from "./_components/Loader";
import { dishesEditorial, type Dish } from "./_data/dishes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SiteHome() {
  const produtos = await buscarProdutosPorSlug(
    dishesEditorial.map((d) => d.slug),
  );
  const porSlug = new Map(produtos.map((p) => [p.slug, p]));

  // Um prato editorial sem produto correspondente e simplesmente omitido: e
  // conteudo de vitrine, nao pode derrubar a home se alguem apagar o produto
  // no admin.
  const dishes: Dish[] = dishesEditorial.flatMap((d) => {
    const produto = porSlug.get(d.slug);
    if (!produto) return [];
    return [
      {
        ...d,
        id: d.slug,
        name: produto.name,
        price: produto.price,
        unitPrice: produto.unitPrice,
      },
    ];
  });

  return (
    <>
      <Loader />
      <SectionStage dishes={dishes} />
    </>
  );
}
