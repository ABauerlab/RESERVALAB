import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Reserva } from "@/lib/reservations";
import { addDaysISO, todayISO, tomorrowISO } from "@/lib/admin-dates";

/**
 * Leituras do painel Hoje. Somente SELECT, sempre filtrando por tenant_id.
 * As chaves de reservas começam com ["reservas", tenantId] para que o realtime
 * existente (invalida esse prefixo) atualize a tela sem recarregar.
 */
export function useHojeData(ready: boolean, tenantId: string | null, dia: string) {
  const enabled = ready && !!tenantId;

  // Reservas do dia escolhido (mesma ordenação da lista original).
  const diaQ = useQuery({
    enabled,
    queryKey: ["reservas", tenantId, "hoje-dia", dia],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservas")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("data", dia)
        .order("horario", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Reserva[];
    },
  });

  // Precisa de você: pendentes (qualquer data).
  const pendentesQ = useQuery({
    enabled,
    queryKey: ["reservas", tenantId, "precisa-pendentes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservas")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("status", "pendente")
        .order("data", { ascending: true, nullsFirst: false })
        .order("horario", { ascending: true })
        .limit(50);
      if (error) throw error;
      return data as Reserva[];
    },
  });

  // Precisa de você: confirmadas de hoje/amanhã ainda sem reconfirmação.
  const reconfirmarQ = useQuery({
    enabled,
    queryKey: ["reservas", tenantId, "precisa-reconfirmar", todayISO()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservas")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("status", "confirmada")
        .is("reconfirmada_em", null)
        .gte("data", todayISO())
        .lte("data", tomorrowISO())
        .order("data", { ascending: true })
        .order("horario", { ascending: true })
        .limit(50);
      if (error) throw error;
      return data as Reserva[];
    },
  });

  // Próximos dias: 7 dias depois do dia escolhido.
  const ini = addDaysISO(dia, 1);
  const fim = addDaysISO(dia, 7);
  const proximosQ = useQuery({
    enabled,
    queryKey: ["reservas", tenantId, "proximos", dia],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservas")
        .select("data,quantidade,status")
        .eq("tenant_id", tenantId!)
        .gte("data", ini)
        .lte("data", fim)
        .neq("status", "cancelada")
        .limit(500);
      if (error) throw error;
      return data as Array<Pick<Reserva, "data" | "quantidade" | "status">>;
    },
  });

  const bloqueiosQ = useQuery({
    enabled,
    queryKey: ["hoje-bloqueios", tenantId, ini, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agenda_bloqueios")
        .select("*")
        .eq("tenant_id", tenantId!)
        .gte("data", ini)
        .lte("data", fim);
      if (error) throw error;
      return data;
    },
  });

  const feriadosQ = useQuery({
    enabled,
    queryKey: ["hoje-feriados", tenantId, ini, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feriados")
        .select("*")
        .eq("tenant_id", tenantId!)
        .gte("data", ini)
        .lte("data", fim);
      if (error) throw error;
      return data;
    },
  });

  const eventosQ = useQuery({
    enabled,
    queryKey: ["hoje-eventos", tenantId, ini, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eventos_destaque")
        .select("*")
        .eq("tenant_id", tenantId!)
        .gte("data", ini)
        .lte("data", fim);
      if (error) throw error;
      return data;
    },
  });

  return { diaQ, pendentesQ, reconfirmarQ, proximosQ, bloqueiosQ, feriadosQ, eventosQ, ini, fim };
}
