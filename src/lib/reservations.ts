import type { Database } from "@/integrations/supabase/types";

export type Reserva = Database["public"]["Tables"]["reservas"]["Row"];
export type ReservaInsert = Database["public"]["Tables"]["reservas"]["Insert"];
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
  { tipo: "casamento",    titulo: "Casamento",           descricao: "Cerimônia e recepção sob medida no Iracema." },
];

export function formatTelefone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
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
