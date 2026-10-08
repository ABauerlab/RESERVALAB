import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { tabela } from "@/lib/cardapio";
import { todayISO } from "@/lib/admin-dates";
import { ehPlanoId, intervaloDoMes, planoEmVigor, usoDeReservas, type PlanoId } from "@/lib/plans";

type PlanoRow = {
  tenant_id: string;
  plano: PlanoId;
  ciclo: "mensal" | "anual";
  vigente_ate: string | null;
};

/**
 * Plano da empresa e uso de reservas no mes. Sem linha em `tenant_planos` vale o plano de
 * lancamento (Pro), para nunca limitar quem ja usa o produto. Somente leitura.
 */
export function usePlano(ready: boolean, tenantId: string | null) {
  const enabled = ready && !!tenantId;
  const registroQ = useQuery({
    enabled,
    queryKey: ["plano", tenantId],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await tabela<PlanoRow>("tenant_planos")
        .select("*")
        .eq("tenant_id", tenantId!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ?? null;
    },
  });

  const { inicio, fim } = intervaloDoMes(todayISO());
  const usoQ = useQuery({
    enabled,
    queryKey: ["reservas", tenantId, "uso-mes", inicio],
    staleTime: 60_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("reservas")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId!)
        .gte("data", inicio)
        .lt("data", fim)
        .neq("status", "cancelada");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const registro = registroQ.data ?? null;
  const plano = planoEmVigor(registro?.plano);
  return {
    plano,
    /** Plano definido pelo time. Falso = Pro de lancamento (sem registro). */
    explicito: !!registro && ehPlanoId(registro.plano),
    ciclo: registro?.ciclo ?? null,
    vigenteAte: registro?.vigente_ate ?? null,
    uso: usoDeReservas(usoQ.data ?? 0, plano),
    loading: registroQ.isLoading || usoQ.isLoading,
  };
}
