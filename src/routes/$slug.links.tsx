import { comMarca, useMarcaLogo } from "@/components/public/MarcaScope";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { HubIcone } from "@/components/hub/HubIcone";
import { MapaIncorporado, MapaRecolhivel } from "@/components/hub/HubMapa";
import { EstadoPublico, PublicShell } from "@/components/public/PublicShell";
import { buildHubItens, fetchHub, type HubItem } from "@/lib/hub";
import { iconeUrlSegura } from "@/lib/hub-icons";
import { urlDeMapaValida } from "@/lib/mapa";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/$slug/links")({
  head: ({ params }) => ({
    meta: [
      { title: `Reservas, cardápio e contato | ${params.slug}` },
      { name: "description", content: "Reserve sua mesa, veja o cardápio e fale com a casa." },
      { property: "og:type", content: "website" },
      { property: "og:title", content: `Reservas, cardápio e contato | ${params.slug}` },
      {
        property: "og:description",
        content: "Reserve sua mesa, veja o cardápio e fale com a casa.",
      },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: comMarca(HubPublicoPage),
});

const link =
  "flex w-full items-center rounded-[10px] text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30";

function Atalho({ item }: { item: HubItem }) {
  const externo = item.interno ? {} : { target: "_blank", rel: "noopener noreferrer" };
  return (
    <a
      href={item.href}
      {...externo}
      className={cn(
        link,
        "min-h-12 justify-center gap-2 border border-border bg-card px-2 text-sm text-foreground hover:bg-accent min-[360px]:gap-2.5 min-[360px]:px-3 min-[360px]:text-[15px]",
      )}
    >
      <HubIcone chave={item.icone} iconeUrl={item.iconeUrl} />
      <span className="truncate">{item.rotulo}</span>
    </a>
  );
}

function HubPublicoPage() {
  const { slug } = useParams({ from: "/$slug/links" });
  const logo = useMarcaLogo();
  // Um unico mapa na pagina: ao lado no desktop, recolhido no celular (nunca os dois no DOM).
  const largo = useMediaQuery("(min-width: 768px)");
  const hubQ = useQuery({
    queryKey: ["hub-publico", slug],
    queryFn: () => fetchHub(slug),
    staleTime: 60_000,
  });

  if (hubQ.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background" aria-busy="true">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (hubQ.isError) {
    return (
      <PublicShell nome={slug}>
        <EstadoPublico
          titulo="Não foi possível carregar"
          texto="Tente novamente em instantes."
          acao={
            <button
              type="button"
              onClick={() => hubQ.refetch()}
              className="inline-flex h-11 items-center rounded-lg border border-border bg-background px-5 text-sm font-semibold hover:bg-accent"
            >
              Tentar novamente
            </button>
          }
        />
      </PublicShell>
    );
  }

  if (!hubQ.data) {
    return (
      <PublicShell nome={slug}>
        <EstadoPublico
          titulo="Página indisponível"
          texto="Esta página de links não está publicada."
          acao={
            <a
              href={`/${slug}`}
              className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-blue-700"
            >
              Reservar mesa
            </a>
          }
        />
      </PublicShell>
    );
  }

  const hub = hubQ.data;
  const itens = buildHubItens(hub, slug);
  const banner = iconeUrlSegura(hub.banner_url) ? hub.banner_url : null;
  const mapa = urlDeMapaValida(hub.mapa_url) ? hub.mapa_url : null;
  const selo = hub.selo?.trim() || null;
  const descricao = hub.descricao?.trim() || null;

  const principal = itens.find((i) => i.principal);
  const destaques = itens.filter((i) => !i.principal && i.destaque && i.tipo === "extra");
  const demais = itens.filter((i) => !i.principal && !destaques.includes(i));
  // Numa tela baixa, o item que sobra sozinho na ultima linha ocupa a largura toda.
  const impar = demais.length % 2 === 1;

  return (
    <main className="min-h-dvh bg-background">
      <div
        className={cn(
          "mx-auto flex min-h-dvh w-full flex-col justify-center px-5 py-6 safe-top safe-bottom",
          mapa ? "max-w-[420px] md:max-w-[920px]" : "max-w-[420px]",
        )}
      >
        <div
          className={cn(
            "grid gap-5",
            mapa && "md:grid-cols-[minmax(0,400px)_minmax(0,1fr)] md:items-stretch md:gap-8",
          )}
        >
          <div className="flex flex-col">
            {banner && (
              <img
                src={banner}
                alt=""
                width={1200}
                height={400}
                decoding="async"
                fetchPriority="high"
                className="mb-4 hidden aspect-[3/1] w-full rounded-lg border border-border bg-slate-100 object-cover [@media(min-height:720px)]:block"
              />
            )}
            <header className="text-center">
              {logo && (
                <img
                  src={logo}
                  alt={`Logo ${hub.nome}`}
                  className="mx-auto mb-2 h-12 w-auto max-w-[160px] object-contain"
                />
              )}
              <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
                {hub.nome}
              </h1>
              {selo && (
                <p className="mt-1.5 inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-accent-foreground">
                  {selo}
                </p>
              )}
              {descricao && (
                <p className="mx-auto mt-2 line-clamp-2 max-w-[34ch] text-sm leading-snug text-muted-foreground">
                  {descricao}
                </p>
              )}
            </header>

            <nav aria-label="Ações" className="mt-5 space-y-2.5">
              {principal && (
                <a
                  href={principal.href}
                  className={cn(
                    link,
                    "h-14 justify-center gap-2.5 bg-primary px-5 text-primary-foreground shadow-sm hover:bg-blue-700",
                  )}
                >
                  <HubIcone chave={principal.icone} className="h-[18px] w-[18px]" />
                  {principal.rotulo}
                </a>
              )}
              {destaques.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    link,
                    "min-h-12 gap-3 border border-slate-300 bg-card px-3 text-foreground shadow-sm hover:bg-accent",
                  )}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-slate-50">
                    <HubIcone
                      chave={item.icone}
                      iconeUrl={item.iconeUrl}
                      colorido
                      className="h-5 w-5"
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.rotulo}</span>
                </a>
              ))}
              <ul className="grid grid-cols-2 gap-2.5">
                {demais.map((item, i) => (
                  <li
                    key={item.id}
                    className={cn(impar && i === demais.length - 1 && "col-span-2")}
                  >
                    <Atalho item={item} />
                  </li>
                ))}
              </ul>
              {mapa && !largo && (
                <div>
                  <MapaRecolhivel url={mapa} nome={hub.nome} />
                </div>
              )}
            </nav>

            <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              powered by
              <img
                src="/brand/Teggly_Logo_Primary.svg"
                alt="Teggly"
                width={72}
                height={17}
                className="h-[17px] w-[72px]"
              />
            </p>
          </div>

          {mapa && largo && (
            <div className="min-h-[360px] overflow-hidden rounded-xl border border-border bg-slate-100">
              <MapaIncorporado url={mapa} nome={hub.nome} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
