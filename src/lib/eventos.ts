import { supabase } from "@/integrations/supabase/client";

export type EventoPublico = {
  titulo: string;
  descricao: string | null;
  data: string;
  horario: string | null;
  imagem_url: string | null;
  imagem_largura?: number | null;
  imagem_altura?: number | null;
};

/**
 * Proximo evento em destaque da empresa. Usa a funcao com o tamanho do flyer; se ela ainda nao
 * existir neste banco, cai na anterior (sem tamanho).
 */
export async function fetchProximoEvento(slug: string): Promise<EventoPublico | null> {
  const nova = await (
    supabase.rpc as unknown as (
      fn: string,
      args: { _slug: string },
    ) => PromiseLike<{ data: EventoPublico[] | null; error: unknown }>
  )("evento_destaque_do_tenant", { _slug: slug });
  if (!nova.error) return nova.data?.[0] ?? null;
  const { data, error } = await supabase.rpc("proximo_evento_do_tenant", { _slug: slug });
  if (error) throw error;
  return ((Array.isArray(data) ? data[0] : null) as EventoPublico | null) ?? null;
}
