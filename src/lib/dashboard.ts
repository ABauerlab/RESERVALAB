import { telefoneToWhatsApp, type Reserva } from "@/lib/reservations";

/**
 * Calculos do Dashboard (Hoje). Tudo parte de reservas reais: nenhuma metrica inventada.
 */

export type ResumoDoDia = {
  reservas: number;
  pessoas: number;
  pendentes: number;
  canceladas: number;
  /** Proxima chegada: a primeira ativa com horario a partir de agora (hoje) ou do dia (outros dias). */
  proxima: Reserva | null;
  /** Quantas ativas ainda faltam chegar (so faz sentido para hoje). */
  restantes: number;
};

const ativa = (r: Reserva) => r.status !== "cancelada";

export function resumoDoDia(
  reservas: Reserva[],
  dia: string,
  hoje: string,
  agora: string,
): ResumoDoDia {
  const ativas = reservas.filter(ativa);
  const comHorario = ativas
    .filter((r) => !!r.horario)
    .sort((a, b) => (a.horario ?? "").localeCompare(b.horario ?? ""));
  const futuras =
    dia === hoje ? comHorario.filter((r) => (r.horario ?? "").slice(0, 5) >= agora) : comHorario;
  return {
    reservas: ativas.length,
    pessoas: ativas.reduce((n, r) => n + (r.quantidade ?? 0), 0),
    pendentes: ativas.filter((r) => r.status === "pendente").length,
    canceladas: reservas.length - ativas.length,
    proxima: futuras[0] ?? null,
    restantes: dia === hoje ? futuras.length : ativas.length,
  };
}

export type HistoricoItem = Pick<Reserva, "telefone" | "data" | "status">;

export type ClienteDeCasa = {
  reserva: Reserva;
  /** Reservas anteriores (nao canceladas) do mesmo telefone. */
  anteriores: number;
};

/**
 * Quem chega no dia e ja reservou antes. `minimo` define "cliente de casa" (padrao: 2 ou mais
 * reservas anteriores). Telefones sao comparados normalizados (so digitos, com 55).
 */
export function clientesDeCasa(
  doDia: Reserva[],
  historico: HistoricoItem[],
  dia: string,
  minimo = 2,
): ClienteDeCasa[] {
  const contagem = new Map<string, number>();
  for (const h of historico) {
    if (h.status === "cancelada" || !h.data || h.data >= dia) continue;
    const k = telefoneToWhatsApp(h.telefone);
    if (k) contagem.set(k, (contagem.get(k) ?? 0) + 1);
  }
  const vistos = new Set<string>();
  const out: ClienteDeCasa[] = [];
  for (const r of doDia.filter(ativa)) {
    const k = telefoneToWhatsApp(r.telefone);
    if (!k || vistos.has(k)) continue;
    const n = contagem.get(k) ?? 0;
    if (n >= minimo) {
      vistos.add(k);
      out.push({ reserva: r, anteriores: n });
    }
  }
  return out.sort((a, b) => b.anteriores - a.anteriores).slice(0, 5);
}
