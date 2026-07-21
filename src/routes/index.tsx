import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, UtensilsCrossed, Cake, Sparkles, Heart, Search } from "lucide-react";
import { TIPO_CARDS, type ReservaTipo } from "@/lib/reservations";
import { getDefaultTenant } from "@/lib/tenant";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Iracema — Reservas" },
      { name: "description", content: "Reserve sua mesa, aniversário ou evento em poucos toques." },
    ],
  }),
  component: Home,
});

const ICONS = {
  mesa: UtensilsCrossed,
  aniversario: Cake,
  evento: Sparkles,
  casamento: Heart,
} as const;

function Home() {
  const tenantQ = useQuery({
    queryKey: ["default-tenant"],
    queryFn: getDefaultTenant,
    staleTime: 5 * 60_000,
  });
  const tenant = tenantQ.data;
  const nomeEmpresa = tenant?.nome ?? "";
  const tiposAceitos = tenant?.tipos_aceitos ?? ["mesa", "aniversario", "evento", "casamento"];
  const cards = TIPO_CARDS.filter((c) => tiposAceitos.includes(c.tipo as ReservaTipo));

  return (
    <main className="relative min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 pt-14 pb-10 safe-top safe-bottom sm:pt-20">
        <header className="animate-fade">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-terracotta">
            {nomeEmpresa || "Reservas"}
          </p>
          <h1 className="mt-6 font-serif text-[44px] leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            Como podemos te receber?
          </h1>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Escolha o tipo de reserva. Levamos poucos segundos, e nossa equipe confirma com você em seguida.
          </p>
        </header>

        <div className="mt-10 grid gap-3 sm:mt-12">
          {cards.map((card, i) => {
            const Icon = ICONS[card.tipo];
            return (
              <Link
                key={card.tipo}
                to="/reservar/$tipo"
                params={{ tipo: card.tipo }}
                className="group relative flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:border-terracotta/40 hover:shadow-[var(--shadow-md)] active:scale-[0.99] animate-in-up"
                style={{ animationDelay: `${60 + i * 50}ms` }}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cream text-terracotta transition-colors group-hover:bg-terracotta group-hover:text-terracotta-foreground">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{card.titulo}</p>
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{card.descricao}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-terracotta" />
              </Link>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            to="/acompanhar"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Search className="h-3.5 w-3.5" />
            Acompanhar reserva pelo código
          </Link>
        </div>

        <div className="mt-auto pt-16 text-center">
          <p className="text-xs text-muted-foreground">
            Sem cadastro. Sem esperas.
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
            ReservaLab
          </p>
        </div>
      </div>
    </main>
  );
}
