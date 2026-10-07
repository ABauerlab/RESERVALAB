import { useEffect, useRef } from "react";

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

/** Pontos do mobile. O significado completo está no `aria-label` e no contexto do dia. */
function Pontos({ d }: { d: WeekDayInfo }) {
  return (
    <span className="flex h-2 items-center gap-1" aria-hidden="true">
      {d.pendentes > 0 && <span className="h-1.5 w-1.5 rounded-full bg-warning-500" />}
      {d.bloqueio && <span className="h-1.5 w-1.5 rounded-[2px] bg-slate-400" />}
      {d.feriado && <span className="h-1.5 w-1.5 rounded-full border border-slate-400" />}
      {d.evento && <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />}
    </span>
  );
}

/**
 * Faixa semanal (segunda a domingo). Mostra só contagem simples e contexto.
 * Nunca ocupação, capacidade, disponibilidade ou "lotado".
 * - Mobile (< 768): rola dentro do próprio container, com o dia selecionado centralizado;
 *   cada dia mostra número, contagem e pontos de contexto.
 * - Tablet e desktop: 7 colunas com texto. `compact` abrevia quando falta espaço.
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
  /** Espaço estreito (tablet em retrato ou detalhe acoplado): textos abreviados. */
  compact?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const selectedIso = days.find((d) => d.selected)?.iso;

  // Centraliza o dia selecionado na faixa rolável (só mexe no scroll da própria faixa).
  useEffect(() => {
    const box = ref.current;
    const el = box?.querySelector<HTMLElement>("[aria-pressed='true']");
    if (!box || !el || box.scrollWidth <= box.clientWidth) return;
    box.scrollLeft = el.offsetLeft - (box.clientWidth - el.clientWidth) / 2;
  }, [selectedIso]);

  return (
    <div
      ref={ref}
      className={cn(
        "-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:overflow-visible md:px-0",
        className,
      )}
    >
      <div
        role="group"
        aria-label="Semana"
        className="flex gap-1.5 md:grid md:grid-cols-7 md:gap-2"
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
              "w-[3.6rem] shrink-0 rounded-lg border text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring md:w-auto md:shrink",
              "min-h-[76px] px-1.5 py-2 md:min-h-[96px] md:px-3 md:py-2.5",
              d.selected
                ? "border-primary bg-accent shadow-xs"
                : "border-border bg-card hover:bg-muted",
            )}
          >
            {/* Mobile */}
            <span className="flex flex-col items-center gap-0.5 md:hidden">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-muted-foreground">
                {d.weekday}
              </span>
              <span className="flex items-center gap-0.5 text-lg font-extrabold leading-none tabular-nums text-foreground">
                {d.selected && <Drop className="size-2" />}
                {String(d.dayNumber).padStart(2, "0")}
              </span>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {d.reservas === 0 ? "0" : `${d.reservas} res.`}
              </span>
              <Pontos d={d} />
            </span>

            {/* Tablet e desktop */}
            <span className="hidden h-full flex-col items-start gap-1 md:flex">
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
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
