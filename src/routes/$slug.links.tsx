import { comMarca } from "@/components/public/MarcaScope";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { HubIcone } from "@/components/hub/HubIcone";
import { EstadoPublico, PublicShell } from "@/components/public/PublicShell";
import { buildHubItens, fetchHub } from "@/lib/hub";
import { iconeUrlSegura } from "@/lib/hub-icons";

export const Route = createFileRoute("/$slug/links")({
  head: ({ params }) => ({
    meta: [
      { title: `Links | ${params.slug}` },
      { name: "description", content: "Reserve sua mesa, veja o cardápio e fale com a casa." },
    ],
  }),
  component: comMarca(HubPublicoPage),
});

function HubPublicoPage() {
  const { slug } = useParams({ from: "/$slug/links" });
  const hubQ = useQuery({
    queryKey: ["hub-publico", slug],
    queryFn: () => fetchHub(slug),
    staleTime: 60_000,
  });

  if (hubQ.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" aria-busy="true">
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

  return (
    <PublicShell
      nome={hub.nome}
      subtitulo={hub.descricao?.trim() || undefined}
      capa={
        banner && (
          <img
            src={banner}
            alt=""
            width={1200}
            height={400}
            decoding="async"
            className="aspect-[3/1] w-full rounded-lg border border-border bg-slate-100 object-cover"
          />
        )
      }
    >
      <ul className="space-y-3">
        {itens.map((item) => {
          const externo = item.interno ? {} : { target: "_blank", rel: "noopener noreferrer" };
          if (item.principal) {
            return (
              <li key={item.id}>
                <a
                  href={item.href}
                  className="flex h-14 w-full items-center justify-center gap-2.5 rounded-[10px] bg-primary px-5 text-[15px] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-blue-700"
                >
                  <HubIcone chave={item.icone} className="h-[18px] w-[18px]" />
                  {item.rotulo}
                </a>
              </li>
            );
          }
          if (item.destaque) {
            return (
              <li key={item.id}>
                <a
                  href={item.href}
                  {...externo}
                  className="flex h-16 w-full items-center gap-3.5 rounded-lg border border-slate-300 bg-card px-4 text-[15px] font-semibold text-foreground shadow-sm transition-colors hover:bg-accent"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-50">
                    <HubIcone
                      chave={item.icone}
                      iconeUrl={item.iconeUrl}
                      colorido
                      className="h-6 w-6"
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.rotulo}</span>
                </a>
              </li>
            );
          }
          return (
            <li key={item.id}>
              <a
                href={item.href}
                {...externo}
                className="flex h-12 w-full items-center justify-center gap-2.5 rounded-[10px] border border-border bg-card px-5 text-[15px] font-semibold text-foreground transition-colors hover:bg-accent"
              >
                <HubIcone chave={item.icone} iconeUrl={item.iconeUrl} />
                {item.rotulo}
              </a>
            </li>
          );
        })}
      </ul>
    </PublicShell>
  );
}
