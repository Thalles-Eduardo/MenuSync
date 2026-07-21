export type Review = {
  author: string;
  rating: number; // 1-5
  text: string;
};

/** O que e editorial da home e nao existe no catalogo. */
export type DishEditorial = {
  slug: string;
  tagline: string;
  plate: string; // imagem central (alta)
  thumb: string; // miniatura do carrossel
  video?: string; // video de preparo
  reviews: Review[];
  ingredients: string[];
};

/**
 * O que os componentes da home consomem: editorial + os campos que vem do
 * banco. `name` e `price` NAO sao mais escritos a mao aqui — eram copias dos
 * mesmos pratos em menu.ts e podiam divergir do que o carrinho cobrava.
 */
export type Dish = DishEditorial & {
  id: string; // = slug; SectionStage usa como chave e como activeDishId
  name: string;
  price: number; // preco de tabela
  unitPrice: number; // ja com desconto
  weight: string;
};

export const dishesEditorial: DishEditorial[] = [
  {
    slug: "teishoku",
    tagline: "#1 Melhor prato da casa!",
    plate: "/plate1.webp",
    thumb: "/food1.webp",
    video: "/video/preparation1.mp4",
    reviews: [
      { author: "Maria Bretanio", rating: 3, text: "Combinação equilibrada, veio tudo fresquinho." },
      { author: "Barry Alien", rating: 3, text: "Porção generosa, o frango teriyaki é o destaque." },
      { author: "Bruce Banner", rating: 3, text: "Prato completo, saí muito satisfeito." },
      { author: "Carla Almeida", rating: 3, text: "Apresentação linda e sabor autêntico." },
    ],
    ingredients: ["Salmão", "Arroz japonês", "Frango teriyaki", "Tempurá de camarão", "Sunomono", "Shoyu"],
  },
  {
    slug: "sopa-misso",
    tagline: "Reconforto em cada colher",
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
    slug: "sushi-10",
    tagline: "Seleção do sushiman",
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
    slug: "okonomiyaki",
    tagline: "A pizza japonesa da casa",
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
