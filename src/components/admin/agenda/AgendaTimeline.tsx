import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Users } from "lucide-react";

import type { AgendaDia, AgendaReserva } from "@/lib/agenda";
import type { Reserva } from "@/lib/reservations";
import { ReservationRow } from "@/components/admin/ReservationRow";
import { NowMarker } from "@/components/admin/NowMarker";
import { localHHMM, localISO } from "@/lib/admin-dates";

function Marcador({
  tom,
  icon: Icon,
  children,
}: {
  tom: "aviso" | "neutro" | "forte";
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  const cls =
    tom === "aviso"
      ? "bg-warning-50 text-warning-700"
      : tom === "forte"
        ? "bg-accent text-accent-foreground"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex h-5 items-center gap-1 rounded-full px-2 text-[11px] font-semibold ${cls}`}
    >
      {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Marcadores informativos de uma reserva. Só texto: nada de ocupação ou capacidade. */
function marcadores(item: AgendaReserva) {
  if (!item.dentroBloqueio && !item.grupo) return undefined;
  return (
    <>
      {item.dentroBloqueio && (
        <Marcador tom="aviso" icon={AlertTriangle}>
          Dentro de bloqueio
        </Marcador>
      )}
      {item.grupo && (
        <Marcador tom={item.grupo === "Evento fechado" ? "forte" : "neutro"} icon={Users}>
          {item.grupo}
        </Marcador>
      )}
    </>
  );
}

/**
 * Linha do tempo do dia: reservas por hora cheia, com o horário real de cada uma (sem
 * arredondar). Reservas sem horário ficam numa seção própria, sem horário artificial.
 */
export function AgendaTimeline({
  dia,
  slug,
  selectedId,
  onOpen,
  renderAction,
  compact,
}: {
  dia: AgendaDia;
  slug: string;
  selectedId?: string | null;
  onOpen: (r: Reserva) => void;
  renderAction: (r: Reserva) => React.ReactNode;
  compact?: boolean;
}) {
  const [now, setNow] = useState(() => localHHMM());
  useEffect(() => {
    const t = setInterval(() => setNow(localHHMM()), 60_000);
    return () => clearInterval(t);
  }, []);

  const isToday = dia.dia === localISO();
  let nowPlaced = !isToday;
  const nodes: React.ReactNode[] = [];

  const linha = (item: AgendaReserva) => (
    <ReservationRow
      key={item.reserva.id}
      reserva={item.reserva}
      onOpen={() => onOpen(item.reserva)}
      selected={selectedId === item.reserva.id}
      compact={compact}
      action={renderAction(item.reserva)}
      extra={marcadores(item)}
    />
  );

  for (const g of dia.horas) {
    nodes.push(
      <div
        key={`h-${g.hora}`}
        className="flex items-baseline justify-between border-b border-border bg-muted/50 px-4 py-1.5"
      >
        <h3 className="text-xs font-extrabold uppercase tracking-[0.08em] text-foreground">
          {g.label}
        </h3>
        <span className="text-xs text-muted-foreground">
          {g.reservas} {g.reservas === 1 ? "reserva" : "reservas"} · {g.pessoas} pessoas
        </span>
      </div>,
    );
    for (const item of g.items) {
      const hhmm = item.reserva.horario?.slice(0, 5) ?? null;
      if (!nowPlaced && hhmm && hhmm > now) {
        nodes.push(<NowMarker key="now" time={now} />);
        nowPlaced = true;
      }
      nodes.push(linha(item));
    }
  }
  if (!nowPlaced && dia.horas.length > 0) nodes.push(<NowMarker key="now" time={now} />);

  return (
    <div className="space-y-5">
      {dia.horas.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
          {nodes}
        </div>
      )}

      {dia.semHorario.length > 0 && (
        <section aria-label="Reservas sem horário">
          <div className="mb-1.5 flex items-baseline justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
              Reservas sem horário
              <span className="ml-2 rounded-full bg-muted px-1.5 text-[11px] tabular-nums text-foreground">
                {dia.semHorario.length}
              </span>
            </h3>
            <Link
              to="/$slug/admin/reservas"
              params={{ slug }}
              className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-primary hover:underline xl:min-h-0"
            >
              Ver em Reservas <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
            {dia.semHorario.map(linha)}
          </div>
        </section>
      )}
    </div>
  );
}
