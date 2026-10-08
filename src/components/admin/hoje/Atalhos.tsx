import { Link } from "@tanstack/react-router";
import { CalendarDays, Link2, Music, UtensilsCrossed } from "lucide-react";

const item =
  "flex min-h-11 items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30";

/** Atalhos para as areas que o restaurante mais mexe. Texto simples, um toque. */
export function Atalhos({ slug }: { slug: string }) {
  return (
    <section aria-label="Atalhos">
      <h2 className="mb-2 text-xs font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
        Atalhos
      </h2>
      <ul className="grid grid-cols-2 gap-2 xl:grid-cols-1">
        <li>
          <Link to="/$slug/admin/agenda" params={{ slug }} className={item}>
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
            Agenda da semana
          </Link>
        </li>
        <li>
          <Link to="/$slug/admin/cardapio" params={{ slug }} className={item}>
            <UtensilsCrossed className="h-4 w-4 text-primary" aria-hidden="true" />
            Cardápio
          </Link>
        </li>
        <li>
          <Link to="/$slug/admin/links" params={{ slug }} className={item}>
            <Link2 className="h-4 w-4 text-primary" aria-hidden="true" />
            Link Hub
          </Link>
        </li>
        <li>
          <Link to="/$slug/admin/eventos" params={{ slug }} className={item}>
            <Music className="h-4 w-4 text-primary" aria-hidden="true" />
            Eventos
          </Link>
        </li>
      </ul>
    </section>
  );
}
