import { pwaHeadLinks } from "@/lib/pwa-manifest";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, BellRing, ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";

import type { Reserva } from "@/lib/reservations";
import { addDaysISO, formatDataLonga, localHHMM, todayISO } from "@/lib/admin-dates";
import { parseDiaParam } from "@/lib/agenda";
import { clientesDeCasa, resumoDoDia, visaoDoNegocio } from "@/lib/dashboard";
import { parseReservaParam } from "@/lib/reservas-busca";
import { useTenantAdmin } from "@/hooks/use-tenant-admin";
import { useDetailMode } from "@/hooks/use-media-query";
import { useReservaActions, useReservasRealtime } from "@/hooks/use-reservas-admin";
import { useNavigateReserva, useReservaUrl } from "@/hooks/use-reserva-url";
import { JANELA_NEGOCIO_DIAS, useHojeData } from "@/hooks/use-hoje";
import { usePlano } from "@/hooks/use-plano";
import { usePwaActions } from "@/hooks/use-pwa-actions";
import { cn } from "@/lib/utils";

import { AdminShell } from "@/components/admin/AdminShell";
import { DateField } from "@/components/admin/DateField";
import { MensagemDoDiaButton } from "@/components/admin/MensagemDoDia";
import { PageHeader } from "@/components/admin/PageHeader";
import { useRowAction } from "@/components/admin/RowAction";
import { ReservaDetail } from "@/components/admin/ReservaDetail";
import { Atalhos } from "@/components/admin/hoje/Atalhos";
import { Atencao } from "@/components/admin/hoje/Atencao";
import { ClientesDeCasa } from "@/components/admin/hoje/ClientesDeCasa";
import { DiaResumo } from "@/components/admin/hoje/DiaResumo";
import { PlanoCard } from "@/components/admin/hoje/PlanoCard";
import { ServiceLine } from "@/components/admin/hoje/ServiceLine";
import { UpcomingDays, type DayInfo } from "@/components/admin/hoje/UpcomingDays";
import { VisaoNegocio } from "@/components/admin/hoje/VisaoNegocio";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardBusca = { dia?: string; reserva?: string };

export const Route = createFileRoute("/$slug/admin/")({
  head: ({ params }) => ({
    meta: [{ title: "Dashboard | Teggly" }, { name: "robots", content: "noindex" }],
    links: pwaHeadLinks(`/${params.slug}/admin`, "Admin"),
  }),
  // `?dia=` e `?reserva=` na URL: atualizar a pagina ou voltar de uma reserva preserva o contexto.
  validateSearch: (search: Record<string, unknown>): DashboardBusca => {
    const dia = parseDiaParam(search.dia);
    const reserva = parseReservaParam(search.reserva);
    return { ...(dia ? { dia } : {}), ...(reserva ? { reserva } : {}) };
  },
  ssr: false,
  component: AdminDashboard,
});

function AdminDashboard() {
  const { slug } = useParams({ from: "/$slug/admin/" });

  // Guarda única: sessão, vínculo com a empresa e troca de senha obrigatória.
  const admin = useTenantAdmin(slug);
  const ready = admin.ready;
  const tenantId = admin.tenant?.id ?? null;
  const tenantNome = admin.tenant?.nome ?? "";

  const dock = useDetailMode() === "dock";
  const hoje = todayISO();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const dia = search.dia ?? hoje;
  const setDia = (iso: string) =>
    navigate({
      to: "/$slug/admin",
      params: { slug },
      search: ((prev: DashboardBusca) => ({
        ...prev,
        dia: iso === hoje ? undefined : iso,
      })) as never,
      replace: true,
    });

  useReservasRealtime(ready, tenantId);
  const pwa = usePwaActions(tenantId);
  const navegarReserva = useNavigateReserva("/$slug/admin", slug);
  const actions = useReservaActions(slug, tenantId, {
    onDeleted: () => navegarReserva(undefined, true),
  });
  const {
    diaQ,
    historicoQ,
    pendentesQ,
    reconfirmarQ,
    proximosQ,
    bloqueiosQ,
    feriadosQ,
    eventosQ,
    negocioQ,
    inicioJanela,
  } = useHojeData(ready, tenantId, dia);
  const planoInfo = usePlano(ready, tenantId);

  const reservasDia = useMemo(() => diaQ.data ?? [], [diaQ.data]);
  const pendentes = useMemo(() => pendentesQ.data ?? [], [pendentesQ.data]);
  const reconfirmar = useMemo(() => reconfirmarQ.data ?? [], [reconfirmarQ.data]);

  const {
    selecionada: selected,
    abrir,
    fechar,
  } = useReservaUrl({
    tenantId,
    reservaId: search.reserva,
    candidatas: useMemo(
      () => [...reservasDia, ...pendentes, ...reconfirmar],
      [reservasDia, pendentes, reconfirmar],
    ),
    navegar: navegarReserva,
  });

  const resumo = useMemo(
    () => resumoDoDia(reservasDia, dia, hoje, localHHMM()),
    [reservasDia, dia, hoje],
  );
  const deCasa = useMemo(
    () => clientesDeCasa(reservasDia, historicoQ.data ?? [], dia),
    [reservasDia, historicoQ.data, dia],
  );
  const visao = useMemo(
    () =>
      negocioQ.data ? visaoDoNegocio(negocioQ.data, hoje, inicioJanela, JANELA_NEGOCIO_DIAS) : null,
    [negocioQ.data, hoje, inicioJanela],
  );

  const proximos = useMemo(() => {
    const out: Record<string, DayInfo> = {};
    const get = (iso: string) =>
      (out[iso] ??= { reservas: 0, pessoas: 0, bloqueio: false, feriado: false, evento: false });
    for (const r of proximosQ.data ?? [])
      if (r.data) {
        const d = get(r.data);
        d.reservas += 1;
        d.pessoas += r.quantidade ?? 0;
      }
    for (const b of bloqueiosQ.data ?? []) if (b.data) get(b.data).bloqueio = true;
    for (const f of feriadosQ.data ?? []) if (f.data) get(f.data).feriado = true;
    for (const e of eventosQ.data ?? []) if (e.data) get(e.data).evento = true;
    return out;
  }, [proximosQ.data, bloqueiosQ.data, feriadosQ.data, eventosQ.data]);

  const renderAction = useRowAction(actions);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isToday = dia === hoje;
  const sentence =
    resumo.reservas === 0
      ? "Nenhuma reserva neste dia"
      : `${resumo.reservas} ${resumo.reservas === 1 ? "reserva" : "reservas"}, ${resumo.pessoas} ${resumo.pessoas === 1 ? "pessoa" : "pessoas"}`;

  const navBtn =
    "flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-muted xl:h-9 xl:w-9";
  const chip =
    "inline-flex h-11 items-center gap-2 rounded-full px-3.5 xl:h-9 text-xs font-semibold transition-colors disabled:opacity-50";
  return (
    <AdminShell slug={slug} tenantNome={tenantNome} active="hoje">
      <div
        className={cn(
          "mx-auto max-w-[1180px] px-4 pb-6 pt-1 md:px-8 md:pt-8",
          selected && dock && "xl:pr-[452px]",
        )}
      >
        <PageHeader
          eyebrow={isToday ? "Dashboard · hoje" : "Dashboard"}
          title={formatDataLonga(dia)}
          description={sentence}
          actions={<MensagemDoDiaButton tenantId={tenantId} />}
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={navBtn}
            onClick={() => setDia(addDaysISO(dia, -1))}
            aria-label="Dia anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDia(hoje)}
            disabled={isToday}
            className="h-11 rounded-md border border-border bg-card px-4 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted disabled:text-muted-foreground xl:h-9"
          >
            Hoje
          </button>
          <button
            type="button"
            className={navBtn}
            onClick={() => setDia(addDaysISO(dia, 1))}
            aria-label="Próximo dia"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <DateField value={isToday ? null : dia} onChange={setDia} placeholder="Outro dia" />
        </div>

        <div className="mt-5">
          <Atencao
            slug={slug}
            tenantId={tenantId}
            pendentes={pendentes}
            reconfirmar={reconfirmar}
            loading={pendentesQ.isLoading || reconfirmarQ.isLoading}
            selectedId={selected?.id}
            onOpen={abrir}
            renderAction={renderAction}
          />
        </div>

        <div
          className={cn(
            "mt-6 grid gap-6",
            selected && dock ? "xl:grid-cols-1" : "xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]",
          )}
        >
          <section aria-label="Linha do serviço" className="min-w-0 space-y-4">
            <DiaResumo
              slug={slug}
              dia={dia}
              reservas={resumo.reservas}
              pessoas={resumo.pessoas}
              proxima={resumo.proxima}
              isToday={isToday}
              onAbrirProxima={abrir}
            />
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
                  {isToday ? "Hoje, hora a hora" : "O dia, hora a hora"}
                </h2>
                <Link
                  to="/$slug/admin/agenda"
                  params={{ slug }}
                  search={{ dia }}
                  className="inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:underline xl:min-h-0"
                >
                  Ver na Agenda
                </Link>
              </div>
              {diaQ.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-[64px] w-full rounded-lg" />
                  ))}
                </div>
              ) : diaQ.isError ? (
                <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                  Não foi possível carregar as reservas. Tente novamente em instantes.
                </p>
              ) : resumo.reservas === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-card/50 px-4 py-10 text-center">
                  <p className="text-xl font-extrabold tracking-tight text-foreground">
                    Nenhuma reserva
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">Nada marcado para este dia.</p>
                </div>
              ) : (
                <ServiceLine
                  reservas={reservasDia}
                  dia={dia}
                  selectedId={selected?.id}
                  onOpen={abrir}
                  renderAction={renderAction}
                  compact={dock && !!selected}
                />
              )}
              {resumo.canceladas > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {resumo.canceladas} {resumo.canceladas === 1 ? "cancelada" : "canceladas"} neste
                  dia
                </p>
              )}
            </div>
            <ClientesDeCasa slug={slug} itens={deCasa} onOpen={(c) => abrir(c.reserva)} />
          </section>

          <div className="min-w-0 space-y-6">
            <UpcomingDays dia={dia} info={proximos} onPick={setDia} lista />
            <Atalhos slug={slug} />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <VisaoNegocio slug={slug} visao={visao} loading={negocioQ.isLoading} />
          {planoInfo.explicito && !planoInfo.loading && (
            <PlanoCard slug={slug} plano={planoInfo.plano} uso={planoInfo.uso} />
          )}
        </div>

        {(pwa.showPushCTA || pwa.pushActive || pwa.showLegacyNotifCTA || pwa.showInstall) && (
          <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-4">
            {pwa.showPushCTA && (
              <button
                disabled={pwa.pushBusy}
                onClick={pwa.handleEnablePush}
                className={`${chip} border border-primary/25 bg-accent text-accent-foreground hover:bg-muted`}
              >
                <Bell className="h-3.5 w-3.5" />{" "}
                {pwa.pushBusy ? "Ativando…" : "Ativar notificações push"}
              </button>
            )}
            {pwa.pushActive && (
              <button
                disabled={pwa.pushBusy}
                onClick={pwa.handleDisablePush}
                className={`${chip} border border-border bg-card text-muted-foreground hover:bg-accent`}
              >
                <BellRing className="h-3.5 w-3.5 text-primary" /> Push ativo, desativar
              </button>
            )}
            {pwa.showLegacyNotifCTA && (
              <button
                onClick={pwa.handleEnablePush}
                className={`${chip} border border-primary/25 bg-accent text-accent-foreground hover:bg-muted`}
              >
                <Bell className="h-3.5 w-3.5" /> Ativar notificações
              </button>
            )}
            {pwa.showInstall && (
              <button
                onClick={pwa.handleInstall}
                className={`${chip} border border-border bg-card text-foreground hover:bg-accent`}
              >
                <Download className="h-3.5 w-3.5" /> Instalar aplicativo
              </button>
            )}
          </div>
        )}
      </div>

      <ReservaDetail
        reserva={selected}
        onClose={fechar}
        onConfirm={() => selected && actions.handleConfirm(selected)}
        onConfirmSemNotificar={() => selected && actions.handleConfirmSemNotificar(selected)}
        onReconfirm={() => selected && actions.handleReconfirm(selected)}
        onSetStatus={(status) => selected && actions.handleSetStatus(selected, status)}
        onSave={(patch) =>
          selected
            ? actions.updateReserva.mutateAsync({ id: selected.id, patch })
            : Promise.resolve()
        }
        onCancel={(motivo) =>
          selected ? actions.handleCancel(selected, motivo) : Promise.resolve()
        }
        onDelete={() => selected && actions.handleDelete(selected)}
        pending={actions.pending}
      />
    </AdminShell>
  );
}
