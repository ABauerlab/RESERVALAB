import type { QueryClient } from "@tanstack/react-query";

/** Há uma reserva com este id dentro de um valor em cache (lista ou `{ reservas }`)? */
export function cacheHasReservaId(data: unknown, id: string): boolean {
  const list = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { reservas?: unknown }).reservas)
      ? (data as { reservas: unknown[] }).reservas
      : null;
  if (!list) return false;
  return list.some((r) => !!r && typeof r === "object" && (r as { id?: unknown }).id === id);
}

/**
 * O evento DELETE do Realtime só traz o `id` (REPLICA IDENTITY padrão) e não
 * respeita filtro por empresa. Por isso o id recebido nunca é confiado: só
 * serve para checar se a reserva já está nos dados desta empresa em cache.
 * Retorna true quando o id pertence a uma consulta de reservas do tenant.
 */
export function deletedIdIsInCache(qc: QueryClient, tenantId: string, id: unknown): boolean {
  if (typeof id !== "string" || !id) return false;
  return qc
    .getQueriesData({ queryKey: ["reservas", tenantId] })
    .some(([, data]) => cacheHasReservaId(data, id));
}
