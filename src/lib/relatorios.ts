import type { Reserva, ReservaStatus, ReservaTipo } from "@/lib/reservations";
import { STATUS_LIST } from "@/lib/reservations";
import { weekdayIndexISO } from "@/lib/datetime";

export const TIPOS_RELATORIO: ReservaTipo[] = ["mesa", "aniversario", "evento", "casamento"];

export type Relatorio = {
  total: number;
  porStatus: Record<ReservaStatus, number>;
  porTipo: Record<ReservaTipo, number>;
  /** Pessoas de reservas confirmadas ou finalizadas. */
  pessoasAtendidas: number;
  /** Confirmadas + finalizadas sobre o total, em %. */
  taxaConfirmacao: number;
  /** Reservas não canceladas por dia da semana da data reservada (0 = domingo). */
  porDiaSemana: number[];
  /** Reservas não canceladas por hora cheia, só as que têm horário. */
  porHora: Array<{ hora: number; reservas: number }>;
  semHorario: number;
  /** Motivos de cancelamento informados, mais frequentes primeiro. */
  motivos: Array<{ motivo: string; total: number }>;
};

export function buildRelatorio(reservas: Reserva[]): Relatorio {
  const porStatus = Object.fromEntries(STATUS_LIST.map((s) => [s, 0])) as Record<
    ReservaStatus,
    number
  >;
  const porTipo = Object.fromEntries(TIPOS_RELATORIO.map((t) => [t, 0])) as Record<
    ReservaTipo,
    number
  >;
  const porDiaSemana = Array.from({ length: 7 }, () => 0);
  const horas = new Map<number, number>();
  const motivos = new Map<string, { motivo: string; total: number }>();
  let pessoasAtendidas = 0;
  let semHorario = 0;

  for (const r of reservas) {
    porStatus[r.status] += 1;
    porTipo[r.tipo] += 1;
    if (r.status === "confirmada" || r.status === "finalizada") {
      pessoasAtendidas += r.quantidade ?? 0;
    }
    if (r.status === "cancelada") {
      const m = r.motivo_cancelamento?.trim();
      if (m) {
        const k = m.toLowerCase();
        const atual = motivos.get(k);
        if (atual) atual.total += 1;
        else motivos.set(k, { motivo: m, total: 1 });
      }
      continue;
    }
    if (r.data) porDiaSemana[weekdayIndexISO(r.data)] += 1;
    if (r.horario) {
      const h = Number(r.horario.slice(0, 2));
      horas.set(h, (horas.get(h) ?? 0) + 1);
    } else {
      semHorario += 1;
    }
  }

  const total = reservas.length;
  const taxaConfirmacao =
    total > 0 ? Math.round(((porStatus.confirmada + porStatus.finalizada) / total) * 100) : 0;

  return {
    total,
    porStatus,
    porTipo,
    pessoasAtendidas,
    taxaConfirmacao,
    porDiaSemana,
    porHora: Array.from(horas.entries())
      .map(([hora, n]) => ({ hora, reservas: n }))
      .sort((a, b) => a.hora - b.hora),
    semHorario,
    motivos: Array.from(motivos.values())
      .sort((a, b) => b.total - a.total || a.motivo.localeCompare(b.motivo))
      .slice(0, 5),
  };
}
