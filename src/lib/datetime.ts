/**
 * Fonte unica de "hoje" e "agora" do Teggly. O fuso oficial do produto e
 * America/Sao_Paulo: datas e horarios das reservas sao relogio de parede da casa
 * (colunas date/time sem fuso), entao "hoje" nao pode depender do fuso do
 * navegador nem do servidor (que roda em UTC).
 */
export const APP_TIMEZONE = "America/Sao_Paulo";

type Partes = { ano: number; mes: number; dia: number; hora: number; minuto: number };

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** Componentes de data e hora de um instante, no fuso do produto. */
export function partesNoFuso(instante: Date = new Date()): Partes {
  const out: Record<string, number> = {};
  for (const p of formatter.formatToParts(instante)) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return { ano: out.year!, mes: out.month!, dia: out.day!, hora: out.hour!, minuto: out.minute! };
}

const dois = (n: number) => String(n).padStart(2, "0");

/** Data de hoje (yyyy-mm-dd) em America/Sao_Paulo. */
export function todayISO(instante: Date = new Date()): string {
  const p = partesNoFuso(instante);
  return `${p.ano}-${dois(p.mes)}-${dois(p.dia)}`;
}

/** Hora atual (HH:MM) em America/Sao_Paulo. */
export function agoraHHMM(instante: Date = new Date()): string {
  const p = partesNoFuso(instante);
  return `${dois(p.hora)}:${dois(p.minuto)}`;
}

/** Soma dias a uma data ISO sem depender de fuso. */
export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + days));
  return dt.toISOString().slice(0, 10);
}

/** Dia da semana (0 = domingo) de uma data ISO, sem depender de fuso. */
export function weekdayIndexISO(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
}
