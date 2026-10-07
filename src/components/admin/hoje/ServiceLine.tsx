import { useEffect, useState } from "react";

import type { Reserva } from "@/lib/reservations";
import { ReservationRow } from "../ReservationRow";
import { NowMarker } from "../NowMarker";
import { localHHMM, localISO } from "@/lib/admin-dates";

/**
 * Linha do serviço: reservas do dia agrupadas por hora, com a linha "agora"
 * (gota) no ponto certo quando o dia é hoje.
 */
export function ServiceLine({
  reservas,
  dia,
  selectedId,
  onOpen,
  renderAction,
  compact,
}: {
  reservas: Reserva[];
  dia: string;
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

  const isToday = dia === localISO();
  const ativas = reservas
    .filter((r) => r.status !== "cancelada")
    .sort((a, b) => (a.horario ?? "99:99").localeCompare(b.horario ?? "99:99"));

  // Agrupa por hora cheia (sem horário vai ao fim).
  const groups: Array<{ hour: string; items: Reserva[] }> = [];
  for (const r of ativas) {
    const hour = r.horario ? `${r.horario.slice(0, 2)}h` : "Sem horário";
    const last = groups[groups.length - 1];
    if (last && last.hour === hour) last.items.push(r);
    else groups.push({ hour, items: [r] });
  }

  // A linha "agora" entra antes da primeira reserva com horário posterior.
  let nowPlaced = !isToday;
  const nodes: React.ReactNode[] = [];
  groups.forEach((g) => {
    const pessoas = g.items.reduce((n, r) => n + (r.quantidade ?? 0), 0);
    nodes.push(
      <div
        key={`h-${g.hour}`}
        className="flex items-baseline justify-between border-b border-border bg-muted/50 px-4 py-1.5"
      >
        <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-foreground">
          {g.hour}
        </span>
        <span className="text-xs text-muted-foreground">
          {g.items.length} {g.items.length === 1 ? "reserva" : "reservas"} · {pessoas} pessoas
        </span>
      </div>,
    );
    g.items.forEach((r) => {
      const hhmm = r.horario ? r.horario.slice(0, 5) : null;
      if (!nowPlaced && hhmm && hhmm > now) {
        nodes.push(<NowMarker key="now" time={now} />);
        nowPlaced = true;
      }
      nodes.push(
        <ReservationRow
          key={r.id}
          reserva={r}
          onOpen={() => onOpen(r)}
          selected={selectedId === r.id}
          compact={compact}
          action={renderAction(r)}
        />,
      );
    });
  });
  if (!nowPlaced) nodes.push(<NowMarker key="now" time={now} />);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">{nodes}</div>
  );
}
