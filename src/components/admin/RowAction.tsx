import { useState } from "react";

import type { Reserva } from "@/lib/reservations";
import { rowMainAction } from "@/lib/reservation-actions";
import type { useReservaActions } from "@/hooks/use-reservas-admin";
import { QuickAction } from "./QuickAction";

/** Ação principal da linha: Pendente -> Confirmar; confirmada próxima sem reconfirmação -> Reconfirmar. */
export function useRowAction(actions: ReturnType<typeof useReservaActions>) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function run(r: Reserva, fn: (r: Reserva) => Promise<void>) {
    setBusyId(r.id);
    try { await fn(r); } catch { /* o toast de erro já é disparado pela mutação */ } finally { setBusyId(null); }
  }

  return function renderAction(r: Reserva) {
    const main = rowMainAction(r);
    if (main === "confirmar") {
      return <QuickAction busy={busyId === r.id} onClick={() => run(r, actions.handleConfirm)}>Confirmar</QuickAction>;
    }
    if (main === "reconfirmar") {
      return <QuickAction busy={busyId === r.id} variant="secondary" onClick={() => run(r, actions.handleReconfirm)}>Reconfirmar</QuickAction>;
    }
    return null;
  };
}
