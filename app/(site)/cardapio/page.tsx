import type { Metadata } from "next";
import { listarCategorias, listarProdutos } from "@/lib/catalogo/queries";
import CardapioClient from "./_components/CardapioClient";

export const metadata: Metadata = {
  title: "Cardápio — MenuSync",
  description:
    "O cardápio completo da MenuSync: sushi, rolls, pratos quentes, sobremesas e bebidas.",
};

// O Prisma nao roda no runtime edge.
export const runtime = "nodejs";
// Sem isto o Next tentaria pre-renderizar no build, e ai getEnv() dispararia num
// ambiente sem .env (mesma razao das rotas de cupom).
export const dynamic = "force-dynamic";

export default async function CardapioPage() {
  const [categorias, produtos] = await Promise.all([
    listarCategorias(),
    listarProdutos(),
  ]);

  return <CardapioClient categorias={categorias} produtos={produtos} />;
}
