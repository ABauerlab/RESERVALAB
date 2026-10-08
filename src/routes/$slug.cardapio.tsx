import { comMarca } from "@/components/public/MarcaScope";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, Search, X } from "lucide-react";

import { ItemDetalhe } from "@/components/cardapio/ItemDetalhe";
import { Foto, ItemDoCardapio, SeloDestaque } from "@/components/cardapio/ItemCardapio";
import { ehLayout, layoutEfetivo, type LayoutCardapio } from "@/lib/cardapio-layout";

import { EstadoPublico, PublicShell } from "@/components/public/PublicShell";
import {
  categoriasVisiveis,
  fetchCardapioPrevia,
  fetchCardapioPublico,
  filtrarCardapio,
  formatPreco,
  type ItemCardapio,
} from "@/lib/cardapio";
import { fetchOgRestaurante, montarOg } from "@/lib/og";
import { cn } from "@/lib/utils";
import { getTenantBySlug } from "@/lib/tenant";

export const Route = createFileRoute("/$slug/cardapio")({
  loader: ({ params }) => fetchOgRestaurante(params.slug),
  head: ({ params, loaderData }) => {
    const og = montarOg(params.slug, "cardapio", loaderData ?? null);
    return {
      meta: loaderData
        ? og.meta
        : [
            { title: `Cardápio | ${params.slug}` },
            { name: "description", content: "Veja o cardápio e reserve sua mesa." },
            ...og.meta,
          ],
      links: og.links,
    };
  },
  // `item` (prato aberto) e `de` (de onde veio) moram na URL: o voltar do navegador fecha o prato
  // e leva de volta ao Link Hub. `previa` e `layout` so valem para o admin.
  validateSearch: (search: Record<string, unknown>): CardapioBusca => {
    const out: CardapioBusca = {};
    if (search.previa !== undefined && search.previa !== false) out.previa = true;
    if (search.de === "links") out.de = "links";
    if (typeof search.item === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(search.item))
      out.item = search.item;
    if (ehLayout(search.layout)) out.layout = search.layout;
    return out;
  },
  component: comMarca(CardapioPublicoPage),
});

type CardapioBusca = { previa?: boolean; de?: "links"; item?: string; layout?: LayoutCardapio };

/** Grade de cada layout. */
const GRADE: Record<LayoutCardapio, string> = {
  lista: "mt-4 divide-y divide-border/70 overflow-hidden rounded-xl border border-border bg-card",
  compacto:
    "mt-3 divide-y divide-border/70 overflow-hidden rounded-xl border border-border bg-card",
  cards: "mt-4 grid grid-cols-2 gap-3 md:grid-cols-3",
  galeria: "mt-4 grid grid-cols-1 gap-4",
};

function CardapioPublicoPage() {
  const { slug } = useParams({ from: "/$slug/cardapio" });
  const search = Route.useSearch();
  const navigate = useNavigate();
  const previa = search.previa === true;
  const abertoPelaPessoa = useRef(false);
  const tenantQ = useQuery({
    queryKey: ["tenant", slug],
    queryFn: () => getTenantBySlug(slug),
    staleTime: 5 * 60_000,
  });
  const cardapioQ = useQuery({
    queryKey: ["cardapio-publico", slug, previa],
    queryFn: async () => {
      if (!previa) return fetchCardapioPublico(slug);
      const t = await getTenantBySlug(slug);
      return t ? fetchCardapioPrevia(t.id, t.nome) : null;
    },
    staleTime: previa ? 0 : 60_000,
  });

  const [busca, setBusca] = useState("");
  const [ativa, setAtiva] = useState<string | null>(null);
  // A previa e so do admin: nunca deve ser indexada.
  useEffect(() => {
    if (!previa) return;
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [previa]);

  const todas = useMemo(() => categoriasVisiveis(cardapioQ.data ?? null), [cardapioQ.data]);
  const visiveis = useMemo(() => filtrarCardapio(todas, busca), [todas, busca]);
  // No modo previa o admin pode testar um layout pela URL sem salvar.
  const layout: LayoutCardapio =
    previa && search.layout ? search.layout : layoutEfetivo(cardapioQ.data?.layout, todas);
  const destaques = useMemo(() => todas.flatMap((c) => c.itens.filter((i) => i.destaque)), [todas]);
  const aberto = useMemo(() => {
    if (!search.item) return null;
    for (const c of todas) {
      const i = c.itens.find((x) => x.id === search.item);
      if (i) return { item: i, categoria: c.nome };
    }
    return null;
  }, [todas, search.item]);

  const abrirItem = useCallback(
    (id: string) => {
      abertoPelaPessoa.current = true;
      navigate({
        to: "/$slug/cardapio",
        params: { slug },
        search: ((prev: CardapioBusca) => ({ ...prev, item: id })) as never,
        resetScroll: false,
      });
    },
    [navigate, slug],
  );
  const fecharItem = useCallback(() => {
    if (abertoPelaPessoa.current && window.history.length > 1) {
      abertoPelaPessoa.current = false;
      window.history.back();
    } else {
      navigate({
        to: "/$slug/cardapio",
        params: { slug },
        search: ((prev: CardapioBusca) => ({ ...prev, item: undefined })) as never,
        replace: true,
        resetScroll: false,
      });
    }
  }, [navigate, slug]);

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

  const voltar =
    search.de === "links" ? (
      <a
        href={`/${slug}/links`}
        className="-mb-4 inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar para os links
      </a>
    ) : undefined;

  const cartao = (i: ItemCardapio, n: number) => (
    <ItemDoCardapio key={i.id} item={i} layout={layout} indice={n} onAbrir={abrirItem} />
  );

  return (
    <PublicShell nome={nome} subtitulo="Cardápio" capa={voltar} className="max-w-3xl pb-28">
      {previa && (
        <p className="mb-4 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          Pré-visualização para você. O cliente só vê o cardápio depois de publicado.
        </p>
      )}
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

      {!busca && destaques.length > 0 && (
        <section aria-label="Destaques da casa" className="mb-8">
          <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-foreground">
            Destaques da casa
          </h2>
          <ul className="-mx-5 mt-3 flex snap-x gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {destaques.map((i, n) => (
              <li key={i.id} className="w-[200px] shrink-0 snap-start">
                <button
                  type="button"
                  onClick={() => abrirItem(i.id)}
                  aria-label={`Ver ${i.nome}`}
                  className="block h-full w-full overflow-hidden rounded-xl border border-border bg-card text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
                >
                  {i.imagem_url && (
                    <Foto src={i.imagem_url} alt="" prioridade={n < 2} proporcao="4 / 3" />
                  )}
                  <span className="block p-3">
                    {!i.imagem_url && (
                      <span className="mb-1.5 block">
                        <SeloDestaque />
                      </span>
                    )}
                    <span className="block break-words text-[15px] font-semibold leading-snug">
                      {i.nome}
                    </span>
                    {i.descricao && (
                      <span className="mt-1 line-clamp-2 block text-[13px] leading-snug text-muted-foreground">
                        {i.descricao}
                      </span>
                    )}
                    {formatPreco(i.preco_centavos) && (
                      <span className="mt-1 block text-sm font-bold tabular-nums">
                        {formatPreco(i.preco_centavos)}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="space-y-10">
        {visiveis.map((c, ci) => (
          <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-28">
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">{c.nome}</h2>
            {c.descricao && <p className="mt-1 text-sm text-muted-foreground">{c.descricao}</p>}
            <ul className={GRADE[layout]}>
              {c.itens.map((i, n) => (
                <li key={i.id} className={layout === "cards" ? "min-w-0" : undefined}>
                  {cartao(i, ci === 0 ? n : 99)}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <ItemDetalhe
        item={aberto?.item ?? null}
        categoria={aberto?.categoria}
        onFechar={fecharItem}
      />

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
