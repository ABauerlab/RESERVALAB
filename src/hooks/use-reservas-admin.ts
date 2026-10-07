import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  TIPO_SHORT,
  formatData,
  formatHorario,
  telefoneToWhatsApp,
  type Reserva,
  type ReservaStatus,
  type ReservaUpdate,
} from "@/lib/reservations";
import { getTenantBySlug } from "@/lib/tenant";
import { buildMensagemReconfirmacao, whatsappUrl } from "@/lib/confirmacao";
import { showNotification } from "@/lib/pwa";

/**
 * Realtime das reservas da empresa. Lógica idêntica à que vivia em
 * `$slug.admin.index.tsx`: invalida as mesmas chaves e avisa nova reserva.
 */
export function useReservasRealtime(ready: boolean, tenantId: string | null) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!ready || !tenantId) return;
    const channel = supabase
      .channel(`reservas-admin-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reservas",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const r = payload.new as Reserva;
          qc.invalidateQueries({ queryKey: ["reservas", tenantId] });
          qc.invalidateQueries({ queryKey: ["reservas-stats", tenantId] });
          qc.invalidateQueries({ queryKey: ["novas-reservas", tenantId] });
          const line = `${TIPO_SHORT[r.tipo]} • ${r.quantidade ?? "?"} pessoas • ${formatData(r.data)}${r.horario ? ` às ${formatHorario(r.horario)}` : ""}`;
          toast.success(`Nova reserva — ${r.nome}`, { description: line });
          showNotification(`Nova reserva — ${r.nome}`, line);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "reservas",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["reservas", tenantId] });
          qc.invalidateQueries({ queryKey: ["reservas-stats", tenantId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [ready, tenantId, qc]);
}

/**
 * Mutações e handlers das reservas (confirmar, reconfirmar, cancelar, editar,
 * excluir). Movidos sem alteração de regra de `$slug.admin.index.tsx` para serem
 * reutilizados por Hoje e Reservas.
 */
export function useReservaActions(
  slug: string,
  tenantId: string | null,
  hooks?: {
    onPatched?: (id: string, patch: Partial<Reserva>) => void;
    onDeleted?: () => void;
  },
) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["reservas", tenantId] });
    qc.invalidateQueries({ queryKey: ["reservas-stats", tenantId] });
  };

  const updateReserva = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ReservaUpdate }) => {
      const { error } = await supabase.from("reservas").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      invalidate();
      hooks?.onPatched?.(vars.id, vars.patch as Partial<Reserva>);
    },
    onError: () => toast.error("Não foi possível atualizar."),
  });

  const deleteReserva = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reservas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reserva excluída.");
      invalidate();
      hooks?.onDeleted?.();
    },
    onError: () => toast.error("Não foi possível excluir."),
  });

  const confirmarSemNotificar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("confirmar_reserva_sem_notificar", { _id: id });
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      invalidate();
      hooks?.onPatched?.(id, { status: "confirmada" });
      toast.success("Reserva confirmada sem avisar o cliente.");
    },
    onError: () => toast.error("Não foi possível confirmar."),
  });

  async function handleConfirm(r: Reserva) {
    // A confirmação no WhatsApp é enviada automaticamente pelo backend
    // (trigger no banco) assim que o status muda para "confirmada" — não
    // abrimos mais o WhatsApp manualmente aqui, pra não duplicar a mensagem.
    await updateReserva.mutateAsync({ id: r.id, patch: { status: "confirmada" } });
    toast.success("Reserva confirmada. O cliente recebe a confirmação automaticamente.");
  }

  async function handleConfirmSemNotificar(r: Reserva) {
    await confirmarSemNotificar.mutateAsync(r.id);
  }

  async function handleReconfirm(r: Reserva) {
    await updateReserva.mutateAsync({
      id: r.id,
      patch: { reconfirmada_em: new Date().toISOString() },
    });
    toast.success("Reconfirmação enviada.");
    const tenant = await getTenantBySlug(slug);
    const numero = telefoneToWhatsApp(r.telefone);
    if (!numero) return;
    const msg = buildMensagemReconfirmacao(tenant?.mensagem_reconfirmacao, {
      reserva: r,
      empresaNome: tenant?.nome ?? "",
      endereco: tenant?.endereco,
      telefoneEmpresa: tenant?.telefone_contato,
      linkAcompanhar: `${window.location.origin}/${slug}/acompanhar/${r.codigo_acompanhamento}`,
    });
    window.open(whatsappUrl(numero, msg), "_blank", "noopener");
  }

  async function handleCancel(r: Reserva, motivo: string) {
    // A mensagem de cancelamento é enviada automaticamente pelo backend
    // (trigger no banco) quando o status muda para "cancelada".
    await updateReserva.mutateAsync({
      id: r.id,
      patch: { status: "cancelada", motivo_cancelamento: motivo || null },
    });
    toast.success("Reserva cancelada. O cliente recebe o aviso automaticamente.");
  }

  function handleSetStatus(r: Reserva, status: ReservaStatus) {
    updateReserva.mutate({ id: r.id, patch: { status } });
  }

  function handleDelete(r: Reserva) {
    deleteReserva.mutate(r.id);
  }

  const pending =
    updateReserva.isPending || deleteReserva.isPending || confirmarSemNotificar.isPending;

  return {
    updateReserva,
    deleteReserva,
    confirmarSemNotificar,
    handleConfirm,
    handleConfirmSemNotificar,
    handleReconfirm,
    handleCancel,
    handleSetStatus,
    handleDelete,
    pending,
  };
}
