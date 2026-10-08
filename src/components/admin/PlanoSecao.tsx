import { Check, Minus } from "lucide-react";

import { usePlano } from "@/hooks/use-plano";
import {
  ORDEM_PLANOS,
  PLANOS,
  RECURSOS_ORDEM,
  ROTULO_RECURSO,
  descontoAnualPercentual,
  formatarReais,
  temRecurso,
} from "@/lib/plans";
import { mailtoContato } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * "Seu plano": plano em vigor, uso do mes e comparacao. Sem cobranca: mudar de plano e uma
 * conversa com o time, que ativa o plano para a empresa.
 */
export function PlanoSecao({
  ready,
  tenantId,
  tenantNome,
}: {
  ready: boolean;
  tenantId: string | null;
  tenantNome: string;
}) {
  const info = usePlano(ready, tenantId);
  const { plano, uso } = info;
  return (
    <div className="space-y-5 border-t border-border/60 pt-5 first:border-t-0 first:pt-0">
      <div>
        <p className="text-sm text-muted-foreground">Plano atual</p>
        <p className="text-xl font-extrabold tracking-[-0.02em]">
          {plano.nome}
          {!info.explicito && (
            <span className="ml-2 text-sm font-medium text-muted-foreground">
              plano de lançamento
            </span>
          )}
        </p>
        {!info.explicito && (
          <p className="mt-1 text-sm text-muted-foreground">
            Você usa tudo do Pro enquanto o time define o plano da sua casa. Nada é cobrado por
            aqui.
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Reservas neste mês</span>
          <span className="tabular-nums text-muted-foreground">
            {uso.usadas} de {uso.limite}
          </span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={uso.limite}
          aria-valuenow={Math.min(uso.usadas, uso.limite)}
          aria-label="Reservas do mês"
        >
          <div
            className={cn(
              "h-full rounded-full",
              uso.estado === "ok" ? "bg-primary" : "bg-warning-500",
            )}
            style={{ width: `${uso.percentual}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          O limite é um aviso. Nenhuma reserva fica escondida ou bloqueada.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Comparar</th>
              {ORDEM_PLANOS.map((id) => (
                <th
                  key={id}
                  className={cn("px-3 py-2 font-semibold", id === plano.id && "text-blue-700")}
                >
                  {PLANOS[id].nome}
                  {id === plano.id && <span className="sr-only"> (seu plano)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/60">
              <td className="py-2.5 pr-3">Mensal</td>
              {ORDEM_PLANOS.map((id) => (
                <td key={id} className="px-3 py-2.5 tabular-nums">
                  {formatarReais(PLANOS[id].mensalCentavos)}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border/60">
              <td className="py-2.5 pr-3">Anual</td>
              {ORDEM_PLANOS.map((id) => (
                <td key={id} className="px-3 py-2.5 tabular-nums">
                  {PLANOS[id].anualCentavos === 0
                    ? "R$ 0"
                    : `${formatarReais(PLANOS[id].anualCentavos)} (${descontoAnualPercentual(PLANOS[id])}% a menos)`}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border/60">
              <td className="py-2.5 pr-3">Reservas por mês</td>
              {ORDEM_PLANOS.map((id) => (
                <td key={id} className="px-3 py-2.5 font-semibold tabular-nums">
                  {PLANOS[id].reservasPorMes}
                </td>
              ))}
            </tr>
            {RECURSOS_ORDEM.map((r) => (
              <tr key={r} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 pr-3">{ROTULO_RECURSO[r]}</td>
                {ORDEM_PLANOS.map((id) => (
                  <td key={id} className="px-3 py-2.5">
                    {temRecurso(PLANOS[id], r) ? (
                      <>
                        <Check className="h-4 w-4 text-blue-700" aria-hidden="true" />
                        <span className="sr-only">Incluído</span>
                      </>
                    ) : (
                      <>
                        <Minus className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        <span className="sr-only">Não incluído</span>
                      </>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <a
        href={mailtoContato(
          `Plano do Teggly: ${tenantNome}`,
          `Restaurante: ${tenantNome}\nPlano atual: ${plano.nome}\nQuero conversar sobre: `,
        )}
        className="inline-flex h-11 items-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-accent"
      >
        Falar sobre planos
      </a>
    </div>
  );
}
