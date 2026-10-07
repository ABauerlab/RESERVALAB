import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import type { Reserva } from "@/lib/reservations";
import type { Bloqueio, EventoDestaque, Feriado } from "@/lib/agenda";

/**
 * Leituras da Agenda por intervalo de datas (inclusivo). Somente SELECT.
 *
 * `has_tenant_role` libera qualquer super_admin em qualquer empresa, então o isolamento
 * NÃO pode depender só da RLS: toda consulta mantém `.eq("tenant_id", tenantId)`.
 */
type Client = SupabaseClient<Database>;

/** Teto de reservas por semana (o mesmo do Hoje). Acima disso a Agenda avisa. */
export const AGENDA_LIMITE_RESERVAS = 500;

export async function fetchReservasIntervalo(
  client: Client,
  tenantId: string,
  ini: string,
  fim: string,
): Promise<{ reservas: Reserva[]; truncado: boolean }> {
  const { data, error } = await client
    .from("reservas")
    .select("*")
    .eq("tenant_id", tenantId)
    .gte("data", ini)
    .lte("data", fim)
    .order("data", { ascending: true })
    .order("horario", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(AGENDA_LIMITE_RESERVAS);
  if (error) throw error;
  const reservas = (data ?? []) as Reserva[];
  return { reservas, truncado: reservas.length >= AGENDA_LIMITE_RESERVAS };
}

export async function fetchBloqueiosIntervalo(
  client: Client,
  tenantId: string,
  ini: string,
  fim: string,
): Promise<Bloqueio[]> {
  const { data, error } = await client
    .from("agenda_bloqueios")
    .select("*")
    .eq("tenant_id", tenantId)
    .gte("data", ini)
    .lte("data", fim)
    .order("data", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchFeriadosIntervalo(
  client: Client,
  tenantId: string,
  ini: string,
  fim: string,
): Promise<Feriado[]> {
  const { data, error } = await client
    .from("feriados")
    .select("*")
    .eq("tenant_id", tenantId)
    .gte("data", ini)
    .lte("data", fim)
    .order("data", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchEventosIntervalo(
  client: Client,
  tenantId: string,
  ini: string,
  fim: string,
): Promise<EventoDestaque[]> {
  const { data, error } = await client
    .from("eventos_destaque")
    .select("*")
    .eq("tenant_id", tenantId)
    .gte("data", ini)
    .lte("data", fim)
    .order("data", { ascending: true })
    .order("horario", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}
