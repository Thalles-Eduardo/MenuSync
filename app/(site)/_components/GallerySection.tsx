"use client";

import Image from "next/image";
import { galleryImages } from "../_data/gallery";

// Mapeia cada foto (na ordem do array) para uma área do mosaico no desktop.
const AREAS = ["hero", "a", "b", "c", "d", "e"] as const;

export default function GallerySection() {
  return (
    <section
      className="gallery-section relative overflow-hidden px-8 py-24 text-white md:px-12 lg:py-28"
      style={{ backgroundColor: "var(--color-dark-blue)" }}
      aria-label="Galeria do restaurante"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold tracking-[0.25em] text-yellow uppercase">Galeria</p>
        <h2
          className="mt-2 text-4xl font-bold md:text-6xl"
          style={{ fontFamily: "var(--font-eczar), serif" }}
        >
          O ambiente e os pratos
        </h2>

        <div className="gallery-grid mt-12">
          {galleryImages.map((img, i) => (
            <button
              key={img.src}
              type="button"
              aria-label={`Ampliar foto: ${img.caption}`}
              className={`gallery-cell cell-${AREAS[i]} group relative min-h-[240px] cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent md:min-h-0`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-4 opacity-100 transition duration-300 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                <span className="text-sm font-medium text-white drop-shadow">{img.caption}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .gallery-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .gallery-grid {
            grid-template-columns: 1.3fr 1fr 1fr;
            grid-auto-rows: 200px;
            grid-template-areas:
              "hero a a"
              "hero b c"
              "d e e";
          }
          .cell-hero { grid-area: hero; }
          .cell-a { grid-area: a; }
          .cell-b { grid-area: b; }
          .cell-c { grid-area: c; }
          .cell-d { grid-area: d; }
          .cell-e { grid-area: e; }
        }
      `}</style>
    </section>
  );
}
