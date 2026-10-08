import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { formatHorario, type Reserva } from "@/lib/reservations";
import { cn } from "@/lib/utils";

const card =
  "group flex min-h-[84px] flex-col justify-between rounded-lg border border-border bg-card p-3.5 text-left shadow-xs transition-colors hover:border-blue-200 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30";

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
      {children}
      <ArrowRight
        className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      />
    </span>
  );
}

const numero = "text-3xl font-extrabold tabular-nums tracking-[-0.03em]";

/** Leitura do dia: quantas reservas, quantas pessoas e quem chega a seguir. Cada cartao leva a acao. */
export function DiaResumo({
  slug,
  dia,
  reservas,
  pessoas,
  proxima,
  isToday,
  onAbrirProxima,
}: {
  slug: string;
  dia: string;
  reservas: number;
  pessoas: number;
  proxima: Reserva | null;
  isToday: boolean;
  onAbrirProxima: (r: Reserva) => void;
}) {
  const rotuloProxima = isToday ? "Chega a seguir" : "Primeira chegada";
  return (
    <ul aria-label="Resumo do dia" className="grid grid-cols-2 gap-3 md:grid-cols-3">
      <li>
        <Link
          to="/$slug/admin/reservas"
          params={{ slug }}
          search={{ dia }}
          className={cn(card, "h-full")}
        >
          <Rotulo>Reservas</Rotulo>
          <span>
            <span className={numero}>{reservas}</span>
            <span className="ml-2 text-sm text-muted-foreground">
              {reservas === 1 ? "reserva" : "reservas"}
            </span>
          </span>
        </Link>
      </li>
      <li>
        <Link
          to="/$slug/admin/agenda"
          params={{ slug }}
          search={{ dia }}
          className={cn(card, "h-full")}
        >
          <Rotulo>Pessoas esperadas</Rotulo>
          <span>
            <span className={numero}>{pessoas}</span>
            <span className="ml-2 text-sm text-muted-foreground">
              {pessoas === 1 ? "pessoa" : "pessoas"}
            </span>
          </span>
        </Link>
      </li>
      <li className="col-span-2 md:col-span-1">
        {proxima ? (
          <button
            type="button"
            onClick={() => onAbrirProxima(proxima)}
            className={cn(card, "h-full w-full")}
          >
            <Rotulo>{rotuloProxima}</Rotulo>
            <span>
              <span className={numero}>{formatHorario(proxima.horario)}</span>
              <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                {proxima.nome} · {proxima.quantidade}{" "}
                {proxima.quantidade === 1 ? "pessoa" : "pessoas"}
              </span>
            </span>
          </button>
        ) : (
          <Link
            to="/$slug/admin/agenda"
            params={{ slug }}
            search={{ dia }}
            className={cn(card, "h-full")}
          >
            <Rotulo>{rotuloProxima}</Rotulo>
            <span className="text-sm text-muted-foreground">
              {reservas === 0 ? "Sem reservas neste dia." : "Sem chegadas marcadas para agora."}
            </span>
          </Link>
        )}
      </li>
    </ul>
  );
}
