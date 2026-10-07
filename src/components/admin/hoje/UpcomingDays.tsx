import { addDaysISO, weekdayLabel } from "@/lib/admin-dates";
import { cn } from "@/lib/utils";

export type DayInfo = {
  reservas: number;
  pessoas: number;
  bloqueio: boolean;
  feriado: boolean;
  evento: boolean;
};

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
      {children}
    </span>
  );
}

/** Próximos dias: segunda camada, leitura rápida (não é analytics). */
export function UpcomingDays({
  dia,
  info,
  onPick,
}: {
  dia: string;
  info: Record<string, DayInfo>;
  onPick: (iso: string) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(dia, i + 1));
  return (
    <section aria-label="Próximos dias">
      <h2 className="mb-2 text-xs font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
        Próximos dias
      </h2>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2 md:grid-cols-4 xl:grid-cols-7">
        {days.map((iso) => {
          const d = info[iso] ?? {
            reservas: 0,
            pessoas: 0,
            bloqueio: false,
            feriado: false,
            evento: false,
          };
          const [, m, dd] = iso.split("-");
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onPick(iso)}
              className={cn(
                "flex min-h-11 items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:bg-muted sm:flex-col sm:items-start sm:justify-start sm:gap-1",
                d.bloqueio && "bg-muted/60",
              )}
            >
              <span className="text-[13px] font-semibold text-foreground">
                <span className="capitalize">{weekdayLabel(iso, true)}</span> {dd}/{m}
              </span>
              <span className="text-xs text-muted-foreground">
                {d.reservas === 0
                  ? "Sem reservas"
                  : `${d.reservas} ${d.reservas === 1 ? "reserva" : "reservas"} · ${d.pessoas} pess.`}
              </span>
              {(d.bloqueio || d.feriado || d.evento) && (
                <span className="flex flex-wrap gap-1">
                  {d.bloqueio && <Tag>Bloqueio</Tag>}
                  {d.feriado && <Tag>Feriado</Tag>}
                  {d.evento && <Tag>Evento</Tag>}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
