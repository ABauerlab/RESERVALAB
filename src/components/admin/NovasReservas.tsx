import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BellRing, Check, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  TIPO_SHORT, formatData, formatHorario, type Reserva,
} from "@/lib/reservations";

function storageKey(tenantId: string) {
  return `reservalab:ultima-visita:${tenantId}`;
}

function readLastSeen(tenantId: string): string {
  try {
    return localStorage.getItem(storageKey(tenantId)) ?? new Date(0).toISOString();
  } catch {
    return new Date(0).toISOString();
  }
}

/** Aviso de reservas criadas desde a última vez que o admin abriu o painel. */
export function NovasReservasBanner({ tenantId }: { tenantId: string | null }) {
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [dispensado, setDispensado] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    setLastSeen(readLastSeen(tenantId));
    setDispensado(false);
  }, [tenantId]);

  const q = useQuery({
    enabled: !!tenantId && !!lastSeen,
    queryKey: ["novas-reservas", tenantId, lastSeen],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservas")
        .select("*")
        .eq("tenant_id", tenantId!)
        .gt("created_at", lastSeen!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Reserva[];
    },
  });

  if (!tenantId || dispensado) return null;
  if (q.isLoading) {
    return (
      <div className="flex items-center gap-2 px-1 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Verificando novas reservas…
      </div>
    );
  }

  const novas = q.data ?? [];
  if (novas.length === 0) return null;

  function marcarVistas() {
    try {
      localStorage.setItem(storageKey(tenantId!), new Date().toISOString());
    } catch { /* noop */ }
    setDispensado(true);
  }

  return (
    <section className="rounded-lg border border-primary/20 bg-accent p-3.5 animate-in-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-accent-foreground">
          <BellRing className="h-4 w-4" />
          {novas.length === 1 ? "1 nova reserva desde sua última visita" : `${novas.length} novas reservas desde sua última visita`}
        </p>
        <button
          onClick={marcarVistas}
          className="inline-flex h-11 items-center gap-1.5 lg:h-9 rounded-full border border-primary/25 bg-card px-3 text-xs font-semibold text-accent-foreground transition-colors hover:bg-muted"
        >
          <Check className="h-3.5 w-3.5" /> Marcar como vistas
        </button>
      </div>

      <ul className="mt-3 max-h-44 space-y-1.5 overflow-y-auto">
        {novas.map((r) => (
          <li key={r.id} className="rounded-md bg-card px-3 py-2 text-[13px]">
            <span className="font-medium">{r.nome}</span>
            <span className="text-muted-foreground">
              {" — "}{TIPO_SHORT[r.tipo]} • {r.quantidade ?? "?"} pessoas • {formatData(r.data)}
              {r.horario ? ` às ${formatHorario(r.horario)}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
