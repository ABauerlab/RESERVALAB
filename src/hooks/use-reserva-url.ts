import { useCallback, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Reserva } from "@/lib/reservations";

/**
 * Reserva aberta guardada na URL (`?reserva=<id>`). Abrir empurra uma entrada no historico, entao
 * o "voltar" do navegador fecha o detalhe e devolve a pessoa a mesma lista, com filtros e dia
 * intactos (eles tambem moram na URL). Fechar pelo X volta uma entrada quando foi a pessoa quem
 * abriu; num link direto, apenas limpa o parametro.
 *
 * `rota` e `params` apontam para a propria pagina; `candidatas` sao as reservas ja carregadas (a
 * busca por id so acontece quando a reserva nao esta nelas, ex.: link compartilhado).
 */
export function useReservaUrl(opts: {
  tenantId: string | null;
  reservaId: string | undefined;
  candidatas: Reserva[];
  /** Aplica a mudanca de `reserva` na busca atual da pagina. */
  navegar: (reserva: string | undefined, replace: boolean) => void;
}) {
  const { tenantId, reservaId, candidatas, navegar } = opts;
  const abertaPelaPessoa = useRef(false);

  const local = reservaId ? candidatas.find((r) => r.id === reservaId) : undefined;
  const remota = useQuery({
    enabled: !!tenantId && !!reservaId && !local,
    queryKey: ["reservas", tenantId, "por-id", reservaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservas")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("id", reservaId!)
        .maybeSingle();
      if (error) throw error;
      return (data as Reserva | null) ?? null;
    },
  });

  const selecionada = local ?? remota.data ?? null;

  const abrir = useCallback(
    (r: Reserva) => {
      abertaPelaPessoa.current = true;
      navegar(r.id, false);
    },
    [navegar],
  );
  const fechar = useCallback(() => {
    if (abertaPelaPessoa.current && window.history.length > 1) {
      abertaPelaPessoa.current = false;
      window.history.back();
    } else {
      navegar(undefined, true);
    }
  }, [navegar]);

  return { selecionada, abrir, fechar };
}

export function useNavigateReserva(from: "/$slug/admin" | "/$slug/admin/reservas", slug: string) {
  const navigate = useNavigate();
  return useCallback(
    (reserva: string | undefined, replace: boolean) => {
      navigate({
        to: from,
        params: { slug },
        search: ((prev: Record<string, unknown>) => ({ ...prev, reserva })) as never,
        replace,
      });
    },
    [navigate, from, slug],
  );
}
