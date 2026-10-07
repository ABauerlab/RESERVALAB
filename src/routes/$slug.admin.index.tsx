import { pwaHeadLinks } from "@/lib/pwa-manifest";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bell, BellRing, ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";

import { formatData, type Reserva } from "@/lib/reservations";
import { addDaysISO, todayISO, weekdayLabel } from "@/lib/admin-dates";
import { useTenantAdmin } from "@/hooks/use-tenant-admin";
import { useDetailMode } from "@/hooks/use-media-query";
import { useReservaActions, useReservasRealtime } from "@/hooks/use-reservas-admin";
import { useHojeData } from "@/hooks/use-hoje";
import { usePwaActions } from "@/hooks/use-pwa-actions";
import { cn } from "@/lib/utils";

import { AdminShell } from "@/components/admin/AdminShell";
import { BottomSheet } from "@/components/admin/BottomSheet";
import { MensagemDoDiaButton } from "@/components/admin/MensagemDoDia";
import { PageHeader } from "@/components/admin/PageHeader";
import { useRowAction } from "@/components/admin/RowAction";
import { ReservaDetail } from "@/components/admin/ReservaDetail";
import { NeedsYou } from "@/components/admin/hoje/NeedsYou";
import { ServiceLine } from "@/components/admin/hoje/ServiceLine";
import { UpcomingDays, type DayInfo } from "@/components/admin/hoje/UpcomingDays";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/$slug/admin/")({
  head: ({ params }) => ({
    meta: [
      { title: "Hoje | Teggly" },
      { name: "robots", content: "noindex" },
    ],
    links: pwaHeadLinks(`/${params.slug}/admin`, "Admin"),
  }),
  ssr: false,
  component: AdminHoje,
});

function AdminHoje() {
  const { slug } = useParams({ from: "/$slug/admin/" });

  // Guarda única: sessão, vínculo com a empresa e troca de senha obrigatória.
  const admin = useTenantAdmin(slug);
  const ready = admin.ready;
  const tenantId = admin.tenant?.id ?? null;
  const tenantNome = admin.tenant?.nome ?? "";

  const dock = useDetailMode() === "dock";
  const hoje = todayISO();
  const [dia, setDia] = useState(hoje);
  const [selected, setSelected] = useState<Reserva | null>(null);
  const [needsOpen, setNeedsOpen] = useState(false);

  useReservasRealtime(ready, tenantId);
  const pwa = usePwaActions(tenantId);
  const actions = useReservaActions(slug, tenantId, {
    onPatched: (id, patch) => setSelected((s) => (s && s.id === id ? ({ ...s, ...patch } as Reserva) : s)),
    onDeleted: () => setSelected(null),
  });
  const { diaQ, pendentesQ, reconfirmarQ, proximosQ, bloqueiosQ, feriadosQ, eventosQ } = useHojeData(ready, tenantId, dia);

  const reservasDia = useMemo(() => diaQ.data ?? [], [diaQ.data]);
  const resumo = useMemo(() => {
    const ativas = reservasDia.filter((r) => r.status !== "cancelada");
    return {
      reservas: ativas.length,
      pessoas: ativas.reduce((n, r) => n + (r.quantidade ?? 0), 0),
      pendentes: ativas.filter((r) => r.status === "pendente").length,
      canceladas: reservasDia.length - ativas.length,
    };
  }, [reservasDia]);

  const proximos = useMemo(() => {
    const out: Record<string, DayInfo> = {};
    const get = (iso: string) => (out[iso] ??= { reservas: 0, pessoas: 0, bloqueio: false, feriado: false, evento: false });
    for (const r of proximosQ.data ?? []) if (r.data) { const d = get(r.data); d.reservas += 1; d.pessoas += r.quantidade ?? 0; }
    for (const b of bloqueiosQ.data ?? []) if (b.data) get(b.data).bloqueio = true;
    for (const f of feriadosQ.data ?? []) if (f.data) get(f.data).feriado = true;
    for (const e of eventosQ.data ?? []) if (e.data) get(e.data).evento = true;
    return out;
  }, [proximosQ.data, bloqueiosQ.data, feriadosQ.data, eventosQ.data]);

  const pendentes = pendentesQ.data ?? [];
  const reconfirmar = reconfirmarQ.data ?? [];
  const needsTotal = pendentes.length + reconfirmar.length;

  const renderAction = useRowAction(actions);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isToday = dia === hoje;
  const sentence = resumo.reservas === 0
    ? "Nenhuma reserva neste dia"
    : `${resumo.reservas} ${resumo.reservas === 1 ? "reserva" : "reservas"}, ${resumo.pessoas} pessoas, ${resumo.pendentes} ${resumo.pendentes === 1 ? "pendente" : "pendentes"}`;

  const navBtn = "flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-muted xl:h-9 xl:w-9";
  const chip = "inline-flex h-11 items-center gap-2 rounded-full px-3.5 xl:h-9 text-xs font-semibold transition-colors disabled:opacity-50";

  return (
    <AdminShell slug={slug} tenantNome={tenantNome} active="hoje">
      <div className={cn("mx-auto max-w-[1180px] px-4 pb-6 pt-1 md:px-8 md:pt-8", selected && dock && "xl:pr-[452px]")}>
        <PageHeader
          eyebrow={isToday ? "Hoje" : undefined}
          title={<><span className="capitalize">{weekdayLabel(dia)}</span>, {formatData(dia)}</>}
          description={`${isToday ? "Hoje: " : ""}${sentence}`}
          actions={<MensagemDoDiaButton tenantId={tenantId} />}
        />

        <div className="mt-3 flex items-center gap-2">
          <button type="button" className={navBtn} onClick={() => setDia((d) => addDaysISO(d, -1))} aria-label="Dia anterior"><ChevronLeft className="h-4 w-4" /></button>
          <button
            type="button"
            onClick={() => setDia(hoje)}
            disabled={isToday}
            className="h-11 rounded-md border border-border bg-card px-4 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted disabled:text-muted-foreground xl:h-9"
          >
            Hoje
          </button>
          <button type="button" className={navBtn} onClick={() => setDia((d) => addDaysISO(d, 1))} aria-label="Próximo dia"><ChevronRight className="h-4 w-4" /></button>
        </div>

        {needsTotal > 0 && (
          <button
            type="button"
            onClick={() => setNeedsOpen(true)}
            className="mt-3 flex h-11 w-full items-center justify-between rounded-lg border border-warning-500/30 bg-warning-50 px-4 text-left text-[13px] font-semibold text-warning-700 xl:hidden"
          >
            <span>Precisa de você · {pendentes.length} {pendentes.length === 1 ? "pendente" : "pendentes"}{reconfirmar.length > 0 ? `, ${reconfirmar.length} a reconfirmar` : ""}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <div className={cn("mt-4 grid gap-6", selected && dock ? "xl:grid-cols-1" : "xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]")}>
          <section aria-label="Linha do serviço" className="min-w-0">
            <h2 className="mb-2 hidden text-xs font-extrabold uppercase tracking-[0.08em] text-muted-foreground xl:block">Linha do serviço</h2>
            {diaQ.isLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[64px] w-full rounded-lg" />)}</div>
            ) : diaQ.isError ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                Não foi possível carregar as reservas. Tente novamente em instantes.
              </p>
            ) : resumo.reservas === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card/50 px-4 py-12 text-center">
                <p className="text-xl font-extrabold tracking-tight text-foreground">Nenhuma reserva</p>
                <p className="mt-1 text-sm text-muted-foreground">Nada marcado para este dia.</p>
              </div>
            ) : (
              <ServiceLine reservas={reservasDia} dia={dia} selectedId={selected?.id} onOpen={setSelected} renderAction={renderAction} compact={dock && !!selected} />
            )}
            {resumo.canceladas > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">{resumo.canceladas} {resumo.canceladas === 1 ? "cancelada" : "canceladas"} neste dia</p>
            )}
          </section>

          <section aria-label="Precisa de você" className={cn("min-w-0", selected && dock ? "" : "hidden xl:block")}>
            <h2 className="mb-2 hidden text-xs font-extrabold uppercase tracking-[0.08em] text-muted-foreground xl:block">Precisa de você</h2>
            <div className="hidden xl:block">
              <NeedsYou
                tenantId={tenantId}
                pendentes={pendentes}
                reconfirmar={reconfirmar}
                selectedId={selected?.id}
                onOpen={setSelected}
                renderAction={renderAction}
                loading={pendentesQ.isLoading || reconfirmarQ.isLoading}
              />
            </div>
          </section>
        </div>

        <div className="mt-8">
          <UpcomingDays dia={dia} info={proximos} onPick={setDia} />
        </div>

        {(pwa.showPushCTA || pwa.pushActive || pwa.showLegacyNotifCTA || pwa.showInstall) && (
          <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-4">
            {pwa.showPushCTA && (
              <button disabled={pwa.pushBusy} onClick={pwa.handleEnablePush} className={`${chip} border border-primary/25 bg-accent text-accent-foreground hover:bg-muted`}>
                <Bell className="h-3.5 w-3.5" /> {pwa.pushBusy ? "Ativando…" : "Ativar notificações push"}
              </button>
            )}
            {pwa.pushActive && (
              <button disabled={pwa.pushBusy} onClick={pwa.handleDisablePush} className={`${chip} border border-border bg-card text-muted-foreground hover:bg-accent`}>
                <BellRing className="h-3.5 w-3.5 text-primary" /> Push ativo, desativar
              </button>
            )}
            {pwa.showLegacyNotifCTA && (
              <button onClick={pwa.handleEnablePush} className={`${chip} border border-primary/25 bg-accent text-accent-foreground hover:bg-muted`}>
                <Bell className="h-3.5 w-3.5" /> Ativar notificações
              </button>
            )}
            {pwa.showInstall && (
              <button onClick={pwa.handleInstall} className={`${chip} border border-border bg-card text-foreground hover:bg-accent`}>
                <Download className="h-3.5 w-3.5" /> Instalar aplicativo
              </button>
            )}
          </div>
        )}
      </div>

      <BottomSheet open={needsOpen} onOpenChange={setNeedsOpen} title="Precisa de você">
        <NeedsYou
          tenantId={tenantId}
          pendentes={pendentes}
          reconfirmar={reconfirmar}
          onOpen={(r) => { setNeedsOpen(false); setSelected(r); }}
          renderAction={renderAction}
          loading={pendentesQ.isLoading || reconfirmarQ.isLoading}
        />
      </BottomSheet>

      <ReservaDetail
        reserva={selected}
        onClose={() => setSelected(null)}
        onConfirm={() => selected && actions.handleConfirm(selected)}
        onConfirmSemNotificar={() => selected && actions.handleConfirmSemNotificar(selected)}
        onReconfirm={() => selected && actions.handleReconfirm(selected)}
        onSetStatus={(status) => selected && actions.handleSetStatus(selected, status)}
        onSave={(patch) => selected ? actions.updateReserva.mutateAsync({ id: selected.id, patch }) : Promise.resolve()}
        onCancel={(motivo) => selected ? actions.handleCancel(selected, motivo) : Promise.resolve()}
        onDelete={() => selected && actions.handleDelete(selected)}
        pending={actions.pending}
      />
    </AdminShell>
  );
}
