import { supabase } from "@/integrations/supabase/client";

/**
 * Capacidade da casa (opcional): limite de pessoas por dia e por horario. O servidor (criar_reserva)
 * e quem decide; aqui so se le o que sobra para avisar o cliente antes de enviar.
 */
export type CapacidadeDoDia = {
  /** Pessoas que ainda cabem no dia (null = sem limite diario). */
  dia_restante: number | null;
  /** Limite por horario (null = sem limite). */
  horario_maximo: number | null;
  /** Restante por horario ("19:00" -> 12). Horario sem reservas nao aparece: tem o maximo inteiro. */
  por_horario: Record<string, number>;
};

/** "120" vira 120; vazio, zero ou invalido vira null (sem limite). */
export function parseCapacidade(v: string): number | null {
  const n = Number(v.replace(/\D/g, ""));
  return Number.isFinite(n) && n >= 1 && n <= 100000 ? n : null;
}

export async function fetchCapacidadeDoDia(
  slug: string,
  data: string,
): Promise<CapacidadeDoDia | null> {
  const { data: d, error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: { _slug: string; _data: string },
    ) => PromiseLike<{ data: CapacidadeDoDia | null; error: unknown }>
  )("capacidade_do_dia", { _slug: slug, _data: data });
  if (error) throw error;
  return d ?? null;
}

/** Quantas pessoas ainda cabem no horario (Infinity = sem limite). */
export function restanteNoHorario(cap: CapacidadeDoDia | null, horario: string): number {
  if (!cap) return Number.POSITIVE_INFINITY;
  const h = horario.slice(0, 5);
  const doHorario =
    cap.horario_maximo == null
      ? Number.POSITIVE_INFINITY
      : (cap.por_horario[h] ?? cap.horario_maximo);
  const doDia = cap.dia_restante ?? Number.POSITIVE_INFINITY;
  return Math.min(doHorario, doDia);
}

export type Veredito = { ok: true } | { ok: false; motivo: "dia" | "horario" };

/** O grupo cabe? Sem horario escolhido, so olha o limite do dia. */
export function cabeNaCasa(
  cap: CapacidadeDoDia | null,
  horario: string | null,
  quantidade: number,
): Veredito {
  if (!cap) return { ok: true };
  if (cap.dia_restante != null && quantidade > cap.dia_restante)
    return { ok: false, motivo: "dia" };
  if (horario && cap.horario_maximo != null) {
    const resta = cap.por_horario[horario.slice(0, 5)] ?? cap.horario_maximo;
    if (quantidade > resta) return { ok: false, motivo: "horario" };
  }
  return { ok: true };
}
