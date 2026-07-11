export type GalleryImage = {
  /** Caminho do arquivo em public/. Substitua os placeholders por fotos reais. */
  src: string;
  /** Texto alternativo (acessibilidade). */
  alt: string;
  /** Legenda exibida no hover e no lightbox. */
  caption: string;
};

// g1 é a foto-herói (retrato, coluna esquerda do mosaico). As demais preenchem o mosaico.
// Troque os arquivos em public/gallery/g1.webp … g6.webp pelas fotos reais mantendo os nomes.
export const galleryImages: GalleryImage[] = [
  { src: "/gallery/g1.webp", alt: "Fachada do restaurante na Liberdade ao anoitecer", caption: "Fachada na Liberdade" },
  { src: "/gallery/g2.webp", alt: "Salão principal com iluminação quente", caption: "Salão principal" },
  { src: "/gallery/g3.webp", alt: "Chef preparando pratos no balcão de sushi", caption: "Balcão de sushi" },
  { src: "/gallery/g4.webp", alt: "Prato de sashimi finalizado", caption: "Sashimi do dia" },
  { src: "/gallery/g5.webp", alt: "Detalhe do forno robata em brasa", caption: "Forno robata" },
  { src: "/gallery/g6.webp", alt: "Seleção de saquês da casa", caption: "Adega de saquê" },
];
