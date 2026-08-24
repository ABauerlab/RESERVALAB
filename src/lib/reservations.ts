import type { Database } from "@/integrations/supabase/types";

export type Reserva = Database["public"]["Tables"]["reservas"]["Row"];
export type ReservaInsert = Database["public"]["Tables"]["reservas"]["Insert"];
export type ReservaUpdate = Database["public"]["Tables"]["reservas"]["Update"];
export type ReservaTipo = Database["public"]["Enums"]["reserva_tipo"];
export type ReservaStatus = Database["public"]["Enums"]["reserva_status"];
export type ReservaArea = Database["public"]["Enums"]["reserva_area"];

export const TIPO_LABEL: Record<ReservaTipo, string> = {
  mesa: "Reserva de mesa",
  aniversario: "Aniversário",
  evento: "Evento particular",
  casamento: "Casamento",
};

export const TIPO_SHORT: Record<ReservaTipo, string> = {
  mesa: "Mesa",
  aniversario: "Aniversário",
  evento: "Evento",
  casamento: "Casamento",
};

export const STATUS_LABEL: Record<ReservaStatus, string> = {
  pendente: "Pendente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  finalizada: "Finalizada",
};

export const STATUS_LIST: ReservaStatus[] = ["pendente", "confirmada", "cancelada", "finalizada"];

export const MOTIVO_CANCELAMENTO_OPCOES = [
  "Cliente desistiu",
  "Cliente não compareceu",
  "Pedido do cliente por telefone/WhatsApp",
  "Indisponibilidade da casa",
  "Outro",
] as const;

export const AREA_LABEL: Record<ReservaArea, string> = {
  interna: "Interna",
  externa: "Externa",
  sem_preferencia: "Sem preferência",
};

export const TIPO_CARDS: Array<{
  tipo: ReservaTipo;
  titulo: string;
  descricao: string;
}> = [
  { tipo: "mesa",         titulo: "Reservar mesa",       descricao: "Almoço, jantar ou um brinde com amigos." },
  { tipo: "aniversario",  titulo: "Aniversário",         descricao: "Celebre com bolo, comandas e a nossa equipe." },
  { tipo: "evento",       titulo: "Evento particular",   descricao: "Confraternização, encontro corporativo, comemoração." },
  { tipo: "casamento",    titulo: "Casamento",           descricao: "Cerimônia e recepção sob medida." },
];

/**
 * Formata telefone de forma flexível:
 * - Se começa com "+", mantém DDI livre e formata o restante em grupos.
 * - Caso contrário, aplica máscara BR (10 ou 11 dígitos).
 */
export function formatTelefone(v: string): string {
  const trimmed = v.trim();
  if (trimmed.startsWith("+")) {
    // Mantém apenas + e dígitos, agrupa: +DD (XXX) XXXXX-XXXX (flexível)
    const digits = trimmed.slice(1).replace(/\D/g, "").slice(0, 15);
    if (digits.length === 0) return "+";
    if (digits.length <= 2) return `+${digits}`;
    if (digits.length <= 4) return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
    if (digits.length <= 8) return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`;
    // Ex: +55 11 91234-5678
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  const d = trimmed.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Retorna telefone somente-dígitos incluindo DDI (default 55 se não informado). */
export function telefoneToWhatsApp(v: string): string {
  const trimmed = v.trim();
  if (trimmed.startsWith("+")) return trimmed.slice(1).replace(/\D/g, "");
  const d = trimmed.replace(/\D/g, "");
  if (d.length === 0) return "";
  // Assume BR se sem DDI
  return d.startsWith("55") ? d : `55${d}`;
}

export function formatData(iso?: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function formatHorario(v?: string | null): string {
  if (!v) return "—";
  return v.slice(0, 5);
}

/* ---------- Horários de funcionamento ---------- */

function slots(inicio: string, fim: string, stepMin = 30): string[] {
  const toMin = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
  const out: string[] = [];
  for (let m = toMin(inicio); m <= toMin(fim); m += stepMin) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}

/** Corte configurável por empresa do último horário aceito (seg-sex / sáb-dom). */
export type HorarioLimites = {
  semana?: string | null;
  fimDeSemana?: string | null;
};

/**
 * Horários oferecidos ao cliente para uma data (YYYY-MM-DD).
 * Padrão: seg–sex 11h–15h, sáb–dom 12h–17h.
 * Acima de 30 pessoas, opções adicionais entram na mesma lista.
 *
 * `limites` permite que cada empresa antecipe o corte (ex.: parar de aceitar
 * reservas 1-2h antes do fechamento, para as mesas não ficarem ocupadas até
 * a casa fechar). Só afeta a janela de capacidade normal (até 30 pessoas) —
 * grupos maiores usam horários estendidos à parte.
 */
export function horariosDisponiveis(dataIso: string, quantidade: number, limites?: HorarioLimites): string[] {
  if (!dataIso) return [];
  const [y, m, d] = dataIso.split("-").map(Number);
  const dia = new Date(y!, (m ?? 1) - 1, d!).getDay(); // 0=dom, 6=sáb
  const fimDeSemana = dia === 0 || dia === 6;

  const fimPadrao = fimDeSemana ? "17:00" : "15:00";

  if (quantidade <= 30) {
    const limite = (fimDeSemana ? limites?.fimDeSemana : limites?.semana)?.slice(0, 5);
    const fim = limite || fimPadrao;
    return fimDeSemana ? slots("12:00", fim) : slots("11:00", fim);
  }

  const base = fimDeSemana ? slots("12:00", fimPadrao) : slots("11:00", fimPadrao);
  const extras = fimDeSemana
    ? [...slots("09:00", "11:30"), ...slots("17:30", "23:00")]
    : [...slots("08:00", "10:30"), ...slots("15:30", "23:00")];

  return Array.from(new Set([...base, ...extras])).sort();
}
