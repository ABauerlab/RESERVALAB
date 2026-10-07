import type { Reserva } from "@/lib/reservations";
import { todayISO, tomorrowISO } from "@/lib/admin-dates";

/** Ação principal de uma linha de reserva. Sem novas ações: só atalhos das que já existem. */
export type MainAction = "confirmar" | "reconfirmar" | "finalizar" | null;

/**
 * Pendente -> Confirmar. Confirmada próxima (hoje ou amanhã) ainda sem reconfirmação ->
 * Reconfirmar. Demais -> nenhuma na linha.
 */
export function rowMainAction(r: Reserva): MainAction {
  if (r.status === "pendente") return "confirmar";
  if (r.status === "confirmada" && !r.reconfirmada_em && r.data && (r.data === todayISO() || r.data === tomorrowISO())) {
    return "reconfirmar";
  }
  return null;
}

export type DetailAction =
  | "confirmar" | "confirmar_sem_avisar" | "reconfirmar" | "finalizar"
  | "editar" | "cancelar" | "reativar" | "reabrir" | "excluir";

/** Ação principal do Detalhe e ações do menu "Mais", por status. */
export function detailActions(r: Reserva): { primary: DetailAction | null; more: DetailAction[] } {
  switch (r.status) {
    case "pendente":
      return { primary: "confirmar", more: ["confirmar_sem_avisar", "finalizar", "editar", "cancelar", "excluir"] };
    case "confirmada":
      return r.reconfirmada_em
        ? { primary: "finalizar", more: ["reconfirmar", "editar", "cancelar", "excluir"] }
        : { primary: "reconfirmar", more: ["finalizar", "editar", "cancelar", "excluir"] };
    case "cancelada":
      return { primary: null, more: ["reativar", "editar", "excluir"] };
    case "finalizada":
      return { primary: null, more: ["reabrir", "editar", "excluir"] };
  }
}
