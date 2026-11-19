import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { parseIaEstado, type IaWhatsappEstado } from "@/lib/ia-whatsapp";

/**
 * Liga/desliga a atendente de WhatsApp (Dona Iracema): no WhatsApp inteiro ou numa conversa só.
 * Desligada, ela não responde nada: nem conversa, nem confirmação ou cancelamento por mensagem.
 */
export function useIaWhatsapp(slug: string) {
  const qc = useQueryClient();
  const key = ["ia-whatsapp", slug];

  const estadoQ = useQuery({
    queryKey: key,
    queryFn: async (): Promise<IaWhatsappEstado> => {
      const { data, error } = await supabase.rpc("ia_whatsapp_estado", { _slug: slug });
      if (error) throw error;
      return parseIaEstado(data);
    },
  });

  const atualizar = (data: unknown) => qc.setQueryData(key, parseIaEstado(data));
  const falhou = () => toast.error("Não foi possível salvar. Tente novamente.");

  const definirGlobal = useMutation({
    mutationFn: async (ativo: boolean) => {
      const { data, error } = await supabase.rpc("ia_whatsapp_definir_global", {
        _slug: slug,
        _ativo: ativo,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const e = parseIaEstado(data);
      atualizar(data);
      toast.success(e.ativo ? "Atendente de WhatsApp ligada" : "Atendente de WhatsApp desligada");
    },
    onError: falhou,
  });

  const definirConversa = useMutation({
    mutationFn: async (v: { telefone: string; pausado: boolean; horas?: number | null }) => {
      const { data, error } = await supabase.rpc("ia_whatsapp_definir_conversa", {
        _slug: slug,
        _telefone: v.telefone,
        _pausado: v.pausado,
        ...(v.horas ? { _horas: v.horas } : {}),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, v) => {
      atualizar(data);
      toast.success(v.pausado ? "IA pausada nesta conversa" : "IA religada nesta conversa");
    },
    onError: falhou,
  });

  return { estadoQ, estado: estadoQ.data, definirGlobal, definirConversa };
}
