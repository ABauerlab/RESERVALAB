// Mesmos helpers de data que o painel já usava (ISO yyyy-mm-dd). Mantidos como estavam
// para que filtros e contagens sigam exatamente iguais.
export function todayISO() { return new Date().toISOString().slice(0, 10); }
export function tomorrowISO() { return addDaysISO(todayISO(), 1); }
export function endOfWeekISO() { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); }
export function endOfMonthISO() { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); }

/** Soma dias a uma data ISO sem depender de fuso. */
export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

const SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const SEMANA_CURTO = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function weekdayLabel(iso: string, short = false): string {
  const [y, m, d] = iso.split("-").map(Number);
  const i = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return short ? SEMANA_CURTO[i] : SEMANA[i];
}
