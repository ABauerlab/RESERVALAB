import { Link } from "@tanstack/react-router";

import { formatHorario } from "@/lib/reservations";
import type { ClienteDeCasa } from "@/lib/dashboard";

/** Quem chega hoje e já voltou outras vezes: um cuidado a mais no salão, e o caminho para Clientes. */
export function ClientesDeCasa({
  slug,
  itens,
  onOpen,
}: {
  slug: string;
  itens: ClienteDeCasa[];
  onOpen: (c: ClienteDeCasa) => void;
}) {
  if (itens.length === 0) return null;
  return (
    <section aria-label="Clientes de casa" className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
          Clientes de casa
        </h2>
        <Link
          to="/$slug/admin/contatos"
          params={{ slug }}
          className="inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:underline xl:min-h-0"
        >
          Ver clientes
        </Link>
      </div>
      <ul className="divide-y divide-border/70 overflow-hidden rounded-lg border border-border bg-card">
        {itens.map((c) => (
          <li key={c.reserva.id}>
            <button
              type="button"
              onClick={() => onOpen(c)}
              className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
            >
              <span className="w-12 text-sm font-semibold tabular-nums">
                {formatHorario(c.reserva.horario)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{c.reserva.nome}</span>
                <span className="block text-xs text-muted-foreground">
                  {c.anteriores} reservas antes · {c.reserva.quantidade}{" "}
                  {c.reserva.quantidade === 1 ? "pessoa" : "pessoas"}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
