import { useMarcaLogo } from "@/components/public/MarcaScope";
import { comMarca } from "@/components/public/MarcaScope";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  ArrowRight,
  UtensilsCrossed,
  Cake,
  Heart,
  Search,
  Loader2,
  PartyPopper,
  BookOpen,
  MessageCircle,
  MapPin,
  Phone,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  TIPO_CARDS,
  formatData,
  formatHorario,
  telefoneToWhatsApp,
  type ReservaTipo,
} from "@/lib/reservations";
import { fetchHub } from "@/lib/hub";
import { getTenantBySlug } from "@/lib/tenant";
import { CLICK_RESERVA_EVENT, initFacebookPixel, trackFacebookCustomEvent } from "@/lib/fbpixel";

export const Route = createFileRoute("/$slug/")({
  head: ({ params }) => ({
    meta: [
      { title: `Reservas — ${params.slug}` },
      { name: "description", content: "Reserve sua mesa, aniversário ou evento em poucos toques." },
    ],
  }),
  component: comMarca(TenantHome),
});

const ICONS = {
  mesa: UtensilsCrossed,
  aniversario: Cake,
  evento: PartyPopper,
  casamento: Heart,
} as const;

function TenantHome() {
  const { slug } = useParams({ from: "/$slug/" });
  const logo = useMarcaLogo();
  const tenantQ = useQuery({
    queryKey: ["tenant", slug],
    queryFn: () => getTenantBySlug(slug),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    initFacebookPixel(tenantQ.data?.pixel_facebook_id);
  }, [tenantQ.data?.pixel_facebook_id]);

  const hubQ = useQuery({
    queryKey: ["hub-publico", slug],
    queryFn: () => fetchHub(slug),
    staleTime: 60_000,
  });

  const eventoQ = useQuery({
    queryKey: ["proximo-evento", slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("proximo_evento_do_tenant", { _slug: slug });
      if (error) throw error;
      const first = Array.isArray(data) ? data[0] : null;
      return first ?? null;
    },
    staleTime: 5 * 60_000,
  });

  if (tenantQ.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tenantQ.data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 safe-top safe-bottom">
        <div className="w-full max-w-md text-center animate-in-up">
          <h1 className="font-serif text-4xl tracking-tight">Empresa não encontrada</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Confira o endereço ou volte à página inicial.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md border border-border bg-card px-5 text-sm font-medium hover:bg-accent"
          >
            Ir para Teggly
          </Link>
        </div>
      </main>
    );
  }

  const tenant = tenantQ.data;
  const tiposAceitos = tenant.tipos_aceitos ?? ["mesa", "aniversario", "evento", "casamento"];
  const cards = TIPO_CARDS.filter((c) => tiposAceitos.includes(c.tipo as ReservaTipo));

  return (
    <main className="relative min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 pt-14 pb-10 safe-top safe-bottom sm:pt-20">
        <header className="animate-fade">
          {logo && (
            <img
              src={logo}
              alt={`Logo ${tenant.nome}`}
              className="mb-4 h-14 w-auto object-contain"
            />
          )}
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
            {tenant.nome}
          </p>
          <h1 className="mt-6 font-serif text-[44px] leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            Como podemos te receber?
          </h1>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Escolha o tipo de reserva. Levamos poucos segundos, e nossa equipe confirma com você em
            seguida.
          </p>
        </header>

        {eventoQ.data && (
          <div className="mt-8 overflow-hidden rounded-lg border border-terracotta/25 bg-terracotta/5 animate-in-up">
            {eventoQ.data.imagem_url && (
              <img
                src={eventoQ.data.imagem_url}
                alt={eventoQ.data.titulo}
                className="max-h-72 w-full object-cover"
              />
            )}
            <div className="p-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
                <PartyPopper className="h-3.5 w-3.5" /> Evento em destaque
              </p>
              <p className="mt-2 font-serif font-semibold text-2xl leading-snug text-foreground">
                {eventoQ.data.titulo}
              </p>
              <p className="mt-1 text-sm font-medium text-terracotta">
                {formatData(eventoQ.data.data)}
                {eventoQ.data.horario ? ` às ${formatHorario(eventoQ.data.horario)}` : ""}
              </p>
              {eventoQ.data.descricao && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {eventoQ.data.descricao}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-10 grid gap-3 sm:mt-12">
          {cards.map((card, i) => {
            const Icon = ICONS[card.tipo];
            return (
              <Link
                key={card.tipo}
                to="/$slug/reservar/$tipo"
                params={{ slug, tipo: card.tipo }}
                onClick={() =>
                  trackFacebookCustomEvent(tenant.pixel_facebook_id, CLICK_RESERVA_EVENT[card.tipo])
                }
                className="group relative flex items-center gap-4 rounded-lg border border-border bg-card px-5 py-4 shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:border-terracotta/40 hover:shadow-[var(--shadow-md)] active:scale-[0.99] animate-in-up"
                style={{ animationDelay: `${60 + i * 50}ms` }}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-cream text-terracotta transition-colors group-hover:bg-terracotta group-hover:text-terracotta-foreground">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{card.titulo}</p>
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                    {card.descricao}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-terracotta" />
              </Link>
            );
          })}
        </div>

        <ContatoRapido
          whatsapp={tenant.whatsapp}
          telefone={tenant.telefone_contato}
          endereco={tenant.endereco}
          cardapioHref={hubQ.data?.cardapio_publicado ? `/${slug}/cardapio` : null}
        />

        <div className="mt-8 flex justify-center">
          <Link
            to="/$slug/acompanhar"
            params={{ slug }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card min-h-11 px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Search className="h-3.5 w-3.5" />
            Acompanhar reserva pelo código
          </Link>
        </div>

        <div className="mt-auto flex flex-col items-center gap-1.5 pt-16 text-center">
          <p className="text-xs text-muted-foreground">powered by</p>
          <img
            src="/brand/Teggly_Logo_Primary.svg"
            alt="Teggly"
            width={96}
            height={23}
            className="h-[23px] w-24"
          />
        </div>
      </div>
    </main>
  );
}

/** Atalhos para falar com a casa. Só aparecem os que o restaurante preencheu. */
function ContatoRapido({
  whatsapp,
  telefone,
  endereco,
  cardapioHref,
}: {
  whatsapp?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  cardapioHref?: string | null;
}) {
  const wa = whatsapp ? telefoneToWhatsApp(whatsapp) : "";
  const tel = telefone ? telefone.replace(/[^\d+]/g, "") : "";
  const itens = [
    cardapioHref && { href: cardapioHref, rotulo: "Cardápio", Icone: BookOpen, externo: false },
    wa && { href: `https://wa.me/${wa}`, rotulo: "WhatsApp", Icone: MessageCircle, externo: true },
    tel && { href: `tel:${tel}`, rotulo: "Ligar", Icone: Phone, externo: false },
    endereco && {
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`,
      rotulo: "Como chegar",
      Icone: MapPin,
      externo: true,
    },
  ].filter(Boolean) as Array<{
    href: string;
    rotulo: string;
    Icone: typeof Phone;
    externo: boolean;
  }>;
  if (itens.length === 0) return null;
  return (
    <nav aria-label="Falar com a casa" className="mt-8 flex flex-wrap justify-center gap-2">
      {itens.map(({ href, rotulo, Icone, externo }) => (
        <a
          key={rotulo}
          href={href}
          {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Icone className="h-4 w-4 text-muted-foreground" />
          {rotulo}
        </a>
      ))}
    </nav>
  );
}
