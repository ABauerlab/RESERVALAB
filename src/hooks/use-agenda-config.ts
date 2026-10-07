import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/datetime";

/**
 * Gestão de bloqueios e feriados da Agenda. Código movido sem alteração de regra da página
 * anterior (mesmas consultas, mesmas mutações, mesmas mensagens). A única adição: ao mudar,
 * também invalida as consultas por intervalo da nova Agenda.
 */
export function useAgendaConfig(tenantId: string | null) {
  const qc = useQueryClient();

  const [data, setData] = useState("");
  const [diaTodo, setDiaTodo] = useState(true);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [motivo, setMotivo] = useState("");

  const bloqueiosQ = useQuery({
    enabled: !!tenantId,
    queryKey: ["bloqueios-admin", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agenda_bloqueios")
        .select("*")
        .eq("tenant_id", tenantId!)
        .gte("data", todayISO())
        .order("data", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const criar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("agenda_bloqueios").insert({
        tenant_id: tenantId!,
        data,
        hora_inicio: diaTodo ? null : horaInicio || null,
        hora_fim: diaTodo ? null : horaFim || null,
        motivo: motivo.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bloqueio adicionado.");
      setData("");
      setHoraInicio("");
      setHoraFim("");
      setMotivo("");
      setDiaTodo(true);
      qc.invalidateQueries({ queryKey: ["bloqueios-admin", tenantId] });
      qc.invalidateQueries({ queryKey: ["agenda-bloqueios", tenantId] });
    },
    onError: () => toast.error("Não foi possível adicionar o bloqueio."),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agenda_bloqueios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bloqueio removido.");
      qc.invalidateQueries({ queryKey: ["bloqueios-admin", tenantId] });
      qc.invalidateQueries({ queryKey: ["agenda-bloqueios", tenantId] });
    },
    onError: () => toast.error("Não foi possível remover."),
  });

  const podeCriar =
    !!data && (diaTodo || (!!horaInicio && (!horaFim || horaFim > horaInicio))) && !criar.isPending;

  const [feriadoData, setFeriadoData] = useState("");
  const [feriadoMotivo, setFeriadoMotivo] = useState("");

  const feriadosQ = useQuery({
    enabled: !!tenantId,
    queryKey: ["feriados-admin", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feriados")
        .select("*")
        .eq("tenant_id", tenantId!)
        .gte("data", todayISO())
        .order("data", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const criarFeriado = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("feriados").insert({
        tenant_id: tenantId!,
        data: feriadoData,
        motivo: feriadoMotivo.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feriado adicionado.");
      setFeriadoData("");
      setFeriadoMotivo("");
      qc.invalidateQueries({ queryKey: ["feriados-admin", tenantId] });
      qc.invalidateQueries({ queryKey: ["agenda-feriados", tenantId] });
    },
    onError: (err: { code?: string }) => {
      if (err?.code === "23505") toast.error("Essa data já está marcada como feriado.");
      else toast.error("Não foi possível adicionar o feriado.");
    },
  });

  const removerFeriado = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("feriados").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feriado removido.");
      qc.invalidateQueries({ queryKey: ["feriados-admin", tenantId] });
      qc.invalidateQueries({ queryKey: ["agenda-feriados", tenantId] });
    },
    onError: () => toast.error("Não foi possível remover."),
  });

  const podeCriarFeriado = !!feriadoData && !criarFeriado.isPending;

  return {
    // bloqueios
    data,
    setData,
    diaTodo,
    setDiaTodo,
    horaInicio,
    setHoraInicio,
    horaFim,
    setHoraFim,
    motivo,
    setMotivo,
    bloqueiosQ,
    criar,
    remover,
    podeCriar,
    // feriados
    feriadoData,
    setFeriadoData,
    feriadoMotivo,
    setFeriadoMotivo,
    feriadosQ,
    criarFeriado,
    removerFeriado,
    podeCriarFeriado,
  };
}
