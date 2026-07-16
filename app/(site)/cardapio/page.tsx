import type { Metadata } from "next";
import CardapioClient from "./_components/CardapioClient";

export const metadata: Metadata = {
  title: "Cardápio — MenuSync",
  description:
    "O cardápio completo da MenuSync: sushi, rolls, pratos quentes, sobremesas e bebidas.",
};

export default function CardapioPage() {
  return <CardapioClient />;
}
