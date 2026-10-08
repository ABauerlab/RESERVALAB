import { pwaHeadLinks } from "@/lib/pwa-manifest";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useTenantAdmin } from "@/hooks/use-tenant-admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader } from "@/components/admin/PageHeader";
import { addDaysISO, todayISO } from "@/lib/datetime";
import { TIPOS_RELATORIO, buildRelatorio } from "@/lib/relatorios";
import { STATUS_LABEL, STATUS_LIST, TIPO_SHORT, type Reserva } from "@/lib/reservations";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/$slug/admin/relatorios")({
  head: ({ params }) => ({
    meta: [{ title: "Relatórios | Teggly" }, { name: "robots", content: "noindex" }],
    links: pwaHeadLinks(`/${params.slug}/admin`, "Admin"),
  }),
  ssr: false,
  component: RelatoriosPage,
});

const LIMITE = 5000;
const PERIODOS = [30, 90, 180] as const;
const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function RelatoriosPage() {
  const { slug } = useParams({ from: "/$slug/admin/relatorios" });
  const admin = useTenantAdmin(slug);
  const tenantId = admin.tenant?.id ?? null;
  const [dias, setDias] = useState<(typeof PERIODOS)[number]>(90);

  const reservasQ = useQuery({
    enabled: !!tenantId,
    queryKey: ["relatorios", tenantId, dias],
    queryFn: async () => {
      // Início do dia em Brasília (UTC-3, sem horário de verão) há `dias` dias.
      const desde = new Date(`${addDaysISO(todayISO(), -dias)}T00:00:00-03:00`).toISOString();
      const { data, error } = await supabase
        .from("reservas")
        .select("*")
        .eq("tenant_id", tenantId!)
        .gte("created_at", desde)
        .order("created_at", { ascending: false })
        .limit(LIMITE);
      if (error) throw error;
      return data as Reserva[];
    },
  });

  const rel = useMemo(() => buildRelatorio(reservasQ.data ?? []), [reservasQ.data]);

  if (!admin.ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const truncado = (reservasQ.data?.length ?? 0) >= LIMITE;
  const confirmadas = rel.porStatus.confirmada + rel.porStatus.finalizada;
  const maxTipo = Math.max(1, ...TIPOS_RELATORIO.map((t) => rel.porTipo[t]));
  const maxDia = Math.max(1, ...rel.porDiaSemana);
  const maxHora = Math.max(1, ...rel.porHora.map((h) => h.reservas));

  return (
    <AdminShell slug={slug} tenantNome={admin.tenant?.nome ?? ""} active="relatorios">
      <div className="mx-auto max-w-4xl px-5 pb-10 pt-6">
        <PageHeader
          title="Relatórios"
          description={`Solicitações recebidas nos últimos ${dias} dias.`}
        />

        <div className="mt-5 flex flex-wrap gap-1.5" role="group" aria-label="Período">
          {PERIODOS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setDias(p)}
              aria-pressed={dias === p}
              className={cn(
                "h-11 shrink-0 rounded-full px-4 text-xs font-semibold transition-colors xl:h-9",
                dias === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {p} dias
            </button>
          ))}
        </div>

        {reservasQ.isLoading ? (
          <div className="mt-10 flex justify-center" aria-busy="true">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : reservasQ.isError ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-dashed border-border bg-card p-8 text-center"
          >
            <p className="text-lg font-semibold">Não foi possível carregar os relatórios</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Suas reservas não foram alteradas. Tente novamente em instantes.
            </p>
            <button
              type="button"
              onClick={() => reservasQ.refetch()}
              className="mt-4 inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        ) : rel.total === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <p className="text-lg font-semibold">Nenhuma solicitação neste período</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Quando chegarem reservas, os números aparecem aqui. Você pode olhar um período maior.
            </p>
          </div>
        ) : (
          <>
            {truncado && (
              <p className="mt-4 text-xs text-muted-foreground">
                Mostrando as {LIMITE} solicitações mais recentes do período.
              </p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Metric label="Solicitações" value={rel.total} />
              <Metric label="Confirmadas" value={confirmadas} />
              <Metric label="Canceladas" value={rel.porStatus.cancelada} />
              <Metric label="Pessoas atendidas" value={rel.pessoasAtendidas} />
              <Metric label="Taxa de confirmação" value={`${rel.taxaConfirmacao}%`} />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Card titulo="Por tipo">
                <Barras
                  itens={TIPOS_RELATORIO.map((t) => ({
                    rotulo: TIPO_SHORT[t],
                    valor: rel.porTipo[t],
                  }))}
                  max={maxTipo}
                />
              </Card>

              <Card titulo="Por status">
                <ul className="grid grid-cols-2 gap-3">
                  {STATUS_LIST.map((s) => (
                    <li key={s} className="rounded-lg bg-muted/50 p-3">
                      <p className="text-2xl font-extrabold tabular-nums">{rel.porStatus[s]}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{STATUS_LABEL[s]}</p>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card titulo="Dias da semana" nota="Reservas não canceladas, pela data reservada.">
                <Barras
                  itens={DIAS.map((d, i) => ({ rotulo: d, valor: rel.porDiaSemana[i]! }))}
                  max={maxDia}
                />
              </Card>

              <Card titulo="Horários" nota="Reservas não canceladas, por hora cheia.">
                {rel.porHora.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma reserva com horário.</p>
                ) : (
                  <Barras
                    itens={rel.porHora.map((h) => ({
                      rotulo: `${String(h.hora).padStart(2, "0")}h`,
                      valor: h.reservas,
                    }))}
                    max={maxHora}
                  />
                )}
                {rel.semHorario > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {rel.semHorario} {rel.semHorario === 1 ? "reserva" : "reservas"} sem horário.
                  </p>
                )}
              </Card>
            </div>

            {rel.motivos.length > 0 && (
              <div className="mt-4">
                <Card titulo="Motivos de cancelamento" nota="Os mais informados no período.">
                  <ul className="divide-y divide-border/60">
                    {rel.motivos.map((m) => (
                      <li key={m.motivo} className="flex items-baseline justify-between gap-3 py-2">
                        <span className="min-w-0 break-words text-sm">{m.motivo}</span>
                        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                          {m.total}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}

function Card({
  titulo,
  nota,
  children,
}: {
  titulo: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {titulo}
      </h3>
      {nota && <p className="mt-1 text-xs text-muted-foreground">{nota}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Barras({ itens, max }: { itens: Array<{ rotulo: string; valor: number }>; max: number }) {
  return (
    <ul className="space-y-2.5">
      {itens.map((i) => (
        <li key={i.rotulo}>
          <div className="flex items-baseline justify-between text-sm">
            <span>{i.rotulo}</span>
            <span className="tabular-nums text-muted-foreground">{i.valor}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(i.valor / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-3xl font-extrabold tabular-nums">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
    </div>
  );
}
