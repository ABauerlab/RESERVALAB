import { Drop } from "./Drop";

/** Linha "agora" (gota) usada na linha do serviço do Hoje e na Agenda. */
export function NowMarker({ time }: { time: string }) {
  return (
    <div
      className="flex items-center gap-2 bg-card px-4 py-1.5"
      role="separator"
      aria-label={`Agora, ${time}`}
    >
      <Drop animate />
      <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary">
        Agora · {time}
      </span>
      <span className="h-px flex-1 bg-primary/40" />
    </div>
  );
}
