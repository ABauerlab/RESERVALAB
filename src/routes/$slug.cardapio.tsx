import { comMarca } from "@/components/public/MarcaScope";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

import { EstadoPublico, PublicShell } from "@/components/public/PublicShell";
import {
  categoriasVisiveis,
  fetchCardapioPublico,
  filtrarCardapio,
  formatPreco,
} from "@/lib/cardapio";
import { cn } from "@/lib/utils";
import { getTenantBySlug } from "@/lib/tenant";

export const Route = createFileRoute("/$slug/cardapio")({
  head: ({ params }) => ({
    meta: [
      { title: `Cardápio | ${params.slug}` },
      { name: "description", content: "Veja o cardápio e reserve sua mesa." },
    ],
  }),
  component: comMarca(CardapioPublicoPage),
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

  const [busca, setBusca] = useState("");
  const [ativa, setAtiva] = useState<string | null>(null);
  const todas = useMemo(() => categoriasVisiveis(cardapioQ.data ?? null), [cardapioQ.data]);
  const visiveis = useMemo(() => filtrarCardapio(todas, busca), [todas, busca]);

  // Destaca a categoria que esta na tela e mantem o chip visivel na barra.
  useEffect(() => {
    if (visiveis.length === 0 || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entradas) => {
        const topo = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (topo) setAtiva(topo.target.id.replace("cat-", ""));
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );
    for (const c of visiveis) {
      const el = document.getElementById(`cat-${c.id}`);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [visiveis]);
  useEffect(() => {
    if (ativa) {
      document
        .getElementById(`chip-${ativa}`)
        ?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }
  }, [ativa]);

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
  const categorias = todas;
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
      <div className="sticky top-0 z-10 -mx-5 mb-6 bg-background/95 px-5 pb-1 pt-3 backdrop-blur">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar no cardápio"
            aria-label="Buscar no cardápio"
            className="h-11 w-full rounded-[10px] border border-input bg-card pl-10 pr-10 text-base focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 md:text-sm"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              aria-label="Limpar busca"
              className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <nav
          aria-label="Categorias"
          className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {visiveis.map((c) => (
            <a
              key={c.id}
              id={`chip-${c.id}`}
              href={`#cat-${c.id}`}
              aria-current={ativa === c.id ? "true" : undefined}
              className={cn(
                "inline-flex h-11 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition-colors",
                ativa === c.id
                  ? "bg-blue-50 text-blue-700"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {c.nome}
            </a>
          ))}
        </nav>
      </div>

      {visiveis.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Nada encontrado para “{busca}”. Tente outro nome.
        </p>
      )}

      <div className="space-y-10">
        {visiveis.map((c) => (
          <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-20">
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">{c.nome}</h2>
            {c.descricao && <p className="mt-1 text-sm text-muted-foreground">{c.descricao}</p>}
            <ul className="mt-4 divide-y divide-border/70 rounded-lg border border-border bg-card">
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
                        <p className="mt-2 text-sm font-semibold tabular-nums text-foreground">
                          {preco}
                        </p>
                      )}
                    </div>
                    {i.imagem_url && (
                      <img
                        src={i.imagem_url}
                        alt={i.nome}
                        loading="lazy"
                        decoding="async"
                        width={80}
                        height={80}
                        referrerPolicy="no-referrer"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                        className="h-20 w-20 shrink-0 rounded-xl border border-border/60 bg-slate-100 object-cover"
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
