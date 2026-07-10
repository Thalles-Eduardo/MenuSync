export type Milestone = { year: string; title: string; text: string };

export const MILESTONES: Milestone[] = [
  { year: "2009", title: "Fundação", text: "Abrimos as portas na Liberdade, o coração japonês de São Paulo." },
  { year: "2013", title: "Primeiro reconhecimento", text: "O teishoku da casa entra na lista dos melhores pratos japoneses da cidade." },
  { year: "2017", title: "Reforma e ampliação", text: "Um salão maior e um balcão de sushi à vista de todos." },
  { year: "2021", title: "Menu autoral", text: "Nosso novo sushiman-chefe assina uma seleção autoral de temporada." },
  { year: "2025", title: "MenuSync", text: "Levamos a experiência da casa para o digital — do cardápio à reserva." },
];

export type Place = {
  name: string;
  address: string;
  hours: string;
  coords: [number, number];
};

export const PLACE: Place = {
  name: "MenuSync",
  address: "Rua dos Estudantes, 123 — Liberdade, São Paulo — SP",
  hours: "Terça a domingo, 18h às 23h",
  coords: [-23.5589, -46.6347],
};
