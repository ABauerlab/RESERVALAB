import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { addDaysISO, todayISO } from "@/lib/admin-dates";
import {
  FILTROS_PADRAO,
  buildAgendaDia,
  buildWeekStrip,
  resolveSelectedDay,
  weekRange,
  type AgendaFiltros,
} from "@/lib/agenda";
import {
  fetchBloqueiosIntervalo,
  fetchEventosIntervalo,
  fetchFeriadosIntervalo,
  fetchReservasIntervalo,
} from "@/lib/agenda-queries";

const ROUTE = "/$slug/admin/agenda" as const;

/**
 * Dia selecionado guardado na URL (`?dia=YYYY-MM-DD`). Sem parâmetro ou com data inválida,
 * cai em hoje. Refresh e deep link preservam o dia.
 */
export function useAgendaDia(slug: string) {
  const search = useSearch({ from: ROUTE });
  const navigate = useNavigate();
  const selectedDay = resolveSelectedDay(search.dia);

  const selectDay = useCallback(
    (iso: string) => {
      navigate({ to: ROUTE, params: { slug }, search: { dia: iso } });
    },
    [navigate, slug],
  );

  return {
    selectedDay,
    selectDay,
    goToday: () => selectDay(todayISO()),
    shiftDay: (n: number) => selectDay(addDaysISO(selectedDay, n)),
    shiftWeek: (n: number) => selectDay(addDaysISO(selectedDay, 7 * n)),
  };
}

/**
 * Dados da Agenda para a semana (segunda a domingo) do dia selecionado.
 * Somente leitura. As chaves de reservas começam com ["reservas", tenantId] para que o
 * realtime existente (e as mutações da F1) as invalidem sem código novo.
 */
export function useAgendaData(ready: boolean, tenantId: string | null, selectedDay: string) {
  const range = useMemo(() => weekRange(selectedDay), [selectedDay]);
  const enabled = ready && !!tenantId;
  const { weekStart, weekEnd } = range;

  const reservasQ = useQuery({
    enabled,
    queryKey: ["reservas", tenantId, "agenda-semana", weekStart, weekEnd],
    queryFn: () => fetchReservasIntervalo(supabase, tenantId!, weekStart, weekEnd),
  });
  const bloqueiosQ = useQuery({
    enabled,
    queryKey: ["agenda-bloqueios", tenantId, weekStart, weekEnd],
    queryFn: () => fetchBloqueiosIntervalo(supabase, tenantId!, weekStart, weekEnd),
  });
  const feriadosQ = useQuery({
    enabled,
    queryKey: ["agenda-feriados", tenantId, weekStart, weekEnd],
    queryFn: () => fetchFeriadosIntervalo(supabase, tenantId!, weekStart, weekEnd),
  });
  const eventosQ = useQuery({
    enabled,
    queryKey: ["agenda-eventos", tenantId, weekStart, weekEnd],
    queryFn: () => fetchEventosIntervalo(supabase, tenantId!, weekStart, weekEnd),
  });

  return { range, reservasQ, bloqueiosQ, feriadosQ, eventosQ };
}

/**
 * Modelo completo da Agenda: faixa da semana + dia em linha do tempo + filtros.
 * É a base para F2.2 a F2.4; não renderiza nada. Ações (confirmar, reconfirmar, editar,
 * cancelar) continuam sendo as da F1 (`useReservaActions`, `useRowAction`, `ReservaDetail`).
 */
export function useAgenda(slug: string, ready: boolean, tenantId: string | null) {
  const dia = useAgendaDia(slug);
  const { range, reservasQ, bloqueiosQ, feriadosQ, eventosQ } = useAgendaData(
    ready,
    tenantId,
    dia.selectedDay,
  );
  const [filtros, setFiltros] = useState<AgendaFiltros>(FILTROS_PADRAO);

  const reservas = useMemo(() => reservasQ.data?.reservas ?? [], [reservasQ.data]);
  const bloqueios = useMemo(() => bloqueiosQ.data ?? [], [bloqueiosQ.data]);
  const feriados = useMemo(() => feriadosQ.data ?? [], [feriadosQ.data]);
  const eventos = useMemo(() => eventosQ.data ?? [], [eventosQ.data]);

  const semana = useMemo(
    () => buildWeekStrip({ range, reservas, bloqueios, feriados, eventos }),
    [range, reservas, bloqueios, feriados, eventos],
  );
  const agendaDia = useMemo(
    () => buildAgendaDia({ dia: dia.selectedDay, reservas, bloqueios, feriados, eventos, filtros }),
    [dia.selectedDay, reservas, bloqueios, feriados, eventos, filtros],
  );

  return {
    ...dia,
    range,
    semana,
    agendaDia,
    filtros,
    setSoAtencao: (v: boolean) => setFiltros((f) => ({ ...f, soAtencao: v })),
    setMostrarCanceladas: (v: boolean) => setFiltros((f) => ({ ...f, mostrarCanceladas: v })),
    loading:
      reservasQ.isLoading || bloqueiosQ.isLoading || feriadosQ.isLoading || eventosQ.isLoading,
    error: reservasQ.isError || bloqueiosQ.isError || feriadosQ.isError || eventosQ.isError,
    /** A consulta da semana bateu no teto de reservas; a contagem pode estar incompleta. */
    truncado: reservasQ.data?.truncado ?? false,
    refetch: () => {
      reservasQ.refetch();
      bloqueiosQ.refetch();
      feriadosQ.refetch();
      eventosQ.refetch();
    },
  };
}
