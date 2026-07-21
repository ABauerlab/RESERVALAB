import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Tenant = Database["public"]["Tables"]["tenants"]["Row"];

// Fase 1: tenant único hardcoded (Iracema). Rotas /$slug entram em fase 2.
export const DEFAULT_TENANT_SLUG = "iracema";

let _cache: Tenant | null = null;

export async function getDefaultTenant(): Promise<Tenant | null> {
  if (_cache) return _cache;
  const { data } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", DEFAULT_TENANT_SLUG)
    .eq("ativo", true)
    .maybeSingle();
  _cache = data ?? null;
  return _cache;
}

export function clearTenantCache() {
  _cache = null;
}
