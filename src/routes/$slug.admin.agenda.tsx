import { pwaHeadLinks } from "@/lib/pwa-manifest";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarX2, ChevronLeft, ChevronRight, Loader2, SlidersHorizontal } from "lucide-react";

import { formatData, type Reserva } from "@/lib/reservations";
import { todayISO, weekdayLabel } from "@/lib/admin-dates";
import { parseDiaParam } from "@/lib/agenda";
import { cn } from "@/lib/utils";
import { useTenantAdmin } from "@/hooks/use-tenant-admin";
import { useAgenda, useAgendaDeleteRealtime } from "@/hooks/use-agenda";
import { useReservaActions, useReservasRealtime } from "@/hooks/use-reservas-admin";
import { useDetailMode, useMediaQuery } from "@/hooks/use-media-query";

import { AdminShell } from "@/components/admin/AdminShell";
import { BottomSheet } from "@/components/admin/BottomSheet";
import { PageHeader } from "@/components/admin/PageHeader";
import { ReservaDetail } from "@/components/admin/ReservaDetail";
import { useRowAction } from "@/components/admin/RowAction";
import { AgendaGestao } from "@/components/admin/agenda/AgendaGestao";
import { AgendaTimeline } from "@/components/admin/agenda/AgendaTimeline";
import { DayContext } from "@/components/admin/agenda/DayContext";
import { WeekStrip } from "@/components/admin/agenda/WeekStrip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { AgendaEstado } from "@/components/admin/agenda/AgendaEstado";

export const Route = createFileRoute("/$slug/admin/agenda")({
  head: ({ params }) => ({
    meta: [{ title: "Agenda | Teggly" }, { name: "robots", content: "noindex" }],
    links: pwaHeadLinks(`/${params.slug}/admin`, "Admin"),
  }),
  // `?dia=YYYY-MM-DD`: dia selecionado da Agenda. Inválido ou ausente = hoje.
  validateSearch: (search: Record<string, unknown>): { dia?: string } => {
    const dia = parseDiaParam(search.dia);
    return dia ? { dia } : {};
  },
  ssr: false,
  component: AgendaPage,
});

function FilterToggle({
  active,
  onChange,
  count,
  children,
}: {
  active: boolean;
  onChange: (v: boolean) => void;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onChange(!active)}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition-colors xl:h-9",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "rounded-full px-1.5 text-[11px] tabular-nums",
            active ? "bg-primary-foreground/20" : "bg-card text-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function AgendaPage() {
  const { slug } = useParams({ from: "/$slug/admin/agenda" });
  const admin = useTenantAdmin(slug);
  const ready = admin.ready;
  const tenantId = admin.tenant?.id ?? null;

  const dock = useDetailMode() === "dock";
  const [selected, setSelected] = useState<Reserva | null>(null);
  const [gestaoOpen, setGestaoOpen] = useState(false);
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  // Abaixo de 1024 (trilho de ícones) e com o detalhe acoplado, a faixa da semana abrevia.
  const wide = useMediaQuery("(min-width: 1024px)");

  // Realtime: o hook existente da F1 (invalida o prefixo ["reservas", tenantId]).
  useReservasRealtime(ready, tenantId);
  useAgendaDeleteRealtime(ready, tenantId, (id) =>
    setSelected((s) => (s && s.id === id ? null : s)),
  );
  const actions = useReservaActions(slug, tenantId, {
    onPatched: (id, patch) =>
      setSelected((s) => (s && s.id === id ? ({ ...s, ...patch } as Reserva) : s)),
    onDeleted: () => setSelected(null),
  });
  const renderAction = useRowAction(actions);

  const ag = useAgenda(slug, ready, tenantId);
  const { agendaDia, filtros, selectedDay, range } = ag;

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hoje = todayISO();
  const isToday = selectedDay === hoje;
  const { resumo } = agendaDia;
  const temVisiveis = agendaDia.horas.length > 0 || agendaDia.semHorario.length > 0;
  const frase =
    resumo.reservas === 0
      ? "Nenhuma reserva neste dia"
      : `${resumo.reservas} ${resumo.reservas === 1 ? "reserva" : "reservas"}, ${resumo.pessoas} pessoas, ${resumo.pendentes} ${resumo.pendentes === 1 ? "pendente" : "pendentes"}`;

  const semanaVazia = ag.semana.every((d) => d.reservas === 0);
  const linkReservas = (
    <Link
      to="/$slug/admin/reservas"
      params={{ slug }}
      className="inline-flex h-11 items-center rounded-md border border-border bg-card px-4 text-[13px] font-semibold text-foreground hover:bg-muted xl:h-9"
    >
      Ver em Reservas
    </Link>
  );
  const btnAcao =
    "inline-flex h-11 items-center rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-blue-700 xl:h-9";

  const navBtn =
    "inline-flex h-11 min-w-12 items-center justify-center gap-1 rounded-md border border-border bg-card px-3 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted disabled:text-muted-foreground xl:h-9";

  return (
    <AdminShell slug={slug} tenantNome={admin.tenant?.nome ?? ""} active="agenda">
      <div
        className={cn(
          "mx-auto max-w-[1180px] px-4 pb-6 pt-1 md:px-8 md:pt-8",
          selected && dock && "xl:pr-[452px]",
        )}
      >
        <PageHeader
          title="Agenda"
          description={
            <span className="hidden md:inline">
              Visualize o movimento das reservas ao longo da semana.
            </span>
          }
          actions={
            <Button
              variant="outline"
              onClick={() => setGestaoOpen(true)}
              aria-label="Bloqueios e feriados"
              className="h-11 w-11 gap-2 rounded-md p-0 md:w-auto md:px-4 xl:h-9"
            >
              <CalendarX2 className="h-4 w-4" aria-hidden="true" />
              <span className="hidden md:inline">Bloqueios e feriados</span>
            </Button>
          }
        />

        {/* Mobile: dia a dia, com seletor de data. */}
        <div className="mt-3 flex items-center gap-2 md:hidden">
          <button
            type="button"
            className={cn(navBtn, "w-11 justify-center px-0")}
            onClick={() => ag.shiftDay(-1)}
            aria-label="Dia anterior"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <label className="relative flex h-11 min-w-0 flex-1 items-center justify-center rounded-md border border-border bg-card px-3 text-sm font-semibold text-foreground">
            <span className="truncate">
              <span className="capitalize">{weekdayLabel(selectedDay, true)}</span>,{" "}
              {formatData(selectedDay)}
            </span>
            <input
              type="date"
              value={selectedDay}
              onChange={(e) => {
                const v = parseDiaParam(e.target.value);
                if (v) ag.selectDay(v);
              }}
              aria-label="Ir para a data"
              className="absolute -inset-px h-[calc(100%+2px)] w-[calc(100%+2px)] cursor-pointer opacity-0"
            />
          </label>
          <button
            type="button"
            className={cn(navBtn, "w-11 justify-center px-0")}
            onClick={() => ag.shiftDay(1)}
            aria-label="Próximo dia"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" className={navBtn} onClick={ag.goToday} disabled={isToday}>
            Hoje
          </button>
        </div>

        {/* Tablet e desktop: semana a semana. */}
        <div className="mt-4 hidden flex-wrap items-center gap-2 md:flex">
          <button
            type="button"
            className={navBtn}
            onClick={() => ag.shiftWeek(-1)}
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden lg:inline">Semana anterior</span>
          </button>
          <button type="button" className={navBtn} onClick={ag.goToday} disabled={isToday}>
            Hoje
          </button>
          <button
            type="button"
            className={navBtn}
            onClick={() => ag.shiftWeek(1)}
            aria-label="Próxima semana"
          >
            <span className="hidden lg:inline">Próxima semana</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="ml-1 text-sm text-muted-foreground">
            {formatData(range.weekStart).slice(0, 5)} a {formatData(range.weekEnd)}
          </span>
          <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span className="sr-only xl:not-sr-only">Ir para</span>
            <Input
              type="date"
              value={selectedDay}
              onChange={(e) => {
                const v = parseDiaParam(e.target.value);
                if (v) ag.selectDay(v);
              }}
              aria-label="Ir para a data"
              className="h-11 w-[11.5rem] rounded-md xl:h-9"
            />
          </label>
        </div>

        <div className="mt-4">
          {ag.error ? null : ag.loading ? (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-[96px] rounded-lg" />
              ))}
            </div>
          ) : (
            <WeekStrip
              days={ag.semana}
              onSelect={ag.selectDay}
              compact={!wide || (dock && !!selected)}
            />
          )}
        </div>

        {ag.truncado && (
          <p className="mt-2 text-xs text-muted-foreground">
            Esta semana tem 500 reservas ou mais. Mostramos as 500 primeiras e as contagens podem
            estar incompletas. Veja todas em{" "}
            <Link
              to="/$slug/admin/reservas"
              params={{ slug }}
              className="font-semibold text-primary hover:underline"
            >
              Reservas
            </Link>
            .
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">
              <span className="capitalize">{weekdayLabel(selectedDay)}</span>,{" "}
              {formatData(selectedDay)}
              {isToday && (
                <span className="ml-2 align-middle text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                  Hoje
                </span>
              )}
            </h2>
            {!ag.error && !ag.loading && (
              <p className="mt-0.5 text-sm text-muted-foreground">{frase}</p>
            )}
          </div>
          {/* Tablet e desktop: os dois filtros à vista. */}
          <div className="hidden flex-wrap gap-2 md:flex">
            <FilterToggle
              active={filtros.soAtencao}
              onChange={ag.setSoAtencao}
              count={resumo.atencao}
            >
              Precisa de atenção
            </FilterToggle>
            <FilterToggle
              active={filtros.mostrarCanceladas}
              onChange={ag.setMostrarCanceladas}
              count={resumo.canceladas}
            >
              Mostrar canceladas
            </FilterToggle>
          </div>
          {/* Mobile: atenção à vista; o resto em folha. */}
          <div className="flex w-full items-center gap-2 md:hidden">
            <FilterToggle
              active={filtros.soAtencao}
              onChange={ag.setSoAtencao}
              count={resumo.atencao}
            >
              Precisa de atenção
            </FilterToggle>
            <button
              type="button"
              onClick={() => setFiltrosOpen(true)}
              aria-label="Filtros"
              className={cn(
                "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                filtros.mostrarCanceladas
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-5">
          <DayContext contexto={agendaDia.contexto} slug={slug} />

          {ag.error ? (
            <AgendaEstado
              alert
              titulo="Não foi possível carregar a agenda"
              texto="A conexão pode ter falhado. Suas reservas não foram alteradas. Tente novamente em instantes."
              acoes={
                <Button className="h-11 rounded-md xl:h-9" onClick={ag.refetch}>
                  Tentar novamente
                </Button>
              }
            />
          ) : ag.loading ? (
            <div className="space-y-2" aria-busy="true" aria-label="Carregando a agenda">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[64px] w-full rounded-lg" />
              ))}
            </div>
          ) : !temVisiveis ? (
            filtros.soAtencao && resumo.reservas > 0 ? (
              <AgendaEstado
                titulo="Nada precisa de atenção neste dia"
                texto={`As ${resumo.reservas} ${resumo.reservas === 1 ? "reserva" : "reservas"} deste dia já estão em ordem: nenhuma está pendente, esperando reconfirmação ou dentro de um bloqueio.`}
                acoes={
                  <button type="button" className={btnAcao} onClick={() => ag.setSoAtencao(false)}>
                    Mostrar todas
                  </button>
                }
              />
            ) : !filtros.mostrarCanceladas && resumo.canceladas > 0 && resumo.reservas === 0 ? (
              <AgendaEstado
                titulo="Só há reservas canceladas neste dia"
                texto={`${resumo.canceladas} ${resumo.canceladas === 1 ? "reserva foi cancelada" : "reservas foram canceladas"} e ficam ocultas por padrão. Nenhuma reserva ativa neste dia.`}
                acoes={
                  <button
                    type="button"
                    className={btnAcao}
                    onClick={() => ag.setMostrarCanceladas(true)}
                  >
                    Mostrar canceladas
                  </button>
                }
              />
            ) : semanaVazia ? (
              <AgendaEstado
                titulo="Nenhuma reserva nesta semana"
                texto="Quando uma reserva for feita, ela aparece aqui sem precisar recarregar. Você pode olhar outra semana ou conferir tudo em Reservas."
                acoes={
                  <>
                    <button type="button" className={btnAcao} onClick={() => ag.shiftWeek(1)}>
                      Próxima semana
                    </button>
                    {linkReservas}
                  </>
                }
              />
            ) : (
              <AgendaEstado
                titulo="Nenhuma reserva neste dia"
                texto="Escolha outro dia da semana na faixa acima ou consulte todas as reservas."
                acoes={linkReservas}
              />
            )
          ) : (
            <AgendaTimeline
              dia={agendaDia}
              slug={slug}
              selectedId={selected?.id}
              onOpen={setSelected}
              renderAction={renderAction}
              compact={dock && !!selected}
            />
          )}
        </div>
      </div>

      <BottomSheet open={filtrosOpen} onOpenChange={setFiltrosOpen} title="Filtros">
        <div className="space-y-2 pb-2">
          <FilterToggle
            active={filtros.soAtencao}
            onChange={ag.setSoAtencao}
            count={resumo.atencao}
          >
            Precisa de atenção
          </FilterToggle>
          <FilterToggle
            active={filtros.mostrarCanceladas}
            onChange={ag.setMostrarCanceladas}
            count={resumo.canceladas}
          >
            Mostrar canceladas
          </FilterToggle>
          <p className="pt-1 text-xs text-muted-foreground">
            Tipo, área e busca por nome, telefone ou código ficam em Reservas.
          </p>
        </div>
      </BottomSheet>

      <Dialog open={gestaoOpen} onOpenChange={setGestaoOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="text-left">
            <DialogTitle>Bloqueios e feriados</DialogTitle>
            <DialogDescription>
              Dias ou horários bloqueados não aceitam novas reservas dos clientes. Feriados usam os
              horários de fim de semana.
            </DialogDescription>
          </DialogHeader>
          <AgendaGestao tenantId={tenantId} />
        </DialogContent>
      </Dialog>

      <ReservaDetail
        reserva={selected}
        onClose={() => setSelected(null)}
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
