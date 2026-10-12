import { createFileRoute, Link } from "@tanstack/react-router";

import { PlanosSection } from "@/components/landing/PlanosSection";
import { PLANOS, ORDEM_PLANOS } from "@/lib/plans";
import { EMAIL_CONTATO, SITE_URL, WHATSAPP_TEGGLY } from "@/lib/site";

const DESCRICAO =
  "Planos do Teggly: cardápio digital e Link Hub em todos os planos. Compare Gratuito, Essencial e Pro e escolha o que cabe na sua casa.";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos e preços · Teggly" },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: "Planos e preços · Teggly" },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/planos` },
      { property: "og:image", content: `${SITE_URL}/og-image.png` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/planos` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Teggly",
          applicationCategory: "BusinessApplication",
          offers: ORDEM_PLANOS.map((id) => ({
            "@type": "Offer",
            name: PLANOS[id].nome,
            price: (PLANOS[id].mensalCentavos / 100).toFixed(2),
            priceCurrency: "BRL",
          })),
        }),
      },
    ],
  }),
  component: PaginaPlanos,
});

function PaginaPlanos() {
  return (
    <div className="min-h-screen bg-white text-foreground">
      <header className="border-b border-border/70 bg-background/90">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-5">
          <Link to="/" className="flex min-h-11 items-center" aria-label="Teggly, página inicial">
            <img
              src="/brand/Teggly_Logo_Primary.svg"
              alt="Teggly"
              width={118}
              height={28}
              className="h-7 w-auto"
            />
          </Link>
          <Link
            to="/"
            className="ml-auto flex min-h-11 items-center text-sm font-medium text-slate-700 hover:text-foreground"
          >
            Conhecer o produto
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-5 py-14 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-700">Planos</p>
        <h1 className="mt-3 max-w-2xl text-[2.25rem] font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-5xl">
          Escolha o plano que cabe na sua casa.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Cardápio digital e Link Hub em todos os planos. Sem fidelidade e sem taxa por reserva.
        </p>
        <PlanosSection />
        <p className="mt-8 text-sm text-slate-600">
          Dúvidas antes de escolher? Fale pelo{" "}
          <a
            href={WHATSAPP_TEGGLY}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-700 underline"
          >
            WhatsApp
          </a>{" "}
          ou por{" "}
          <a href={`mailto:${EMAIL_CONTATO}`} className="font-semibold text-blue-700 underline">
            e-mail
          </a>
          .
        </p>
      </main>
    </div>
  );
}
