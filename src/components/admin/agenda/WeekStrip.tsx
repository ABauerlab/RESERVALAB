import { Drop } from "@/components/admin/Drop";
import type { WeekDayInfo } from "@/lib/agenda";
import { cn } from "@/lib/utils";

function rotulo(d: WeekDayInfo) {
  const partes = [`${d.weekday} ${d.dayNumber}`];
  if (d.hoje) partes.push("hoje");
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

function Tag({ tone = "muted", children }: { tone?: "muted" | "warn"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] items-center rounded-full px-1.5 text-[10px] font-semibold leading-none",
        tone === "warn" ? "bg-warning-50 text-warning-700" : "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

/**
 * Faixa semanal (segunda a domingo). Mostra só contagem simples e contexto em texto.
 * Nunca ocupação, capacidade, disponibilidade ou "lotado".
 * Em telas estreitas a faixa rola dentro do próprio container (a página não rola na horizontal).
 */
export function WeekStrip({
  days,
  onSelect,
  className,
  compact,
}: {
  days: WeekDayInfo[];
  onSelect: (iso: string) => void;
  className?: string;
  /** Espaço estreito (ex.: detalhe acoplado ao lado): textos abreviados. */
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:overflow-visible md:px-0",
        className,
      )}
    >
      <div
        role="group"
        aria-label="Semana"
        className="grid min-w-[700px] grid-cols-7 gap-2 md:min-w-0"
      >
        {days.map((d) => (
          <button
            key={d.iso}
            type="button"
            onClick={() => onSelect(d.iso)}
            aria-pressed={d.selected}
            aria-current={d.hoje ? "date" : undefined}
            aria-label={rotulo(d)}
            className={cn(
              "flex min-h-[96px] flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              d.selected
                ? "border-primary bg-accent shadow-xs"
                : "border-border bg-card hover:bg-muted",
            )}
          >
            <span className="flex w-full items-center justify-between text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
              {d.weekday}
              {d.hoje && !compact && <span className="text-primary">hoje</span>}
            </span>
            <span className="flex items-center gap-1.5 text-2xl font-extrabold leading-none tabular-nums text-foreground">
              {d.selected && <Drop />}
              {String(d.dayNumber).padStart(2, "0")}
            </span>
            <span className="text-xs text-muted-foreground">
              {d.reservas === 0 ? (
                compact ? (
                  "0"
                ) : (
                  "Sem reservas"
                )
              ) : (
                <>
                  <span className="font-semibold tabular-nums text-foreground">{d.reservas}</span>{" "}
                  {compact ? "res." : d.reservas === 1 ? "reserva" : "reservas"}
                </>
              )}
            </span>
            <span className="mt-auto flex flex-wrap gap-1">
              {d.hoje && compact && <Tag>Hoje</Tag>}
              {d.pendentes > 0 && <Tag tone="warn">{d.pendentes} pend.</Tag>}
              {d.bloqueio && <Tag>Bloqueio</Tag>}
              {d.feriado && <Tag>Feriado</Tag>}
              {d.evento && <Tag>Evento</Tag>}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
