import { addDaysISO, agoraHHMM, todayISO, weekdayIndexISO } from "@/lib/datetime";

// Datas do painel (ISO yyyy-mm-dd). "Hoje" e "agora" vem de `datetime.ts`
// (America/Sao_Paulo), a fonte unica; aqui ficam so os atalhos usados pelas telas.
export { addDaysISO, todayISO };

export function tomorrowISO() {
  return addDaysISO(todayISO(), 1);
}
export function endOfWeekISO() {
  return addDaysISO(todayISO(), 7);
}
export function endOfMonthISO() {
  return addDaysISO(todayISO(), 30);
}

const SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const SEMANA_CURTO = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function weekdayLabel(iso: string, short = false): string {
  const i = weekdayIndexISO(iso);
  return short ? SEMANA_CURTO[i] : SEMANA[i];
}

/** Data e hora de agora no fuso do produto (marca "agora" da linha do servico e da Agenda). */
export function localISO() {
  return todayISO();
}
export function localHHMM() {
  return agoraHHMM();
}

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];
const MESES_CURTO = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

function maiuscula(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "Sáb, 21 jun" (formato compacto do Brand System). */
export function formatDataCurta(iso: string): string {
  const [, m, d] = iso.split("-").map(Number) as [number, number, number];
  return `${maiuscula(weekdayLabel(iso, true))}, ${d} ${MESES_CURTO[m - 1]}`;
}

/** "Quarta, 7 de outubro" (titulos de pagina). */
export function formatDataLonga(iso: string): string {
  const [, m, d] = iso.split("-").map(Number) as [number, number, number];
  const dia = weekdayLabel(iso);
  const nome = ["sábado", "domingo"].includes(dia) ? dia : `${dia}-feira`;
  return `${maiuscula(nome)}, ${d} de ${MESES[m - 1]}`;
}
