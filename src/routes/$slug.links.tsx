import { comMarca } from "@/components/public/MarcaScope";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  CalendarCheck,
  ExternalLink,
  Instagram,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

import { EstadoPublico, PublicShell } from "@/components/public/PublicShell";
import { buildHubItens, fetchHub, type HubItem } from "@/lib/hub";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/$slug/links")({
  head: ({ params }) => ({
    meta: [
      { title: `Links | ${params.slug}` },
      { name: "description", content: "Reserve sua mesa, veja o cardápio e fale com a casa." },
    ],
  }),
  component: comMarca(HubPublicoPage),
});

const ICONES: Record<HubItem["tipo"], typeof Phone> = {
  reserva: CalendarCheck,
  cardapio: BookOpen,
  whatsapp: MessageCircle,
  instagram: Instagram,
  localizacao: MapPin,
  telefone: Phone,
  extra: ExternalLink,
};

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

  const itens = buildHubItens(hubQ.data, slug);

  return (
    <PublicShell nome={hubQ.data.nome}>
      <ul className="space-y-3">
        {itens.map((item) => {
          const Icone = ICONES[item.tipo];
          return (
            <li key={item.id}>
              <a
                href={item.href}
                {...(item.interno ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                className={cn(
                  "flex w-full items-center justify-center gap-2.5 rounded-xl px-5 text-[15px] font-semibold transition-colors",
                  item.destaque
                    ? "h-14 bg-primary text-primary-foreground shadow-sm hover:bg-blue-700"
                    : "h-12 border border-border bg-card text-foreground hover:bg-accent",
                )}
              >
                <Icone className="h-[18px] w-[18px]" aria-hidden="true" />
                {item.rotulo}
              </a>
            </li>
          );
        })}
      </ul>
    </PublicShell>
  );
}
