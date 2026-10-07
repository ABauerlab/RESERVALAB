import { Drop } from "@/components/admin/Drop";
import type { WeekDayInfo } from "@/lib/agenda";
import { cn } from "@/lib/utils";

function rotulo(d: WeekDayInfo) {
  const partes = [`${d.weekday} ${d.dayNumber}`];
  partes.push(
    d.reservas === 0
      ? "sem reservas"
      : `${d.reservas} ${d.reservas === 1 ? "reserva" : "reservas"}, ${d.pessoas} pessoas`,
  );
  if (d.pendentes > 0)
    partes.push(`${d.pendentes} ${d.pendentes === 1 ? "pendente" : "pendentes"}`);
  if (d.bloqueio) partes.push("bloqueio");
  if (d.feriado) partes.push("feriado");
  if (d.evento) partes.push("evento");
  return partes.join(", ");
}

/**
 * Base da faixa semanal (segunda a domingo). Estrutura e semântica; o visual final é da F2.2 a F2.4.
 * Mostra só contagem e contexto em texto. Nunca ocupação, capacidade ou "lotado".
 */
export function WeekStrip({
  days,
  onSelect,
  className,
}: {
  days: WeekDayInfo[];
  onSelect: (iso: string) => void;
  className?: string;
}) {
  return (
    <div role="group" aria-label="Semana" className={cn("grid grid-cols-7 gap-1.5", className)}>
      {days.map((d) => (
        <button
          key={d.iso}
          type="button"
          onClick={() => onSelect(d.iso)}
          aria-pressed={d.selected}
          aria-current={d.hoje ? "date" : undefined}
          aria-label={rotulo(d)}
          className={cn(
            "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg border px-1 py-2 text-center transition-colors",
            d.selected
              ? "border-primary bg-accent text-accent-foreground"
              : "border-border bg-card text-foreground hover:bg-muted",
          )}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {d.weekday}
          </span>
          <span className="flex items-center gap-1 text-base font-extrabold tabular-nums">
            {d.selected && <Drop />}
            {d.dayNumber}
          </span>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {d.reservas === 0 ? "0" : `${d.reservas} r`}
          </span>
        </button>
      ))}
    </div>
  );
}
