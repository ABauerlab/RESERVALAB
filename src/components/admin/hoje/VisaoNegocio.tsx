import { Link } from "@tanstack/react-router";

import type { VisaoDoNegocio } from "@/lib/dashboard";

function Item({ valor, rotulo, nota }: { valor: string; rotulo: string; nota?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {rotulo}
      </dt>
      <dd className="mt-1">
        <span className="text-2xl font-extrabold tabular-nums tracking-[-0.03em] text-foreground">
          {valor}
        </span>
        {nota && <span className="ml-1.5 text-xs text-muted-foreground">{nota}</span>}
      </dd>
    </div>
  );
}

/**
 * Visao do negocio dos ultimos 30 dias, so com o que o sistema registra de verdade: reservas,
 * pessoas, cancelamentos e clientes que voltaram. Nada de faturamento ou ocupacao.
 */
export function VisaoNegocio({
  slug,
  visao,
  loading,
}: {
  slug: string;
  visao: VisaoDoNegocio | null;
  loading: boolean;
}) {
  return (
    <section aria-label="Visão do negócio" className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
          Últimos {visao?.janelaDias ?? 30} dias
        </h2>
        <Link
          to="/$slug/admin/relatorios"
          params={{ slug }}
          className="inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:underline xl:min-h-0"
        >
          Ver relatórios
        </Link>
      </div>
      {loading || !visao ? (
        <p className="mt-3 text-sm text-muted-foreground">Calculando…</p>
      ) : visao.reservas === 0 && visao.canceladas === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Ainda não há reservas nos últimos {visao.janelaDias} dias. Compartilhe o link de reservas
          para começar.
        </p>
      ) : (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-4">
          <Item
            valor={String(visao.reservas)}
            rotulo="Reservas"
            nota={`${visao.pessoas} pessoas`}
          />
          <Item
            valor={String(visao.clientes)}
            rotulo="Clientes"
            nota={
              visao.clientesQueVoltaram > 0 ? `${visao.clientesQueVoltaram} voltaram` : undefined
            }
          />
          <Item
            valor={`${visao.taxaCancelamento}%`}
            rotulo="Cancelamentos"
            nota={`${visao.canceladas} ${visao.canceladas === 1 ? "reserva" : "reservas"}`}
          />
          <Item
            valor={
              visao.clientes === 0
                ? "0%"
                : `${Math.round((visao.clientesQueVoltaram / visao.clientes) * 100)}%`
            }
            rotulo="Clientes recorrentes"
          />
        </dl>
      )}
    </section>
  );
}
