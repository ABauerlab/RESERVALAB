import { useState } from "react";
import { Check, Minus } from "lucide-react";

import {
  ORDEM_PLANOS,
  PLANOS,
  ROTULO_RECURSO,
  descontoAnualPercentual,
  formatarReais,
  mensalDoAnualCentavos,
  temRecurso,
  type PlanoId,
  type Recurso,
} from "@/lib/plans";
import { mailtoContato } from "@/lib/site";
import { cn } from "@/lib/utils";

const DESTAQUE: PlanoId = "essencial";

const CTA: Record<PlanoId, string> = {
  gratuito: "Começar grátis",
  essencial: "Começar agora",
  pro: "Falar com especialista",
};

const LINHAS: Recurso[] = [
  "reserva_publica",
  "cardapio",
  "link_hub",
  "marca_opt_in",
  "whatsapp_confirmacao",
  "reconfirmacao",
  "assistente_ia",
  "relatorios_periodo",
  "relatorios_completos",
  "ocultar_powered_by",
];

export function PlanosSection() {
  const [anual, setAnual] = useState(false);
  return (
    <div>
      <div className="mt-8 inline-flex rounded-full border border-border bg-card p-1" role="group">
        {(
          [
            [false, "Mensal"],
            [true, "Anual"],
          ] as const
        ).map(([valor, rotulo]) => (
          <button
            key={rotulo}
            type="button"
            aria-pressed={anual === valor}
            onClick={() => setAnual(valor)}
            className={cn(
              "min-h-11 rounded-full px-5 text-sm font-semibold transition",
              anual === valor
                ? "bg-primary text-primary-foreground"
                : "text-slate-700 hover:text-foreground",
            )}
          >
            {rotulo}
            {valor && <span className="ml-2 text-xs font-medium opacity-90">2 meses grátis</span>}
          </button>
        ))}
      </div>

      <ul className="mt-8 grid gap-5 lg:grid-cols-3">
        {ORDEM_PLANOS.map((id) => {
          const p = PLANOS[id];
          const destaque = id === DESTAQUE;
          const preco = anual ? mensalDoAnualCentavos(p) : p.mensalCentavos;
          return (
            <li
              key={id}
              className={cn(
                "flex flex-col rounded-2xl border bg-card p-6 shadow-sm",
                destaque ? "border-primary shadow-md ring-1 ring-primary" : "border-border",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">{p.nome}</h3>
                {destaque && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    Melhor custo-benefício
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-600">{p.paraQuem}</p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-[-0.03em]">
                  {formatarReais(preco)}
                </span>
                {p.mensalCentavos > 0 && <span className="text-sm text-slate-600">por mês</span>}
              </p>
              <p className="mt-1 min-h-5 text-xs text-slate-600">
                {p.mensalCentavos === 0
                  ? "Sem cartão. Sem prazo."
                  : anual
                    ? `${formatarReais(p.anualCentavos)} por ano (${descontoAnualPercentual(p)}% a menos)`
                    : `ou ${formatarReais(p.anualCentavos)} por ano`}
              </p>
              <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                <span className="font-semibold">{p.reservasPorMes} reservas por mês</span>
                <span className="block text-xs text-slate-600">
                  {p.usuarios} {p.usuarios === 1 ? "usuário" : "usuários"} no painel
                </span>
              </p>
              <ul className="mb-8 mt-5 space-y-2.5 text-sm">
                {LINHAS.filter((r) => temRecurso(p, r)).map((r) => (
                  <li key={r} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
                    {ROTULO_RECURSO[r]}
                  </li>
                ))}
              </ul>
              <a
                href={mailtoContato(
                  `Quero começar com o Teggly (plano ${p.nome})`,
                  "Nome do restaurante:\nCidade:\nWhatsApp para contato:",
                )}
                className={cn(
                  "inline-flex h-11 items-center justify-center rounded-[10px] px-5 text-[15px] font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30",
                  destaque
                    ? "mt-auto bg-primary text-primary-foreground shadow-blue hover:bg-blue-700"
                    : "mt-auto border border-border bg-card hover:bg-slate-50",
                )}
              >
                {CTA[id]}
              </a>
            </li>
          );
        })}
      </ul>

      <details className="group mt-8 rounded-2xl border border-border bg-card">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-sm font-semibold">
          Comparar os planos
          <span className="text-xs font-medium text-slate-600 group-open:hidden">Abrir</span>
          <span className="hidden text-xs font-medium text-slate-600 group-open:inline">
            Fechar
          </span>
        </summary>
        <div className="overflow-x-auto px-5 pb-5">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-slate-600">
                <th className="py-3 pr-4 font-medium">Recurso</th>
                {ORDEM_PLANOS.map((id) => (
                  <th key={id} className="px-3 py-3 font-semibold">
                    {PLANOS[id].nome}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LINHAS.map((r) => (
                <tr key={r} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-4">{ROTULO_RECURSO[r]}</td>
                  {ORDEM_PLANOS.map((id) => (
                    <td key={id} className="px-3 py-3">
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
              <tr className="border-b border-border/60">
                <td className="py-3 pr-4">Reservas por mês</td>
                {ORDEM_PLANOS.map((id) => (
                  <td key={id} className="px-3 py-3 font-semibold">
                    {PLANOS[id].reservasPorMes}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-3 pr-4">Clientes cadastrados</td>
                {ORDEM_PLANOS.map((id) => (
                  <td key={id} className="px-3 py-3 font-semibold">
                    {PLANOS[id].clientes ?? "Sem limite"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 pr-4">Suporte</td>
                {ORDEM_PLANOS.map((id) => (
                  <td key={id} className="px-3 py-3">
                    {PLANOS[id].suporte}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-slate-600">
        Preços de lançamento. Sem fidelidade e sem taxa por reserva. O limite de reservas é um
        aviso: nenhuma reserva fica escondida. Por enquanto, os planos são ativados pelo nosso time.
        Para redes com várias unidades, fale com a gente.
      </p>
    </div>
  );
}
