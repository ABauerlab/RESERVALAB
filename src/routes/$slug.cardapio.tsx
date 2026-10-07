import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { EstadoPublico, PublicShell } from "@/components/public/PublicShell";
import { categoriasVisiveis, fetchCardapioPublico, formatPreco } from "@/lib/cardapio";
import { getTenantBySlug } from "@/lib/tenant";

export const Route = createFileRoute("/$slug/cardapio")({
  head: ({ params }) => ({
    meta: [
      { title: `Cardápio | ${params.slug}` },
      { name: "description", content: "Veja o cardápio e reserve sua mesa." },
    ],
  }),
  component: CardapioPublicoPage,
});

function CardapioPublicoPage() {
  const { slug } = useParams({ from: "/$slug/cardapio" });
  const cardapioQ = useQuery({
    queryKey: ["cardapio-publico", slug],
    queryFn: () => fetchCardapioPublico(slug),
    staleTime: 60_000,
  });
  const tenantQ = useQuery({
    queryKey: ["tenant", slug],
    queryFn: () => getTenantBySlug(slug),
    staleTime: 5 * 60_000,
  });

  if (cardapioQ.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" aria-busy="true">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tenant = tenantQ.data;
  const aceitaMesa = (tenant?.tipos_aceitos ?? ["mesa"]).includes("mesa");
  const reservarHref = aceitaMesa ? `/${slug}/reservar/mesa` : `/${slug}`;
  const cardapio = cardapioQ.data;
  const categorias = categoriasVisiveis(cardapio ?? null);
  const nome = cardapio?.nome ?? tenant?.nome ?? slug;

  const reservar = (
    <a
      href={reservarHref}
      className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-blue-700"
    >
      Reservar mesa
    </a>
  );

  if (cardapioQ.isError) {
    return (
      <PublicShell nome={nome}>
        <EstadoPublico
          titulo="Não foi possível carregar o cardápio"
          texto="Tente novamente em instantes."
          acao={
            <button
              type="button"
              onClick={() => cardapioQ.refetch()}
              className="inline-flex h-11 items-center rounded-lg border border-border bg-background px-5 text-sm font-semibold hover:bg-accent"
            >
              Tentar novamente
            </button>
          }
        />
      </PublicShell>
    );
  }

  if (!cardapio || categorias.length === 0) {
    return (
      <PublicShell nome={nome}>
        <EstadoPublico
          titulo="Cardápio indisponível por enquanto"
          texto="Este restaurante ainda não publicou o cardápio. Você já pode reservar sua mesa."
          acao={reservar}
        />
      </PublicShell>
    );
  }

  return (
    <PublicShell nome={nome} subtitulo="Cardápio" className="pb-28">
      <nav
        aria-label="Categorias"
        className="sticky top-0 z-10 -mx-5 mb-6 flex gap-2 overflow-x-auto bg-background/95 px-5 py-3 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {categorias.map((c) => (
          <a
            key={c.id}
            href={`#cat-${c.id}`}
            className="inline-flex h-11 shrink-0 items-center rounded-full bg-muted px-4 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {c.nome}
          </a>
        ))}
      </nav>

      <div className="space-y-10">
        {categorias.map((c) => (
          <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-20">
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">{c.nome}</h2>
            {c.descricao && <p className="mt-1 text-sm text-muted-foreground">{c.descricao}</p>}
            <ul className="mt-4 divide-y divide-border/70 rounded-2xl border border-border bg-card">
              {c.itens.map((i) => {
                const preco = formatPreco(i.preco_centavos);
                return (
                  <li key={i.id} className="flex gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-semibold text-foreground">{i.nome}</p>
                      {i.descricao && (
                        <p className="mt-1 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                          {i.descricao}
                        </p>
                      )}
                      {preco && (
                        <p className="mt-2 text-sm font-bold tabular-nums text-foreground">
                          {preco}
                        </p>
                      )}
                    </div>
                    {i.imagem_url && (
                      <img
                        src={i.imagem_url}
                        alt={i.nome}
                        loading="lazy"
                        className="h-20 w-20 shrink-0 rounded-xl object-cover"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-5 py-3 backdrop-blur safe-bottom">
        <div className="mx-auto max-w-xl">
          <a
            href={reservarHref}
            className="flex h-12 w-full items-center justify-center rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground hover:bg-blue-700"
          >
            Reservar mesa
          </a>
        </div>
      </div>
    </PublicShell>
  );
}
