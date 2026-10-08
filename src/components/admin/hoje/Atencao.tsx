import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

import type { Reserva } from "@/lib/reservations";
import { NeedsYou } from "./NeedsYou";

/**
 * Primeira camada do Dashboard: o que exige uma acao sua agora. Sem pendencia, vira uma faixa
 * discreta de "tudo em dia" e nao ocupa espaco. Com pendencia, mostra a lista com a acao a um toque.
 */
export function Atencao({
  slug,
  tenantId,
  pendentes,
  reconfirmar,
  loading,
  selectedId,
  onOpen,
  renderAction,
}: {
  slug: string;
  tenantId: string | null;
  pendentes: Reserva[];
  reconfirmar: Reserva[];
  loading: boolean;
  selectedId?: string | null;
  onOpen: (r: Reserva) => void;
  renderAction: (r: Reserva) => React.ReactNode;
}) {
  const total = pendentes.length + reconfirmar.length;

  if (!loading && total === 0) {
    return (
      <section
        aria-label="Precisa de atenção"
        className="flex items-center gap-3 rounded-lg border border-success-200 bg-success-50/60 px-4 py-3"
      >
        <CheckCircle2 className="h-5 w-5 shrink-0 text-success-600" aria-hidden="true" />
        <p className="text-sm font-semibold text-foreground">
          Tudo em dia
          <span className="ml-2 font-normal text-muted-foreground">
            Nenhuma reserva esperando por você.
          </span>
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Precisa de atenção" id="precisa-de-voce">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] text-foreground">
          Precisa de atenção
          {total > 0 && (
            <span className="rounded-full bg-warning-100 px-2 py-0.5 text-[11px] tabular-nums text-warning-700">
              {total}
            </span>
          )}
        </h2>
        {pendentes.length > 0 && (
          <Link
            to="/$slug/admin/reservas"
            params={{ slug }}
            search={{ status: "pendente" }}
            className="inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:underline xl:min-h-0"
          >
            Ver todas as pendentes
          </Link>
        )}
      </div>
      <NeedsYou
        tenantId={tenantId}
        pendentes={pendentes}
        reconfirmar={reconfirmar}
        selectedId={selectedId}
        onOpen={onOpen}
        renderAction={renderAction}
        loading={loading}
      />
    </section>
  );
}
