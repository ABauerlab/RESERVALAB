import { parseDiaParam } from "@/lib/agenda";

/**
 * Filtros de Reservas guardados na URL: atualizar a pagina, compartilhar o link ou voltar de uma
 * reserva preserva periodo, dia, status, busca e filtros. Valores invalidos viram "padrao".
 */
export type Periodo = "hoje" | "amanha" | "semana" | "mes" | "todos" | "dia";
export type StatusFiltro = "todos" | "pendente" | "confirmada" | "encerradas";
export type EncerradaFiltro = "ambas" | "cancelada" | "finalizada";

export type ReservasBusca = {
  periodo?: Periodo;
  dia?: string;
  status?: StatusFiltro;
  encerradas?: EncerradaFiltro;
  tipo?: string;
  area?: string;
  q?: string;
  reserva?: string;
};

const ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Id simples (UUID ou similar): a URL nunca carrega texto livre para dentro da consulta. */
export function parseReservaParam(v: unknown): string | undefined {
  return typeof v === "string" && ID.test(v) ? v : undefined;
}

export const PERIODO_PADRAO: Periodo = "semana";

const PERIODOS: readonly Periodo[] = ["hoje", "amanha", "semana", "mes", "todos", "dia"];
const STATUS: readonly StatusFiltro[] = ["todos", "pendente", "confirmada", "encerradas"];
const ENCERRADAS: readonly EncerradaFiltro[] = ["ambas", "cancelada", "finalizada"];
const TIPOS = ["mesa", "aniversario", "evento", "casamento"];
const AREAS = ["salao", "fundos", "corredor", "varanda", "sem_preferencia"];

function oneOf<T extends string>(v: unknown, lista: readonly T[]): T | undefined {
  return typeof v === "string" && (lista as readonly string[]).includes(v) ? (v as T) : undefined;
}

export function parseReservasBusca(raw: Record<string, unknown>): ReservasBusca {
  const dia = parseDiaParam(raw.dia) ?? undefined;
  let periodo = oneOf(raw.periodo, PERIODOS);
  // Um dia na URL sem periodo explicito significa "este dia".
  if (dia && !periodo) periodo = "dia";
  if (periodo === "dia" && !dia) periodo = undefined;
  const q = typeof raw.q === "string" ? raw.q.slice(0, 80) : undefined;
  const out: ReservasBusca = {
    periodo: periodo && periodo !== PERIODO_PADRAO ? periodo : undefined,
    dia: periodo === "dia" ? dia : undefined,
    status: (() => {
      const s = oneOf(raw.status, STATUS);
      return s && s !== "todos" ? s : undefined;
    })(),
    encerradas: (() => {
      const e = oneOf(raw.encerradas, ENCERRADAS);
      return e && e !== "ambas" ? e : undefined;
    })(),
    tipo: oneOf(raw.tipo, TIPOS),
    area: oneOf(raw.area, AREAS),
    q: q?.trim() ? q : undefined,
    reserva: parseReservaParam(raw.reserva),
  };
  for (const k of Object.keys(out) as Array<keyof ReservasBusca>)
    if (out[k] === undefined) delete out[k];
  return out;
}
