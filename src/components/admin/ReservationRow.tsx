import { Cake, MessageSquareText, Receipt } from "lucide-react";

import { AREA_LABEL, TIPO_SHORT, formatHorario, type Reserva } from "@/lib/reservations";
import { cn } from "@/lib/utils";
import { Drop } from "./Drop";
import { ReservationStatus } from "./ReservationStatus";

function Chip({ icon: Icon, children }: { icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <span className="inline-flex h-5 items-center gap-1 rounded-full bg-muted px-2 text-[11px] font-semibold text-muted-foreground">
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}

/**
 * Linha de reserva reutilizável (Hoje, Reservas e, depois, Agenda).
 * Hierarquia: horário, nome, pessoas, status, ação principal, secundárias.
 * Mobile: duas linhas. Desktop: colunas alinhadas.
 */
export function ReservationRow({
  reserva: r, onOpen, action, selected, now, showDate,
}: {
  reserva: Reserva;
  onOpen: () => void;
  /** Ação principal da linha (ex.: QuickAction "Confirmar"). */
  action?: React.ReactNode;
  selected?: boolean;
  /** Marca a linha como "agora" (gota). */
  now?: boolean;
  /** Mostra a data antes do horário (listas que cruzam dias). */
  showDate?: React.ReactNode;
}) {
  const chips: React.ReactNode[] = [];
  if (r.tipo !== "mesa") chips.push(<Chip key="tipo">{TIPO_SHORT[r.tipo]}</Chip>);
  if (r.tipo === "aniversario" && r.leva_bolo) chips.push(<Chip key="bolo" icon={Cake}>Bolo</Chip>);
  if (r.tipo === "aniversario" && r.comandas) chips.push(<Chip key="comandas" icon={Receipt}>Comandas</Chip>);
  if (r.observacoes) chips.push(<Chip key="obs" icon={MessageSquareText}>Observação</Chip>);

  const horario = r.horario ? formatHorario(r.horario) : "—";
  const pessoas = r.quantidade != null ? `${r.quantidade}` : "—";
  const area = r.area ? AREA_LABEL[r.area] : null;
  const dim = r.status === "cancelada" || r.status === "finalizada";

  return (
    <div
      className={cn(
        "relative flex items-center gap-2 border-b border-border bg-card transition-colors last:border-b-0",
        selected ? "bg-accent" : "hover:bg-muted/50",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Abrir reserva de ${r.nome}`}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "grid min-w-0 flex-1 items-center gap-x-3 gap-y-0.5 px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
          // mobile: horário | nome + pessoas / status ; desktop: colunas alinhadas
          "grid-cols-[3.25rem_minmax(0,1fr)_auto] lg:grid-cols-[4rem_minmax(0,1fr)_3.5rem_7rem_8.5rem]",
          dim && "opacity-70",
        )}
      >
        <span className="row-span-2 flex items-center gap-1.5 text-[15px] font-extrabold tabular-nums text-foreground lg:row-span-1">
          {now && <Drop animate />}
          {showDate ?? horario}
        </span>

        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-foreground">{r.nome}</span>
          {chips.length > 0 && <span className="mt-1 hidden flex-wrap gap-1 lg:flex">{chips}</span>}
        </span>

        <span className="hidden text-right text-sm tabular-nums text-muted-foreground lg:block">{pessoas} <span className="text-xs">pess.</span></span>
        <span className="hidden truncate text-sm text-muted-foreground lg:block">{area ?? ""}</span>

        <span className="justify-self-end lg:justify-self-start"><ReservationStatus status={r.status} /></span>

        <span className="col-start-2 col-end-4 flex min-w-0 items-center gap-x-2 text-[13px] text-muted-foreground lg:hidden">
          <span className="shrink-0 tabular-nums">{pessoas} pess.</span>
          {area && <span className="truncate">· {area}</span>}
          {chips.length > 0 && <span className="flex gap-1">{chips.slice(0, 2)}</span>}
        </span>
      </button>

      {action && <div className="shrink-0 pr-3 lg:pr-4">{action}</div>}
    </div>
  );
}
