import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { formatHorario, type Reserva } from "@/lib/reservations";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  reservas: number;
  pessoas: number;
  proxima: Reserva | null;
  restantes: number;
  isToday: boolean;
  pendentes: number;
  reconfirmar: number;
  onAbrirProxima: (r: Reserva) => void;
  onAbrirPrecisaDeVoce: () => void;
};

const card =
  "group flex min-h-[92px] flex-col justify-between rounded-2xl border border-border bg-card p-4 text-left shadow-xs transition-colors hover:border-blue-200 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30";

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

/**
 * Leitura rapida do dia. Cada cartao leva para onde a acao acontece (Reservas, a reserva,
 * "Precisa de voce"): o Dashboard mostra, as outras areas resolvem.
 */
export function Kpis(p: Props) {
  const precisa = p.pendentes + p.reconfirmar;
  return (
    <ul aria-label="Resumo do dia" className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
      <li>
        <Link to="/$slug/admin/reservas" params={{ slug: p.slug }} className={card}>
          <Rotulo>Reservas</Rotulo>
          <span>
            <span className="text-3xl font-extrabold tabular-nums tracking-[-0.03em]">
              {p.reservas}
            </span>
            <span className="ml-2 text-sm text-muted-foreground">
              {p.pessoas} {p.pessoas === 1 ? "pessoa" : "pessoas"}
            </span>
          </span>
        </Link>
      </li>
      <li>
        {p.proxima ? (
          <button
            type="button"
            onClick={() => p.onAbrirProxima(p.proxima!)}
            className={cn(card, "w-full")}
          >
            <Rotulo>{p.isToday ? "Chega a seguir" : "Primeira chegada"}</Rotulo>
            <span>
              <span className="text-3xl font-extrabold tabular-nums tracking-[-0.03em]">
                {formatHorario(p.proxima.horario)}
              </span>
              <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                {p.proxima.nome} · {p.proxima.quantidade}{" "}
                {p.proxima.quantidade === 1 ? "pessoa" : "pessoas"}
              </span>
            </span>
          </button>
        ) : (
          <Link to="/$slug/admin/agenda" params={{ slug: p.slug }} className={card}>
            <Rotulo>{p.isToday ? "Chega a seguir" : "Primeira chegada"}</Rotulo>
            <span className="text-sm text-muted-foreground">
              {p.reservas === 0 ? "Sem reservas neste dia." : "Sem chegadas marcadas para agora."}
            </span>
          </Link>
        )}
      </li>
      <li>
        <button
          type="button"
          onClick={p.onAbrirPrecisaDeVoce}
          className={cn(card, "w-full", p.pendentes > 0 && "border-warning-200 bg-warning-50/50")}
        >
          <Rotulo>Confirmar</Rotulo>
          <span>
            <span className="text-3xl font-extrabold tabular-nums tracking-[-0.03em]">
              {p.pendentes}
            </span>
            <span className="ml-2 text-sm text-muted-foreground">
              {p.pendentes === 1 ? "pendente" : "pendentes"}
            </span>
          </span>
        </button>
      </li>
      <li>
        <button type="button" onClick={p.onAbrirPrecisaDeVoce} className={cn(card, "w-full")}>
          <Rotulo>Reconfirmar</Rotulo>
          <span>
            <span className="text-3xl font-extrabold tabular-nums tracking-[-0.03em]">
              {p.reconfirmar}
            </span>
            <span className="ml-2 text-sm text-muted-foreground">
              {precisa === 0 ? "tudo em dia" : "hoje e amanhã"}
            </span>
          </span>
        </button>
      </li>
    </ul>
  );
}
