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
