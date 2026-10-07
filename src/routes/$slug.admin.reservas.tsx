import { pwaHeadLinks } from "@/lib/pwa-manifest";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  AREA_LABEL,
  TIPO_SHORT,
  formatData,
  type Reserva,
  type ReservaArea,
  type ReservaTipo,
} from "@/lib/reservations";
import {
  endOfMonthISO,
  endOfWeekISO,
  todayISO,
  tomorrowISO,
  weekdayLabel,
} from "@/lib/admin-dates";
import { useTenantAdmin } from "@/hooks/use-tenant-admin";
import { useReservaActions, useReservasRealtime } from "@/hooks/use-reservas-admin";
import { useDetailMode, useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

import { AdminShell } from "@/components/admin/AdminShell";
import { BottomSheet } from "@/components/admin/BottomSheet";
import { PageHeader } from "@/components/admin/PageHeader";
import { ReservaDetail } from "@/components/admin/ReservaDetail";
import { ReservationRow } from "@/components/admin/ReservationRow";
import { useRowAction } from "@/components/admin/RowAction";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/$slug/admin/reservas")({
  head: ({ params }) => ({
    meta: [{ title: "Reservas | Teggly" }, { name: "robots", content: "noindex" }],
    links: pwaHeadLinks(`/${params.slug}/admin`, "Admin"),
  }),
  ssr: false,
  component: AdminReservas,
});

type FiltroData = "hoje" | "amanha" | "semana" | "mes" | "todos";
const FILTROS_DATA: Array<{ id: FiltroData; label: string }> = [
  { id: "hoje", label: "Hoje" },
  { id: "amanha", label: "Amanhã" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" },
  { id: "todos", label: "Todos" },
];

// Status: Todas, Pendentes, Confirmadas e Encerradas (canceladas + finalizadas).
// Dentro de "Encerradas" os filtros antigos "Canceladas" e "Finalizadas" continuam acessíveis.
type FiltroStatus = "todos" | "pendente" | "confirmada" | "encerradas";
const FILTROS_STATUS: Array<{ id: FiltroStatus; label: string }> = [
  { id: "todos", label: "Todas" },
  { id: "pendente", label: "Pendentes" },
  { id: "confirmada", label: "Confirmadas" },
  { id: "encerradas", label: "Encerradas" },
];
type EncerradaSub = "ambas" | "cancelada" | "finalizada";

const TIPOS: ReservaTipo[] = ["mesa", "aniversario", "evento", "casamento"];
const AREAS: ReservaArea[] = ["salao", "fundos", "corredor", "varanda", "sem_preferencia"];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-11 shrink-0 rounded-full px-3 text-[13px] font-semibold transition-colors xl:h-9 xl:px-4",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function AdminReservas() {
  const { slug } = useParams({ from: "/$slug/admin/reservas" });
  const admin = useTenantAdmin(slug);
  const ready = admin.ready;
  const tenantId = admin.tenant?.id ?? null;
  const tenantNome = admin.tenant?.nome ?? "";
  const desktop = useMediaQuery("(min-width: 768px)");
  const dock = useDetailMode() === "dock";

  const [filtroData, setFiltroData] = useState<FiltroData>("semana");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [encerradaSub, setEncerradaSub] = useState<EncerradaSub>("ambas");
  const [filtroTipo, setFiltroTipo] = useState<ReservaTipo | "todos">("todos");
  const [filtroArea, setFiltroArea] = useState<ReservaArea | "todas">("todas");
  const [busca, setBusca] = useState("");
  const [mostrarFinalizadas, setMostrarFinalizadas] = useState(false);
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [selected, setSelected] = useState<Reserva | null>(null);

  useReservasRealtime(ready, tenantId);
  const actions = useReservaActions(slug, tenantId, {
    onPatched: (id, patch) =>
      setSelected((s) => (s && s.id === id ? ({ ...s, ...patch } as Reserva) : s)),
    onDeleted: () => setSelected(null),
  });
  const renderAction = useRowAction(actions);

  // Filtros de data/busca/tipo/área compartilhados entre a lista e a contagem de finalizadas.
  function aplicarFiltrosBase<T>(q: T): T {
    let out = q as never as {
      eq: (c: string, v: string) => unknown;
      gte: (c: string, v: string) => unknown;
      lte: (c: string, v: string) => unknown;
      or: (f: string) => unknown;
    };
    if (filtroData === "hoje") out = out.eq("data", todayISO()) as typeof out;
    else if (filtroData === "amanha") out = out.eq("data", tomorrowISO()) as typeof out;
    else if (filtroData === "semana")
      out = (out.gte("data", todayISO()) as typeof out).lte("data", endOfWeekISO()) as typeof out;
    else if (filtroData === "mes")
      out = (out.gte("data", todayISO()) as typeof out).lte("data", endOfMonthISO()) as typeof out;

    if (filtroTipo !== "todos") out = out.eq("tipo", filtroTipo) as typeof out;
    if (filtroArea !== "todas") out = out.eq("area", filtroArea) as typeof out;

    const term = busca.trim();
    if (term)
      out = out.or(
        `nome.ilike.%${term}%,telefone.ilike.%${term}%,codigo_acompanhamento.ilike.%${term.toUpperCase()}%`,
      ) as typeof out;
    return out as never as T;
  }

  const listaQ = useQuery({
    enabled: ready && !!tenantId,
    queryKey: [
      "reservas",
      tenantId,
      "lista",
      filtroData,
      filtroStatus,
      encerradaSub,
      filtroTipo,
      filtroArea,
      busca,
      mostrarFinalizadas,
    ],
    queryFn: async () => {
      let q = supabase
        .from("reservas")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("data", { ascending: true, nullsFirst: false })
        .order("horario", { ascending: true })
        .order("created_at", { ascending: false });

      q = aplicarFiltrosBase(q);

      if (filtroStatus === "pendente" || filtroStatus === "confirmada")
        q = q.eq("status", filtroStatus);
      else if (filtroStatus === "encerradas") {
        q =
          encerradaSub === "ambas"
            ? q.in("status", ["cancelada", "finalizada"])
            : q.eq("status", encerradaSub);
      }
      // Finalizadas ficam escondidas por padrão para não poluir a lista atual.
      else if (!mostrarFinalizadas) q = q.neq("status", "finalizada");

      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data as Reserva[];
    },
  });

  const finalizadasCountQ = useQuery({
    enabled: ready && !!tenantId && filtroStatus === "todos" && !mostrarFinalizadas,
    queryKey: ["reservas-finalizadas-count", tenantId, filtroData, filtroTipo, filtroArea, busca],
    queryFn: async () => {
      let q = supabase
        .from("reservas")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId!)
        .eq("status", "finalizada");
      q = aplicarFiltrosBase(q);
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Agrupa por dia (a lista já vem ordenada por data e horário).
  const dias = useMemo(() => {
    const out: Array<{ data: string | null; items: Reserva[] }> = [];
    for (const r of listaQ.data ?? []) {
      const last = out[out.length - 1];
      if (last && last.data === r.data) last.items.push(r);
      else out.push({ data: r.data, items: [r] });
    }
    return out;
  }, [listaQ.data]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filtrosAtivos =
    (filtroTipo !== "todos" ? 1 : 0) +
    (filtroArea !== "todas" ? 1 : 0) +
    (filtroData !== "semana" ? 1 : 0);
  const total = listaQ.data?.length ?? 0;

  const filtrosBody = (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
          Período
        </p>
        <div className="flex flex-wrap gap-1.5">
          {FILTROS_DATA.map((f) => (
            <Chip key={f.id} active={filtroData === f.id} onClick={() => setFiltroData(f.id)}>
              {f.label}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
          Tipo
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Chip active={filtroTipo === "todos"} onClick={() => setFiltroTipo("todos")}>
            Todos
          </Chip>
          {TIPOS.map((t) => (
            <Chip key={t} active={filtroTipo === t} onClick={() => setFiltroTipo(t)}>
              {TIPO_SHORT[t]}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
          Área
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Chip active={filtroArea === "todas"} onClick={() => setFiltroArea("todas")}>
            Todas
          </Chip>
          {AREAS.map((a) => (
            <Chip key={a} active={filtroArea === a} onClick={() => setFiltroArea(a)}>
              {AREA_LABEL[a]}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <AdminShell slug={slug} tenantNome={tenantNome} active="reservas">
      <div
        className={cn(
          "mx-auto max-w-[1180px] px-4 pb-6 pt-1 md:px-8 md:pt-8",
          selected && dock && "xl:pr-[452px]",
        )}
      >
        <PageHeader
          title="Reservas"
          description={
            listaQ.isLoading
              ? "Carregando…"
              : `${total}${total === 200 ? "+" : ""} ${total === 1 ? "reserva" : "reservas"} neste filtro`
          }
        />

        <div className="mt-3 flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome, telefone ou código…"
              aria-label="Buscar reserva"
              className="h-11 rounded-md pl-10 pr-10"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca("")}
                aria-label="Limpar busca"
                className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFiltrosOpen((o) => !o)}
            aria-expanded={filtrosOpen}
            aria-label="Filtros"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md border border-border bg-card px-3.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted "
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
            {filtrosAtivos > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground">
                {filtrosAtivos}
              </span>
            )}
          </button>
        </div>

        <div className="mt-3">
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 scrollbar-none md:mx-0 md:px-0">
            {FILTROS_STATUS.map((f) => (
              <Chip
                key={f.id}
                active={filtroStatus === f.id}
                onClick={() => {
                  setFiltroStatus(f.id);
                  setEncerradaSub("ambas");
                }}
              >
                {f.label}
              </Chip>
            ))}
          </div>
        </div>

        {filtroStatus === "encerradas" && (
          <div className="mt-2 flex gap-1.5">
            <Chip active={encerradaSub === "ambas"} onClick={() => setEncerradaSub("ambas")}>
              Todas
            </Chip>
            <Chip
              active={encerradaSub === "cancelada"}
              onClick={() => setEncerradaSub("cancelada")}
            >
              Canceladas
            </Chip>
            <Chip
              active={encerradaSub === "finalizada"}
              onClick={() => setEncerradaSub("finalizada")}
            >
              Finalizadas
            </Chip>
          </div>
        )}

        {desktop && filtrosOpen && (
          <div className="mt-3 rounded-lg border border-border bg-card p-4 shadow-xs animate-fade">
            {filtrosBody}
          </div>
        )}

        <div className="mt-5">
          {listaQ.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[64px] w-full rounded-lg" />
              ))}
            </div>
          ) : listaQ.isError ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Não foi possível carregar as reservas. Tente novamente em instantes.
            </p>
          ) : dias.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card/50 px-4 py-12 text-center">
              <p className="text-xl font-extrabold tracking-tight text-foreground">
                Nenhuma reserva
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Nada por aqui neste filtro.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dias.map((d) => {
                const pessoas = d.items.reduce((n, r) => n + (r.quantidade ?? 0), 0);
                return (
                  <section key={d.data ?? "sem-data"}>
                    <h2 className="mb-1.5 flex items-baseline justify-between text-xs font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
                      <span>
                        {d.data ? (
                          <>
                            <span className="capitalize">{weekdayLabel(d.data)}</span> ·{" "}
                            {formatData(d.data)}
                          </>
                        ) : (
                          "Sem data"
                        )}
                      </span>
                      <span className="font-semibold normal-case tracking-normal">
                        {d.items.length} {d.items.length === 1 ? "reserva" : "reservas"} · {pessoas}{" "}
                        pessoas
                      </span>
                    </h2>
                    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
                      {d.items.map((r) => (
                        <ReservationRow
                          key={r.id}
                          reserva={r}
                          selected={selected?.id === r.id}
                          compact={dock && !!selected}
                          onOpen={() => setSelected(r)}
                          action={renderAction(r)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {filtroStatus === "todos" && !mostrarFinalizadas && (finalizadasCountQ.data ?? 0) > 0 && (
            <button
              onClick={() => setMostrarFinalizadas(true)}
              className="mt-4 h-11 w-full rounded-lg border border-dashed border-border bg-card/60 px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Ver mais {finalizadasCountQ.data} finalizada{finalizadasCountQ.data === 1 ? "" : "s"}
            </button>
          )}
          {filtroStatus === "todos" && mostrarFinalizadas && (
            <button
              onClick={() => setMostrarFinalizadas(false)}
              className="mt-4 h-11 w-full rounded-lg border border-dashed border-border bg-card/60 px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Ocultar finalizadas
            </button>
          )}
        </div>
      </div>

      {!desktop && (
        <BottomSheet open={filtrosOpen} onOpenChange={setFiltrosOpen} title="Filtros">
          {filtrosBody}
        </BottomSheet>
      )}

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
