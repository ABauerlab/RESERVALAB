import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Tenant = Database["public"]["Tables"]["tenants"]["Row"];

const _cache = new Map<string, Tenant | null>();

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const key = slug.toLowerCase();
  if (_cache.has(key)) return _cache.get(key) ?? null;
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", key)
    .eq("ativo", true)
    .maybeSingle();
  if (error) {
    // Erro de consulta (ex.: Supabase mal configurado) não deve ser
    // confundido com "empresa não encontrada", nem ficar em cache.
    console.error(`[tenant] Falha ao buscar "${key}":`, error.message);
    return null;
  }
  _cache.set(key, data ?? null);
  return data ?? null;
}

export function clearTenantCache(slug?: string) {
  if (slug) _cache.delete(slug.toLowerCase());
  else _cache.clear();
}

/**
 * Usada so no servidor para decidir o status HTTP 404: `false` apenas quando a consulta funcionou e
 * nao existe empresa ativa com o slug. Falha de consulta devolve `true` (nao derruba pagina valida).
 */
export async function tenantExiste(slug: string): Promise<boolean> {
  const key = slug.toLowerCase();
  const { data, error } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", key)
    .eq("ativo", true)
    .maybeSingle();
  if (error) return true;
  return !!data;
}
