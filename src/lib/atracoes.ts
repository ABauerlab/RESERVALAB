import { addDaysISO, weekdayIndexISO } from "@/lib/datetime";

/** Agenda de atrações do mês (planejamento interno, equipe + donos). */

export const TIPOS = ["musica_ao_vivo", "dj", "tematica", "outro"] as const;
export type TipoAtracao = (typeof TIPOS)[number];

export const STATUS = ["ideia", "negociando", "confirmada", "cancelada"] as const;
export type StatusAtracao = (typeof STATUS)[number];

export const TIPO_LABEL: Record<TipoAtracao, string> = {
  musica_ao_vivo: "Música ao vivo",
  dj: "DJ",
  tematica: "Noite temática",
  outro: "Outro",
};

export const STATUS_LABEL: Record<StatusAtracao, string> = {
  ideia: "Ideia",
  negociando: "Negociando",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
};

export type Atracao = {
  id: string;
  tenant_id: string;
  data: string;
  horario_inicio: string | null;
  horario_fim: string | null;
  titulo: string;
  tipo: TipoAtracao;
  status: StatusAtracao;
  contato: string | null;
  cache_valor: number | null;
  observacoes: string | null;
  destaque: boolean;
  descricao_publica: string | null;
  imagem_url: string | null;
  imagem_largura: number | null;
  imagem_altura: number | null;
  updated_at: string;
};

/** Mês no formato yyyy-mm. */
export type MesISO = string;

export function mesDe(iso: string): MesISO {
  return iso.slice(0, 7);
}

export function parseMes(valor: unknown, fallback: MesISO): MesISO {
  return typeof valor === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(valor) ? valor : fallback;
}

export function mudarMes(mes: MesISO, delta: number): MesISO {
  const [y, m] = mes.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export function primeiroDia(mes: MesISO): string {
  return `${mes}-01`;
}

export function ultimoDia(mes: MesISO): string {
  return addDaysISO(primeiroDia(mudarMes(mes, 1)), -1);
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

/** "Outubro de 2026". */
export function tituloMes(mes: MesISO): string {
  const [y, m] = mes.split("-").map(Number) as [number, number];
  const nome = MESES[m - 1]!;
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${y}`;
}

export type CelulaMes = { iso: string; doMes: boolean };

/** Grade do calendário (semanas de domingo a sábado), com os dias de folga dos meses vizinhos. */
export function gradeDoMes(mes: MesISO): CelulaMes[][] {
  const inicio = addDaysISO(primeiroDia(mes), -weekdayIndexISO(primeiroDia(mes)));
  const fim = ultimoDia(mes);
  const semanas: CelulaMes[][] = [];
  let cursor = inicio;
  while (cursor <= fim) {
    const semana: CelulaMes[] = [];
    for (let i = 0; i < 7; i++) {
      semana.push({ iso: cursor, doMes: mesDe(cursor) === mes });
      cursor = addDaysISO(cursor, 1);
    }
    semanas.push(semana);
  }
  return semanas;
}

/** Mesmo dia da semana de `iso`, de 7 em 7 dias, até o último dia do mês (inclui o próprio `iso`). */
export function datasSemanais(iso: string): string[] {
  const limite = ultimoDia(mesDe(iso));
  const datas: string[] = [];
  for (let d = iso; d <= limite; d = addDaysISO(d, 7)) datas.push(d);
  return datas;
}

export function comparar(a: Atracao, b: Atracao): number {
  return (
    a.data.localeCompare(b.data) ||
    (a.horario_inicio ?? "99:99").localeCompare(b.horario_inicio ?? "99:99") ||
    a.titulo.localeCompare(b.titulo, "pt-BR")
  );
}

export function agruparPorDia(atracoes: Atracao[]): Map<string, Atracao[]> {
  const mapa = new Map<string, Atracao[]>();
  for (const a of [...atracoes].sort(comparar)) {
    const lista = mapa.get(a.data);
    if (lista) lista.push(a);
    else mapa.set(a.data, [a]);
  }
  return mapa;
}

export type ResumoMes = {
  total: number;
  confirmadas: number;
  emAberto: number;
  diasSemAtracao: number;
  /** Soma dos cachês das confirmadas e em negociação, para previsão de custo. */
  cachePrevisto: number;
};

/**
 * Previsibilidade do mês. Atração cancelada não conta como dia coberto; ideia e
 * negociação contam como "em aberto", e os dias sem nada são o que falta fechar.
 */
export function resumoDoMes(mes: MesISO, atracoes: Atracao[]): ResumoMes {
  const doMes = atracoes.filter((a) => mesDe(a.data) === mes);
  const ativas = doMes.filter((a) => a.status !== "cancelada");
  const diasCobertos = new Set(ativas.map((a) => a.data));
  const diasNoMes = Number(ultimoDia(mes).slice(8));
  return {
    total: ativas.length,
    confirmadas: ativas.filter((a) => a.status === "confirmada").length,
    emAberto: ativas.filter((a) => a.status === "ideia" || a.status === "negociando").length,
    diasSemAtracao: diasNoMes - diasCobertos.size,
    cachePrevisto: ativas
      .filter((a) => a.status === "confirmada" || a.status === "negociando")
      .reduce((soma, a) => soma + (a.cache_valor ?? 0), 0),
  };
}

const SEMANA_CURTO = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function hhmm(v: string | null): string {
  return v ? v.slice(0, 5) : "";
}

/** Faixa de horário para exibir: "20:00", "20:00 às 23:00" ou "". */
export function faixaHorario(a: Pick<Atracao, "horario_inicio" | "horario_fim">): string {
  const ini = hhmm(a.horario_inicio);
  const fim = hhmm(a.horario_fim);
  if (ini && fim) return `${ini} às ${fim}`;
  return ini || fim;
}

/** Texto pronto para colar no WhatsApp: só atrações que não foram canceladas. */
export function textoDoMes(mes: MesISO, atracoes: Atracao[], nomeCasa: string): string {
  const linhas: string[] = [`*Atrações de ${tituloMes(mes)}${nomeCasa ? ` | ${nomeCasa}` : ""}*`];
  const porDia = agruparPorDia(atracoes.filter((a) => a.status !== "cancelada"));
  for (const [dia, lista] of porDia) {
    if (mesDe(dia) !== mes) continue;
    const [, m, d] = dia.split("-");
    for (const a of lista) {
      const horario = faixaHorario(a);
      const pendente =
        a.status === "confirmada" ? "" : ` (${STATUS_LABEL[a.status].toLowerCase()})`;
      linhas.push(
        `${d}/${m} ${SEMANA_CURTO[weekdayIndexISO(dia)]}${horario ? ` ${horario}` : ""}: ${a.titulo}${pendente}`,
      );
    }
  }
  if (linhas.length === 1) linhas.push("Nenhuma atração cadastrada.");
  return linhas.join("\n");
}

/** Aceita "1500", "1.500,50" ou "1500.5"; vazio vira null; inválido ou negativo vira NaN. */
export function parseValor(texto: string): number | null {
  const t = texto.trim();
  if (!t) return null;
  const normalizado = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  const n = Number(normalizado);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : Number.NaN;
}

export function formatBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
