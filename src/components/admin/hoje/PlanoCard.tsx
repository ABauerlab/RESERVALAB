import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import type { Plano, UsoReservas } from "@/lib/plans";

/** Uso do plano no mes. Informativo: nunca bloqueia reserva. */
export function PlanoCard({ slug, plano, uso }: { slug: string; plano: Plano; uso: UsoReservas }) {
  const tom =
    uso.estado === "excedido"
      ? "bg-warning-500"
      : uso.estado === "perto"
        ? "bg-warning-500"
        : "bg-primary";
  return (
    <section aria-label="Seu plano" className="mt-8 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          Plano {plano.nome}
          <span className="ml-2 font-normal text-muted-foreground">
            {uso.usadas} de {uso.limite} reservas neste mês
          </span>
        </p>
        <Link
          to="/$slug/admin/configuracoes"
          params={{ slug }}
          hash="plano"
          className="inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:underline xl:min-h-0"
        >
          Ver plano
        </Link>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={uso.limite}
        aria-valuenow={Math.min(uso.usadas, uso.limite)}
        aria-label="Reservas do mês"
      >
        <div className={cn("h-full rounded-full", tom)} style={{ width: `${uso.percentual}%` }} />
      </div>
      {uso.estado !== "ok" && (
        <p className="mt-2 text-xs text-warning-700">
          {uso.estado === "excedido"
            ? "Você passou do limite do plano. Nenhuma reserva fica escondida: fale com a gente para ajustar."
            : "Você está perto do limite do plano deste mês."}
        </p>
      )}
    </section>
  );
}
