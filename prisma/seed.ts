import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// O seed roda fora do Next, entao nao passa por lib/prisma.ts (que existe para
// resolver o problema de hot-reload do dev server). Client proprio, fechado no
// fim.
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  // Sem isto o erro sai la de dentro do driver pg, sem dizer o que faltou.
  // Nao usamos getEnv() de proposito: ele exige RESEND_API_KEY e
  // COUPON_FROM_EMAIL, que o seed nao tem por que precisar.
  throw new Error("DATABASE_URL nao definida — o seed precisa dela no .env");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: DATABASE_URL }),
});

const CATEGORIAS = [
  { slug: "sushi", label: "Sushi", position: 1 },
  { slug: "rolls", label: "Rolls & Temaki", position: 2 },
  { slug: "entradas", label: "Sopas & Entradas", position: 3 },
  { slug: "quentes", label: "Pratos Quentes", position: 4 },
  { slug: "sobremesas", label: "Sobremesas", position: 5 },
  { slug: "bebidas", label: "Bebidas", position: 6 },
] as const;

type CategoriaSlug = (typeof CATEGORIAS)[number]["slug"];

type SeedProduto = {
  slug: string;
  name: string;
  description: string;
  weight: string;
  // String, nunca number: a coluna e Decimal(10,2) e um float aqui
  // reintroduziria o erro de precisao que ela existe para evitar.
  price: string;
  category: CategoriaSlug;
  image: string;
  discount: number | null;
};

const PRODUTOS: SeedProduto[] = [
  { slug: "sushi-10", name: "Sushi 10 P/c", description: "Seleção do sushiman com salmão, atum e camarão sobre arroz shari.", weight: "10 un.", price: "89.90", category: "sushi", image: "/plate4.png", discount: null },
  { slug: "niguiri-salmao", name: "Niguiri de Salmão", description: "Fatia de salmão fresco sobre bolinho de arroz temperado.", weight: "6 un.", price: "42.90", category: "sushi", image: "/plate1.webp", discount: null },
  { slug: "sashimi-misto", name: "Sashimi Misto", description: "Cortes de salmão, atum e peixe branco selecionados do dia.", weight: "12 un.", price: "78.90", category: "sushi", image: "/food4.webp", discount: 15 },
  { slug: "combinado-sakura", name: "Combinado Sakura", description: "20 peças variadas entre niguiris, uramaki e sashimi.", weight: "20 un.", price: "129.90", category: "sushi", image: "/plate3.png", discount: null },

  { slug: "uramaki-filadelfia", name: "Uramaki Filadélfia", description: "Salmão, cream cheese e cebolinha, gergelim por fora.", weight: "8 un.", price: "38.90", category: "rolls", image: "/food1.webp", discount: null },
  { slug: "hot-roll", name: "Hot Roll Especial", description: "Uramaki empanado e frito, finalizado com molho tarê.", weight: "8 un.", price: "44.90", category: "rolls", image: "/food2.webp", discount: null },
  { slug: "temaki-salmao", name: "Temaki de Salmão", description: "Cone de alga recheado com salmão, arroz e cream cheese.", weight: "1 un.", price: "32.90", category: "rolls", image: "/plate2.png", discount: 10 },
  { slug: "uramaki-skin", name: "Uramaki Skin", description: "Pele de salmão crocante, cream cheese e cebolinha.", weight: "8 un.", price: "34.90", category: "rolls", image: "/food3.webp", discount: null },

  { slug: "sopa-misso", name: "Sopa de Missô", description: "Caldo tradicional com tofu, alga wakame e cebolinha.", weight: "300 ml", price: "24.90", category: "entradas", image: "/plate3.png", discount: null },
  { slug: "gyoza", name: "Gyoza", description: "Pastéis japoneses de porco e legumes grelhados na chapa.", weight: "6 un.", price: "29.90", category: "entradas", image: "/food2.webp", discount: null },
  { slug: "sunomono", name: "Sunomono", description: "Salada agridoce de pepino com gergelim e kani.", weight: "200 g", price: "22.90", category: "entradas", image: "/plate1.webp", discount: null },
  { slug: "edamame", name: "Edamame", description: "Vagens de soja no vapor com flor de sal.", weight: "150 g", price: "19.90", category: "entradas", image: "/food4.webp", discount: null },

  { slug: "teishoku", name: "Teishoku Japonês", description: "Combinado completo com salmão, teriyaki e tempurá.", weight: "1 porção", price: "149.99", category: "quentes", image: "/plate1.webp", discount: null },
  { slug: "okonomiyaki", name: "Okonomiyaki", description: "A 'pizza japonesa' com repolho, molho e katsuobushi.", weight: "1 un.", price: "54.90", category: "quentes", image: "/plate2.png", discount: null },
  { slug: "yakisoba", name: "Yakisoba de Frango", description: "Macarrão salteado com frango, legumes e molho shoyu.", weight: "400 g", price: "46.90", category: "quentes", image: "/food1.webp", discount: 15 },
  { slug: "tempura-camarao", name: "Tempurá de Camarão", description: "Camarões empanados na massa leve e crocante.", weight: "8 un.", price: "58.90", category: "quentes", image: "/plate4.png", discount: null },

  { slug: "mochi", name: "Mochi (3 un.)", description: "Bolinhos de arroz gelados recheados de sorvete.", weight: "3 un.", price: "26.90", category: "sobremesas", image: "/food3.webp", discount: null },
  { slug: "harumaki-banana", name: "Harumaki de Banana", description: "Rolinho crocante de banana com canela e açúcar.", weight: "4 un.", price: "22.90", category: "sobremesas", image: "/plate2.png", discount: null },
  { slug: "dorayaki", name: "Dorayaki", description: "Panqueca japonesa recheada com doce de feijão azuki.", weight: "1 un.", price: "18.90", category: "sobremesas", image: "/food4.webp", discount: null },

  { slug: "cha-verde", name: "Chá Verde Gelado", description: "Chá verde gelado levemente adoçado, jarra individual.", weight: "500 ml", price: "14.90", category: "bebidas", image: "/food1.webp", discount: null },
  { slug: "ramune", name: "Ramune", description: "Refrigerante japonês clássico de garrafa de gude.", weight: "200 ml", price: "16.90", category: "bebidas", image: "/plate3.png", discount: null },
  { slug: "sake-quente", name: "Saquê Quente", description: "Saquê tradicional servido morno, dose individual.", weight: "180 ml", price: "28.90", category: "bebidas", image: "/plate4.png", discount: 10 },
];

async function main() {
  // upsert por slug: rodar duas vezes atualiza, nao duplica. NUNCA deleteMany
  // nem TRUNCATE aqui — este banco tem dados reais em `coupons` e vai ter em
  // `orders`.
  const idPorSlug = new Map<string, string>();

  for (const c of CATEGORIAS) {
    const salva = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { label: c.label, position: c.position },
      create: { ...c },
    });
    idPorSlug.set(c.slug, salva.id);
  }

  for (const p of PRODUTOS) {
    const categoryId = idPorSlug.get(p.category);
    if (!categoryId) throw new Error(`categoria inexistente: ${p.category}`);

    const dados = {
      name: p.name,
      description: p.description,
      weight: p.weight,
      price: p.price,
      discount: p.discount,
      image: p.image,
      categoryId,
    };

    await prisma.product.upsert({
      where: { slug: p.slug },
      // `available` fica de fora do update de proposito: se o admin esgotou um
      // prato, rodar o seed de novo nao pode ressuscita-lo no cardapio.
      update: dados,
      create: { slug: p.slug, ...dados },
    });
  }

  const [categorias, produtos] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
  ]);
  console.log(`seed ok: ${categorias} categorias, ${produtos} produtos`);
}

main()
  .catch((e) => {
    console.error(e);
    // exitCode em vez de exit(1): process.exit mata o processo antes do
    // .finally() abaixo rodar, entao o disconnect nunca acontecia no caminho
    // de erro — apesar de o codigo parecer que sim.
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
