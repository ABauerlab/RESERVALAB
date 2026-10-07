import { Cake, MessageSquareText, Receipt, Users } from "lucide-react";

import { AREA_LABEL, TIPO_SHORT, formatHorario, type Reserva } from "@/lib/reservations";
import { cn } from "@/lib/utils";
import { Drop } from "./Drop";
import { ReservationStatus } from "./ReservationStatus";

function Chip({
  icon: Icon,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
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
  reserva: r,
  onOpen,
  action,
  selected,
  now,
  showDate,
  compact,
  extra,
}: {
  reserva: Reserva;
  onOpen: () => void;
  /** Ação principal da linha (ex.: QuickAction "Confirmar"). */
  action?: React.ReactNode;
  selected?: boolean;
  /** Marca a linha como "agora" (gota). */
  now?: boolean;
  /** Mostra a data no lugar do horário (listas que cruzam dias). */
  showDate?: React.ReactNode;
  /** Força o layout de duas linhas (colunas estreitas). */
  compact?: boolean;
  /** Marcadores informativos extras (ex.: "Dentro de bloqueio", "Grupo grande"). */
  extra?: React.ReactNode;
}) {
  const chips: React.ReactNode[] = [];
  if (r.tipo !== "mesa") chips.push(<Chip key="tipo">{TIPO_SHORT[r.tipo]}</Chip>);
  if (r.tipo === "aniversario" && r.leva_bolo)
    chips.push(
      <Chip key="bolo" icon={Cake}>
        Bolo
      </Chip>,
    );
  if (r.tipo === "aniversario" && r.comandas)
    chips.push(
      <Chip key="comandas" icon={Receipt}>
        Comandas
      </Chip>,
    );
  if (r.observacoes)
    chips.push(
      <Chip key="obs" icon={MessageSquareText}>
        Observação
      </Chip>,
    );

  const horario = r.horario ? formatHorario(r.horario) : "—";
  const pessoas = r.quantidade != null ? `${r.quantidade}` : "—";
  const area = r.area ? AREA_LABEL[r.area] : null;
  const dim = r.status === "cancelada" || r.status === "finalizada";
  const time = (
    <span className="flex items-center gap-1.5 text-[15px] font-extrabold tabular-nums text-foreground">
      {now && <Drop animate />}
      {showDate ?? horario}
    </span>
  );

  // Duas linhas: horário | nome / status · pessoas · área.
  const narrow = (
    <div
      className={cn(
        "grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-x-2.5 sm:grid-cols-[3.25rem_minmax(0,1fr)] sm:gap-x-3",
        compact ? "" : "md:hidden",
      )}
    >
      {time}
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-semibold text-foreground">{r.nome}</span>
        <span className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-muted-foreground">
          <ReservationStatus status={r.status} className="h-[22px] shrink-0 px-2 text-[11px]" />
          <span className="inline-flex shrink-0 items-center gap-1 tabular-nums">
            {compact || action ? (
              <>
                <Users className="h-3.5 w-3.5" aria-label="pessoas" />
                {pessoas}
              </>
            ) : (
              <>{pessoas} pess.</>
            )}
          </span>
          {area && !compact && (
            <span className={cn("truncate", action && "hidden sm:inline", compact && "hidden")}>
              · {area}
            </span>
          )}
        </span>
        {extra && <span className="mt-1 flex flex-wrap gap-1">{extra}</span>}
      </span>
    </div>
  );

  // Colunas alinhadas (desktop).
  const wide = compact ? null : (
    <div className="hidden grid-cols-[3.5rem_minmax(0,1fr)_6rem_7rem] items-center gap-x-3 md:grid">
      {time}
      <span className="min-w-0">
        <span className="block line-clamp-2 break-words text-[15px] font-semibold text-foreground">
          {r.nome}
        </span>
        {(chips.length > 0 || extra) && (
          <span className="mt-1 flex flex-wrap gap-1">
            {chips}
            {extra}
          </span>
        )}
      </span>
      <span className="min-w-0 text-sm text-muted-foreground">
        <span className="block tabular-nums">
          {pessoas} <span className="text-xs">pess.</span>
        </span>
        {area && <span className="block truncate text-xs">{area}</span>}
      </span>
      <span>
        <ReservationStatus status={r.status} />
      </span>
    </div>
  );

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
          "min-w-0 flex-1 overflow-hidden px-3 py-3 text-left sm:px-4 outline-none focus-visible:ring-2 focus-visible:ring-ring",
          dim && "opacity-70",
        )}
      >
        {narrow}
        {wide}
      </button>

      {action !== undefined && (
        <div
          className={cn(
            "shrink-0 pr-2.5 sm:pr-3 md:pr-4",
            !compact && "md:flex md:w-[124px] md:justify-end",
          )}
        >
          {action}
        </div>
      )}
    </div>
  );
}
