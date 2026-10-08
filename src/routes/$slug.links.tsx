import { comMarca, useMarcaLogo } from "@/components/public/MarcaScope";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Loader2, MapPin } from "lucide-react";

import { HubIcone } from "@/components/hub/HubIcone";
import { HubBotao } from "@/components/hub/HubBotao";
import { MapaIncorporado, MapaRecolhivel } from "@/components/hub/HubMapa";
import { EstadoPublico, PublicShell } from "@/components/public/PublicShell";
import { buildHubItens, fetchHub, type HubItem } from "@/lib/hub";
import { iconeUrlSegura } from "@/lib/hub-icons";
import { carregarOg, montarOg } from "@/lib/og";
import { fetchProximoEvento } from "@/lib/eventos";
import { urlDeMapaValida } from "@/lib/mapa";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { TegglyLogo } from "@/components/brand/TegglyLogo";

export const Route = createFileRoute("/$slug/links")({
  loader: ({ params, context }) => carregarOg(params.slug, context.queryClient),
  head: ({ params, loaderData }) => {
    const og = montarOg(params.slug, "links", loaderData ?? null);
    return {
      meta: loaderData
        ? og.meta
        : [
            { title: `Reservas, cardápio e contato | ${params.slug}` },
            {
              name: "description",
              content: "Reserve sua mesa, veja o cardápio e fale com a casa.",
            },
            ...og.meta,
          ],
      links: og.links,
    };
  },
  component: comMarca(HubPublicoPage),
});

const DELIVERY = new Set(["ifood", "99food", "delivery"]);

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2026-07-12" -> { dia: "12", mes: "jul" }. Sem converter fuso: so le o texto da data. */
function partesData(iso: string) {
  const [, m, d] = iso.split("-");
  const mes = MESES[Number(m) - 1];
  return { dia: d ?? "", mes: mes ?? "" };
}

function horaCurta(h?: string | null) {
  if (!h) return null;
  const [hh, mm] = h.split(":");
  return mm && mm !== "00" ? `${Number(hh)}h${mm}` : `${Number(hh)}h`;
}

function HubPublicoPage() {
  const { slug } = useParams({ from: "/$slug/links" });
  const logo = useMarcaLogo();
  // Um unico mapa na pagina: ao lado no desktop, recolhido no celular (nunca os dois no DOM).
  const largo = useMediaQuery("(min-width: 768px)");
  // O banner so cabe em telas altas; em telas baixas nem baixa a imagem.
  const alto = useMediaQuery("(min-height: 720px)");
  const hubQ = useQuery({
    queryKey: ["hub-publico", slug],
    queryFn: () => fetchHub(slug),
    staleTime: 60_000,
  });

  const eventoQ = useQuery({
    queryKey: ["proximo-evento", slug],
    queryFn: () => fetchProximoEvento(slug),
    staleTime: 5 * 60_000,
    retry: false,
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
  const banner = alto && iconeUrlSegura(hub.banner_url) ? hub.banner_url : null;
  const mapa = urlDeMapaValida(hub.mapa_url) ? hub.mapa_url : null;
  const evento = eventoQ.data
    ? { ...partesData(eventoQ.data.data), hora: horaCurta(eventoQ.data.horario) }
    : null;
  const endereco = hub.endereco?.trim() || null;
  const descricao = hub.descricao?.trim() || null;

  const principal = itens.find((i) => i.principal);
  // Delivery tem prioridade entre os destaques (so a ordem muda, nunca o destino).
  const ehDelivery = (i: HubItem) => DELIVERY.has(i.icone);
  const destaques = itens
    .filter((i) => !i.principal && i.destaque && i.tipo === "extra")
    .sort((a, b) => Number(ehDelivery(b)) - Number(ehDelivery(a)));
  const demais = itens.filter((i) => !i.principal && !destaques.includes(i));
  // Numa tela baixa, o item que sobra sozinho na ultima linha ocupa a largura toda.
  const impar = demais.length % 2 === 1;

  return (
    <main className="min-h-dvh bg-pagina">
      <div
        className={cn(
          "mx-auto flex min-h-dvh w-full flex-col justify-center px-5 py-6 safe-top safe-bottom [@media(max-height:600px)]:py-3",
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
                className="mb-4 aspect-[3/1] w-full rounded-lg border border-border bg-slate-100 object-cover"
              />
            )}
            <header className="text-center">
              {logo && (
                <img
                  src={logo}
                  alt={`Logo ${hub.nome}`}
                  className="mx-auto mb-2 h-12 w-auto max-w-[160px] object-contain [@media(max-height:600px)]:mb-1 [@media(max-height:600px)]:h-8"
                />
              )}
              <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
                {hub.nome}
              </h1>
              {descricao && (
                <p className="mx-auto mt-2 line-clamp-2 max-w-[34ch] [@media(max-height:600px)]:hidden text-sm leading-snug text-muted-foreground">
                  {descricao}
                </p>
              )}
              {endereco && (
                <p className="mx-auto mt-1.5 flex max-w-[36ch] items-start justify-center gap-1 text-xs leading-snug text-muted-foreground">
                  <MapPin aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                  <span>{endereco}</span>
                </p>
              )}
            </header>

            <nav aria-label="Ações" className="mt-5 space-y-2.5">
              {principal && (
                <HubBotao href={principal.href} variante="principal" indice={0}>
                  <HubIcone chave={principal.icone} className="h-[18px] w-[18px]" />
                  {principal.rotulo}
                </HubBotao>
              )}
              {evento && (
                <HubBotao href={`/${slug}`} variante="evento" indice={1}>
                  <span
                    aria-hidden="true"
                    className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary leading-none text-white shadow-sm"
                  >
                    <span className="text-lg font-extrabold tabular-nums">{evento.dia}</span>
                    <span className="-mt-1 text-[10px] font-bold uppercase tracking-wider text-blue-100">
                      {evento.mes}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] tracking-[0.1em] text-primary-foreground">
                        Evento
                      </span>
                      {evento.hora && <span className="text-muted-foreground">{evento.hora}</span>}
                    </span>
                    <span className="mt-0.5 block truncate text-[15px] font-bold leading-tight">
                      {eventoQ.data?.titulo}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-bold text-primary">
                    Ver
                    <ChevronRight
                      aria-hidden="true"
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </HubBotao>
              )}
              {destaques.map((item, i) => {
                const delivery = ehDelivery(item);
                return (
                  <HubBotao
                    key={item.id}
                    href={item.href}
                    externo
                    indice={2 + i}
                    variante={delivery ? "delivery" : "destaque"}
                  >
                    <span
                      className={cn(
                        "grid shrink-0 place-items-center rounded-md bg-white shadow-xs ring-1 ring-slate-200",
                        delivery ? "size-9" : "size-8",
                      )}
                    >
                      <HubIcone
                        chave={item.icone}
                        iconeUrl={item.iconeUrl}
                        colorido
                        className="h-5 w-5"
                      />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{item.rotulo}</span>
                    {delivery && (
                      <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-primary-foreground">
                        Delivery
                      </span>
                    )}
                  </HubBotao>
                );
              })}
              <ul className="grid grid-cols-2 gap-2.5">
                {demais.map((item, i) => (
                  <li
                    key={item.id}
                    className={cn(impar && i === demais.length - 1 && "col-span-2")}
                  >
                    <HubBotao
                      href={item.href}
                      externo={!item.interno}
                      indice={2 + destaques.length + i}
                    >
                      <HubIcone chave={item.icone} iconeUrl={item.iconeUrl} />
                      <span className="truncate">{item.rotulo}</span>
                    </HubBotao>
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
              <TegglyLogo width={72} height={17} className="h-[17px] w-[72px]" />
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
