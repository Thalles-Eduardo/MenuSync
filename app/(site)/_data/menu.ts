export type MenuCategory =
  | "sushi"
  | "rolls"
  | "entradas"
  | "quentes"
  | "sobremesas"
  | "bebidas";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  weight: string;
  price: number; // preço original em BRL (se houver desconto, é o "de")
  category: MenuCategory;
  image: string; // reusa imagens existentes em /public
  discount?: number; // porcentagem (ex.: 15) → badge "-15%" + preço riscado
};

export const CATEGORIES: { id: MenuCategory; label: string }[] = [
  { id: "sushi", label: "Sushi" },
  { id: "rolls", label: "Rolls & Temaki" },
  { id: "entradas", label: "Sopas & Entradas" },
  { id: "quentes", label: "Pratos Quentes" },
  { id: "sobremesas", label: "Sobremesas" },
  { id: "bebidas", label: "Bebidas" },
];

export const menu: MenuItem[] = [
  // Sushi
  {
    id: "sushi-10",
    name: "Sushi 10 P/c",
    description: "Seleção do sushiman com salmão, atum e camarão sobre arroz shari.",
    weight: "10 un.",
    price: 89.9,
    category: "sushi",
    image: "/plate4.png",
  },
  {
    id: "niguiri-salmao",
    name: "Niguiri de Salmão",
    description: "Fatia de salmão fresco sobre bolinho de arroz temperado.",
    weight: "6 un.",
    price: 42.9,
    category: "sushi",
    image: "/plate1.webp",
  },
  {
    id: "sashimi-misto",
    name: "Sashimi Misto",
    description: "Cortes de salmão, atum e peixe branco selecionados do dia.",
    weight: "12 un.",
    price: 78.9,
    category: "sushi",
    image: "/food4.webp",
    discount: 15,
  },
  {
    id: "combinado-sakura",
    name: "Combinado Sakura",
    description: "20 peças variadas entre niguiris, uramaki e sashimi.",
    weight: "20 un.",
    price: 129.9,
    category: "sushi",
    image: "/plate3.png",
  },
  // Rolls & Temaki
  {
    id: "uramaki-filadelfia",
    name: "Uramaki Filadélfia",
    description: "Salmão, cream cheese e cebolinha, gergelim por fora.",
    weight: "8 un.",
    price: 38.9,
    category: "rolls",
    image: "/food1.webp",
  },
  {
    id: "hot-roll",
    name: "Hot Roll Especial",
    description: "Uramaki empanado e frito, finalizado com molho tarê.",
    weight: "8 un.",
    price: 44.9,
    category: "rolls",
    image: "/food2.webp",
  },
  {
    id: "temaki-salmao",
    name: "Temaki de Salmão",
    description: "Cone de alga recheado com salmão, arroz e cream cheese.",
    weight: "1 un.",
    price: 32.9,
    category: "rolls",
    image: "/plate2.png",
    discount: 10,
  },
  {
    id: "uramaki-skin",
    name: "Uramaki Skin",
    description: "Pele de salmão crocante, cream cheese e cebolinha.",
    weight: "8 un.",
    price: 34.9,
    category: "rolls",
    image: "/food3.webp",
  },
  // Sopas & Entradas
  {
    id: "sopa-misso",
    name: "Sopa de Missô",
    description: "Caldo tradicional com tofu, alga wakame e cebolinha.",
    weight: "300 ml",
    price: 24.9,
    category: "entradas",
    image: "/plate3.png",
  },
  {
    id: "gyoza",
    name: "Gyoza",
    description: "Pastéis japoneses de porco e legumes grelhados na chapa.",
    weight: "6 un.",
    price: 29.9,
    category: "entradas",
    image: "/food2.webp",
  },
  {
    id: "sunomono",
    name: "Sunomono",
    description: "Salada agridoce de pepino com gergelim e kani.",
    weight: "200 g",
    price: 22.9,
    category: "entradas",
    image: "/plate1.webp",
  },
  {
    id: "edamame",
    name: "Edamame",
    description: "Vagens de soja no vapor com flor de sal.",
    weight: "150 g",
    price: 19.9,
    category: "entradas",
    image: "/food4.webp",
  },
  // Pratos Quentes
  {
    id: "teishoku",
    name: "Teishoku Japonês",
    description: "Combinado completo com salmão, teriyaki e tempurá.",
    weight: "1 porção",
    price: 149.99,
    category: "quentes",
    image: "/plate1.webp",
  },
  {
    id: "okonomiyaki",
    name: "Okonomiyaki",
    description: "A 'pizza japonesa' com repolho, molho e katsuobushi.",
    weight: "1 un.",
    price: 54.9,
    category: "quentes",
    image: "/plate2.png",
  },
  {
    id: "yakisoba",
    name: "Yakisoba de Frango",
    description: "Macarrão salteado com frango, legumes e molho shoyu.",
    weight: "400 g",
    price: 46.9,
    category: "quentes",
    image: "/food1.webp",
    discount: 15,
  },
  {
    id: "tempura-camarao",
    name: "Tempurá de Camarão",
    description: "Camarões empanados na massa leve e crocante.",
    weight: "8 un.",
    price: 58.9,
    category: "quentes",
    image: "/plate4.png",
  },
  // Sobremesas
  {
    id: "mochi",
    name: "Mochi (3 un.)",
    description: "Bolinhos de arroz gelados recheados de sorvete.",
    weight: "3 un.",
    price: 26.9,
    category: "sobremesas",
    image: "/food3.webp",
  },
  {
    id: "harumaki-banana",
    name: "Harumaki de Banana",
    description: "Rolinho crocante de banana com canela e açúcar.",
    weight: "4 un.",
    price: 22.9,
    category: "sobremesas",
    image: "/plate2.png",
  },
  {
    id: "dorayaki",
    name: "Dorayaki",
    description: "Panqueca japonesa recheada com doce de feijão azuki.",
    weight: "1 un.",
    price: 18.9,
    category: "sobremesas",
    image: "/food4.webp",
  },
  // Bebidas
  {
    id: "cha-verde",
    name: "Chá Verde Gelado",
    description: "Chá verde gelado levemente adoçado, jarra individual.",
    weight: "500 ml",
    price: 14.9,
    category: "bebidas",
    image: "/food1.webp",
  },
  {
    id: "ramune",
    name: "Ramune",
    description: "Refrigerante japonês clássico de garrafa de gude.",
    weight: "200 ml",
    price: 16.9,
    category: "bebidas",
    image: "/plate3.png",
  },
  {
    id: "sake-quente",
    name: "Saquê Quente",
    description: "Saquê tradicional servido morno, dose individual.",
    weight: "180 ml",
    price: 28.9,
    category: "bebidas",
    image: "/plate4.png",
    discount: 10,
  },
];
