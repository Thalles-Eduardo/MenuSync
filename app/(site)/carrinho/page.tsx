import type { Metadata } from "next";
import CarrinhoClient from "./_components/CarrinhoClient";

export const metadata: Metadata = {
  title: "Carrinho — MenuSync",
  description: "Seu pedido na MenuSync: revise os itens e finalize.",
};

export default function CarrinhoPage() {
  return <CarrinhoClient />;
}
