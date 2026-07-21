import Site from "./(site)/page";

// A config de segmento mora AQUI, e nao em (site)/page.tsx, porque o grupo de
// rotas `(site)` nao cria segmento: quem e a rota `/` e este arquivo. Em
// (site)/page.tsx estes exports seriam silenciosamente ignorados — foi o que
// aconteceu, e a home saiu pre-renderizada com os precos do banco assados no
// build.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main>
      <Site />
    </main>
  );
}
