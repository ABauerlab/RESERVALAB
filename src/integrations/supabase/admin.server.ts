// Cliente admin (service role) resiliente: lê as variáveis provisionadas pelo
// Lovable Cloud tanto de process.env quanto de import.meta.env, e aceita os
// nomes alternativos usados em build/preview. Nunca cacheia cliente inválido.
import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function readEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const fromProcess = typeof process !== "undefined" ? process.env?.[name] : undefined;
    if (fromProcess) return fromProcess;

    const fromMeta = import.meta.env?.[name];
    if (fromMeta) return fromMeta;
  }
  return undefined;
}

let cached: ReturnType<typeof createClient<Database>> | undefined;

/** Chame SEMPRE dentro do handler do server function. */
export function getSupabaseAdmin() {
  if (cached) return cached;

  const url = readEnv("SUPABASE_URL", "VITE_SUPABASE_URL");
  const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY", "SUPABASE_SECRET_KEYS");

  if (!url || !serviceKey) {
    const missing = [
      ...(!url ? ["SUPABASE_URL"] : []),
      ...(!serviceKey ? ["SUPABASE_SERVICE_ROLE_KEY"] : []),
    ].join(", ");
    throw new Error(`Backend indisponível no servidor (${missing}). Publique novamente o app para aplicar as chaves.`);
  }

  cached = createClient<Database>(url, serviceKey, {
    global: { fetch: createSupabaseFetch(serviceKey) },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
