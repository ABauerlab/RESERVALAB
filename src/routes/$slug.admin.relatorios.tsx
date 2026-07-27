import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useTenantAdmin } from "@/hooks/use-tenant-admin";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  STATUS_LABEL, STATUS_LIST, TIPO_SHORT,
  type Reserva, type ReservaStatus, type ReservaTipo,
} from "@/lib/reservations";

export const Route = createFileRoute("/$slug/admin/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — ReservaLab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  component: RelatoriosPage,
});

const TIPOS: ReservaTipo[] = ["mesa", "aniversario", "evento", "casamento"];

function RelatoriosPage() {
  const { slug } = useParams({ from: "/$slug/admin/relatorios" });
  const admin = useTenantAdmin(slug);
  const tenantId = admin.tenant?.id ?? null;

  const reservasQ = useQuery({
    enabled: !!tenantId,
    queryKey: ["relatorios", tenantId],
    queryFn: async () => {
      const desde = new Date();
      desde.setDate(desde.getDate() - 90);
      const { data, error } = await supabase
        .from("reservas")
        .select("*")
        .eq("tenant_id", tenantId!)
        .gte("created_at", desde.toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Reserva[];
    },
  });

  const resumo = useMemo(() => {
    const rs = reservasQ.data ?? [];
    const porStatus = Object.fromEntries(STATUS_LIST.map((s) => [s, 0])) as Record<ReservaStatus, number>;
    const porTipo = Object.fromEntries(TIPOS.map((t) => [t, 0])) as Record<ReservaTipo, number>;
    let pessoas = 0;
    for (const r of rs) {
      porStatus[r.status] += 1;
      porTipo[r.tipo] += 1;
      if (r.status === "confirmada" || r.status === "finalizada") pessoas += r.quantidade ?? 0;
    }
    const total = rs.length;
    const taxa = total > 0 ? Math.round(((porStatus.confirmada + porStatus.finalizada) / total) * 100) : 0;
    return { total, porStatus, porTipo, pessoas, taxa };
  }, [reservasQ.data]);

  if (!admin.ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const maxTipo = Math.max(1, ...TIPOS.map((t) => resumo.porTipo[t]));

  return (
    <AdminShell slug={slug} tenantNome={admin.tenant?.nome ?? ""} active="relatorios">
      <div className="mx-auto max-w-4xl px-5 pt-6">
        <header className="animate-fade">
          <h2 className="font-serif text-3xl tracking-tight">Relatórios</h2>
          <p className="mt-1 text-sm text-muted-foreground">Últimos 90 dias de solicitações.</p>
        </header>

        {reservasQ.isLoading ? (
          <div className="mt-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 animate-in-up sm:grid-cols-4">
              <Metric label="Solicitações" value={resumo.total} />
              <Metric label="Confirmadas" value={resumo.porStatus.confirmada + resumo.porStatus.finalizada} />
              <Metric label="Pessoas atendidas" value={resumo.pessoas} />
              <Metric label="Taxa de confirmação" value={`${resumo.taxa}%`} />
            </div>

            <section className="mt-8 rounded-2xl border border-border bg-card p-5">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Por tipo</h3>
              <ul className="mt-4 space-y-3">
                {TIPOS.map((t) => (
                  <li key={t}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span>{TIPO_SHORT[t]}</span>
                      <span className="tabular-nums text-muted-foreground">{resumo.porTipo[t]}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-terracotta transition-all" style={{ width: `${(resumo.porTipo[t] / maxTipo) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-4 rounded-2xl border border-border bg-card p-5">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Por status</h3>
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {STATUS_LIST.map((s) => (
                  <li key={s} className="rounded-xl bg-muted/50 p-3">
                    <p className="text-2xl font-medium tabular-nums">{resumo.porStatus[s]}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{STATUS_LABEL[s]}</p>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </AdminShell>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="font-serif text-3xl tabular-nums">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
