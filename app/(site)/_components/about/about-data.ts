export type Milestone = { year: string; title: string; text: string };

export const MILESTONES: Milestone[] = [
  { year: "2009", title: "Fundação", text: "Abrimos as portas na Liberdade, o coração japonês de São Paulo." },
  { year: "2010", title: "Balcão de sushi", text: "Instalamos o balcão de sushi à vista, com o sushiman preparando na hora." },
  { year: "2012", title: "Nasce o teishoku", text: "Criamos o teishoku da casa — a combinação que virou nossa assinatura." },
  { year: "2013", title: "Primeiro reconhecimento", text: "Entramos na lista dos melhores pratos japoneses da cidade." },
  { year: "2015", title: "Forno robata", text: "Chega a grelha robata, e com ela os pratos na brasa." },
  { year: "2017", title: "Reforma e ampliação", text: "Um salão maior e mais aconchegante, sem perder a alma izakaya." },
  { year: "2019", title: "Menu vegetariano", text: "Lançamos uma seleção vegetariana sazonal, com produtos do dia." },
  { year: "2021", title: "Menu autoral", text: "Nosso novo sushiman-chefe assina uma seleção autoral de temporada." },
  { year: "2022", title: "Delivery próprio", text: "Levamos a experiência da casa até você, com entrega própria." },
  { year: "2024", title: "Noites de omakasê", text: "Estreamos as noites de omakasê — o chef decide, você se surpreende." },
  { year: "2025", title: "MenuSync", text: "Levamos a casa para o digital, do cardápio à reserva." },
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
