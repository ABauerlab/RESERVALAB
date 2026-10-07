import type { Database } from "@/integrations/supabase/types";
import { addDaysISO, todayISO, weekdayLabel } from "@/lib/admin-dates";
import { rowMainAction } from "@/lib/reservation-actions";
import { formatHorario, type Reserva } from "@/lib/reservations";

/**
 * Fundação da Agenda (F2.1): funções puras de data, agrupamento e contexto.
 *
 * A Agenda representa TEMPO + RESERVAS + CONTEXTO OPERACIONAL. Nada aqui calcula
 * capacidade, ocupação, disponibilidade, mesas ou lotação.
 */

export type Bloqueio = Database["public"]["Tables"]["agenda_bloqueios"]["Row"];
export type Feriado = Database["public"]["Tables"]["feriados"]["Row"];
export type EventoDestaque = Database["public"]["Tables"]["eventos_destaque"]["Row"];

/* ---------- Datas ---------- */

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Valida `YYYY-MM-DD` (data real). Devolve a própria string ou null. */
export function parseDiaParam(value: unknown): string | null {
  if (typeof value !== "string" || !ISO_RE.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const ok = dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  return ok ? value : null;
}

/** Índice do dia com segunda = 0 e domingo = 6. */
export function mondayIndex(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export type WeekRange = {
  selectedDay: string;
  weekStart: string; // segunda
  weekEnd: string; // domingo
  days: string[]; // 7 datas, segunda a domingo
};

/** Semana de segunda a domingo que contém `selectedDay`. */
export function weekRange(selectedDay: string): WeekRange {
  const weekStart = addDaysISO(selectedDay, -mondayIndex(selectedDay));
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i));
  return { selectedDay, weekStart, weekEnd: days[6], days };
}

/**
 * Dia selecionado a partir do `?dia=`. Sem parâmetro (ou inválido), usa `fallback`.
 * `fallback` padrão é `todayISO()`, mantido como está (UTC) até a correção central.
 */
export function resolveSelectedDay(dia: unknown, fallback: string = todayISO()): string {
  return parseDiaParam(dia) ?? fallback;
}

/** Mesmo texto da gestão de bloqueios: dia inteiro, faixa, "a partir das" ou "até as". */
export function descreverBloqueio(b: Pick<Bloqueio, "hora_inicio" | "hora_fim">): string {
  if (b.hora_inicio && b.hora_fim)
    return `Das ${formatHorario(b.hora_inicio)} às ${formatHorario(b.hora_fim)}`;
  if (b.hora_inicio) return `A partir das ${formatHorario(b.hora_inicio)}`;
  if (b.hora_fim) return `Até as ${formatHorario(b.hora_fim)}`;
  return "Dia inteiro";
}

/* ---------- Regras de leitura (texto, nunca capacidade) ---------- */

export type GrupoLabel = "Grupo grande" | "Evento fechado";

/** Mais de 50 pessoas: "Evento fechado". Mais de 30: "Grupo grande". Só informação textual. */
export function grupoLabel(quantidade: number | null | undefined): GrupoLabel | null {
  if (quantidade == null) return null;
  if (quantidade > 50) return "Evento fechado";
  if (quantidade > 30) return "Grupo grande";
  return null;
}

/**
 * Mesma semântica do servidor (`criar_reserva`): bloqueio sem hora cobre o dia inteiro;
 * com faixa, cobre `horario` entre `hora_inicio` (padrão 00:00) e `hora_fim` (padrão 23:59),
 * incluindo as duas pontas. Reserva sem horário só é coberta por bloqueio de dia inteiro.
 */
export function bloqueioCobre(
  b: Pick<Bloqueio, "data" | "hora_inicio" | "hora_fim">,
  data: string | null,
  horario: string | null,
): boolean {
  if (!data || b.data !== data) return false;
  if (!b.hora_inicio && !b.hora_fim) return true;
  if (!horario) return false;
  const t = horario.slice(0, 5);
  const ini = (b.hora_inicio ?? "00:00").slice(0, 5);
  const fim = (b.hora_fim ?? "23:59").slice(0, 5);
  return t >= ini && t <= fim;
}

/** Reserva ativa (pendente ou confirmada) dentro de um bloqueio. Apenas informativo. */
export function reservaDentroDeBloqueio(
  r: Pick<Reserva, "data" | "horario" | "status">,
  bloqueios: Pick<Bloqueio, "data" | "hora_inicio" | "hora_fim">[],
): boolean {
  if (r.status === "cancelada" || r.status === "finalizada") return false;
  return bloqueios.some((b) => bloqueioCobre(b, r.data, r.horario));
}

/**
 * "Precisa de atenção" usa só estados que o produto já tem: pendente, confirmada próxima
 * sem reconfirmação (a mesma regra do Hoje) e reserva dentro de bloqueio.
 */
export function precisaAtencao(r: Reserva, dentroBloqueio: boolean): boolean {
  if (r.status === "cancelada" || r.status === "finalizada") return false;
  return r.status === "pendente" || rowMainAction(r) === "reconfirmar" || dentroBloqueio;
}

/* ---------- Modelo do dia ---------- */

export type AgendaFiltros = {
  /** Mostra apenas reservas que pedem atenção. */
  soAtencao: boolean;
  /** Inclui reservas canceladas nas listas. */
  mostrarCanceladas: boolean;
};

export const FILTROS_PADRAO: AgendaFiltros = { soAtencao: false, mostrarCanceladas: false };

export type AgendaReserva = {
  reserva: Reserva;
  dentroBloqueio: boolean;
  grupo: GrupoLabel | null;
  atencao: boolean;
};

export type HoraGroup = {
  /** Hora cheia ("19"), usada só para agrupar. O horário real de cada reserva não muda. */
  hora: string;
  label: string; // "19h"
  items: AgendaReserva[];
  /** Reservas e pessoas do grupo, sem contar canceladas. Contagem, nunca ocupação. */
  reservas: number;
  pessoas: number;
};

export type DiaResumo = {
  reservas: number;
  pessoas: number;
  pendentes: number;
  canceladas: number;
  /** Reservas ativas que pedem atenção no dia (independe dos filtros). */
  atencao: number;
  /** Reservas ativas dentro de bloqueio no dia (informativo). */
  dentroBloqueio: number;
};

export type DiaContexto = {
  bloqueios: Bloqueio[];
  feriado: Feriado | null;
  eventos: EventoDestaque[];
};

export type AgendaDia = {
  dia: string;
  resumo: DiaResumo;
  horas: HoraGroup[];
  /** Reservas com data mas sem horário. Nunca recebem horário artificial. */
  semHorario: AgendaReserva[];
  contexto: DiaContexto;
};

function porHorarioEntao(a: Reserva, b: Reserva): number {
  const ha = a.horario ?? "99:99:99";
  const hb = b.horario ?? "99:99:99";
  if (ha !== hb) return ha < hb ? -1 : 1;
  // Mesma ordenação das listas: mais recente primeiro dentro do mesmo horário.
  return a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0;
}

const naoCancelada = (r: Reserva) => r.status !== "cancelada";
const pessoasDe = (r: Reserva) => r.quantidade ?? 0;

/**
 * Organiza as reservas de UM dia por hora cheia, sem arredondar nem mover horários.
 * `reservas` pode conter outros dias; só as do `dia` entram.
 */
export function buildAgendaDia(input: {
  dia: string;
  reservas: Reserva[];
  bloqueios: Bloqueio[];
  feriados: Feriado[];
  eventos: EventoDestaque[];
  filtros?: AgendaFiltros;
}): AgendaDia {
  const { dia, filtros = FILTROS_PADRAO } = input;
  const doDia = input.reservas.filter((r) => r.data === dia);
  const bloqueiosDia = input.bloqueios.filter((b) => b.data === dia);

  const mapeadas: AgendaReserva[] = doDia
    .filter((r) => filtros.mostrarCanceladas || naoCancelada(r))
    .sort(porHorarioEntao)
    .map((reserva) => {
      const dentroBloqueio = reservaDentroDeBloqueio(reserva, bloqueiosDia);
      return {
        reserva,
        dentroBloqueio,
        grupo: grupoLabel(reserva.quantidade),
        atencao: precisaAtencao(reserva, dentroBloqueio),
      };
    });
  const ativas = doDia.filter(naoCancelada);

  const resumo: DiaResumo = {
    reservas: ativas.length,
    pessoas: ativas.reduce((n, r) => n + pessoasDe(r), 0),
    pendentes: doDia.filter((r) => r.status === "pendente").length,
    canceladas: doDia.length - ativas.length,
    atencao: mapeadas.filter((x) => naoCancelada(x.reserva) && x.atencao).length,
    dentroBloqueio: mapeadas.filter((x) => naoCancelada(x.reserva) && x.dentroBloqueio).length,
  };

  const visiveis = mapeadas.filter((x) => !filtros.soAtencao || x.atencao);

  const horas: HoraGroup[] = [];
  const semHorario: AgendaReserva[] = [];
  for (const item of visiveis) {
    const h = item.reserva.horario;
    if (!h) {
      semHorario.push(item);
      continue;
    }
    const hora = h.slice(0, 2);
    let g = horas[horas.length - 1];
    if (!g || g.hora !== hora) {
      g = { hora, label: `${hora}h`, items: [], reservas: 0, pessoas: 0 };
      horas.push(g);
    }
    g.items.push(item);
    if (naoCancelada(item.reserva)) {
      g.reservas += 1;
      g.pessoas += pessoasDe(item.reserva);
    }
  }

  return {
    dia,
    resumo,
    horas,
    semHorario,
    contexto: {
      bloqueios: bloqueiosDia,
      feriado: input.feriados.find((f) => f.data === dia) ?? null,
      eventos: input.eventos.filter((e) => e.data === dia),
    },
  };
}

/* ---------- Faixa da semana ---------- */

export type WeekDayInfo = {
  iso: string;
  /** "seg", "ter", ... */
  weekday: string;
  /** Número do dia no mês, sem zero à esquerda. */
  dayNumber: number;
  selected: boolean;
  hoje: boolean;
  /** Reservas e pessoas do dia, sem canceladas. Só contagem. */
  reservas: number;
  pessoas: number;
  pendentes: number;
  bloqueio: boolean;
  feriado: boolean;
  evento: boolean;
  /** Reservas ativas dentro de bloqueio no dia (informativo). */
  dentroBloqueio: number;
};

/** Um item por dia da semana, para a faixa semanal. Operacional e simples, sem ocupação. */
export function buildWeekStrip(input: {
  range: WeekRange;
  reservas: Reserva[];
  bloqueios: Bloqueio[];
  feriados: Feriado[];
  eventos: EventoDestaque[];
  hoje?: string;
}): WeekDayInfo[] {
  const hoje = input.hoje ?? todayISO();
  return input.range.days.map((iso) => {
    const ativas = input.reservas.filter((r) => r.data === iso && naoCancelada(r));
    const bloqueiosDia = input.bloqueios.filter((b) => b.data === iso);
    return {
      iso,
      weekday: weekdayLabel(iso, true),
      dayNumber: Number(iso.slice(8, 10)),
      selected: iso === input.range.selectedDay,
      hoje: iso === hoje,
      reservas: ativas.length,
      pessoas: ativas.reduce((n, r) => n + pessoasDe(r), 0),
      pendentes: ativas.filter((r) => r.status === "pendente").length,
      bloqueio: bloqueiosDia.length > 0,
      feriado: input.feriados.some((f) => f.data === iso),
      evento: input.eventos.some((e) => e.data === iso),
      dentroBloqueio: ativas.filter((r) => reservaDentroDeBloqueio(r, bloqueiosDia)).length,
    };
  });
}
