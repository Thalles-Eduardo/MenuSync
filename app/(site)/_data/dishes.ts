export type Review = {
  author: string;
  rating: number; // 1-5
  text: string;
};

export type Dish = {
  id: string;
  name: string;
  tagline: string;
  price: number;
  plate: string; // imagem central (alta)
  thumb: string; // miniatura do carrossel
  reviews: Review[];
  ingredients: string[];
};

export const dishes: Dish[] = [
  {
    id: "teishoku",
    name: "Teishoku Japonês",
    tagline: "#1 Melhor prato da casa!",
    price: 149.99,
    plate: "/plate1.webp",
    thumb: "/food1.webp",
    reviews: [
      { author: "Maria Bretanio", rating: 3, text: "Combinação equilibrada, veio tudo fresquinho." },
      { author: "Barry Alien", rating: 3, text: "Porção generosa, o frango teriyaki é o destaque." },
      { author: "Bruce Banner", rating: 3, text: "Prato completo, saí muito satisfeito." },
      { author: "Carla Almeida", rating: 3, text: "Apresentação linda e sabor autêntico." },
    ],
    ingredients: ["Salmão", "Arroz japonês", "Frango teriyaki", "Tempurá de camarão", "Sunomono", "Shoyu"],
  },
  {
    id: "sopa-misso",
    name: "Sopa de Missô",
    tagline: "Reconforto em cada colher",
    price: 24.9,
    plate: "/plate3.png",
    thumb: "/food3.webp",
    reviews: [
      { author: "Rafael Souza", rating: 3, text: "Caldo no ponto certo de sal, bem tradicional." },
      { author: "Ana Lima", rating: 3, text: "Tofu macio e alga fresca, adorei." },
      { author: "Pedro Nunes", rating: 3, text: "Perfeita para começar a refeição." },
      { author: "Júlia Reis", rating: 3, text: "Aconchegante e leve." },
    ],
    ingredients: ["Pasta de missô", "Tofu", "Alga wakame", "Cebolinha", "Dashi"],
  },
  {
    id: "sushi-10",
    name: "Sushi 10 P/c",
    tagline: "Seleção do sushiman",
    price: 89.9,
    plate: "/plate4.png",
    thumb: "/food4.webp",
    reviews: [
      { author: "Lucas Prado", rating: 3, text: "Peixe fresco e corte impecável." },
      { author: "Marina Costa", rating: 3, text: "Variedade ótima para dividir." },
      { author: "Diego Alves", rating: 3, text: "Arroz temperado na medida certa." },
      { author: "Bianca Melo", rating: 3, text: "Melhor combinado da região." },
    ],
    ingredients: ["Salmão", "Atum", "Camarão", "Arroz shari", "Nori", "Gengibre", "Wasabi"],
  },
  {
    id: "okonomiyaki",
    name: "Okonomiyaki",
    tagline: "A pizza japonesa da casa",
    price: 54.9,
    plate: "/plate2.png",
    thumb: "/food2.webp",
    reviews: [
      { author: "Thiago Ramos", rating: 3, text: "Cheio de sabor, o katsuobushi faz diferença." },
      { author: "Sofia Dias", rating: 3, text: "Massa fofinha e bem recheada." },
      { author: "Gabriel Pinto", rating: 3, text: "Molho na medida, viciante." },
      { author: "Helena Cruz", rating: 3, text: "Diferente e delicioso." },
    ],
    ingredients: ["Repolho", "Massa de okonomiyaki", "Molho okonomiyaki", "Maionese japonesa", "Katsuobushi", "Aonori"],
  },
];
