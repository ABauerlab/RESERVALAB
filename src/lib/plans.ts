/**
 * Planos do Teggly (sem billing). Fonte unica de precos, limites e recursos para o site, a tela
 * "Seu plano" e qualquer checagem de recurso. Precos e limites sao HIPOTESE COMERCIAL INICIAL
 * (premissas numeradas em docs/TEGGLY_PRICING_STRATEGY.md). Nenhuma cobranca existe ainda; nada aqui
 * bloqueia a empresa.
 */

export type PlanoId = "gratuito" | "essencial" | "pro";

export type Recurso =
  | "reserva_publica"
  | "cardapio"
  | "link_hub"
  | "marca_opt_in"
  | "whatsapp_confirmacao"
  | "reconfirmacao"
  | "assistente_ia"
  | "relatorios_periodo"
  | "relatorios_completos";

export type Plano = {
  id: PlanoId;
  nome: string;
  paraQuem: string;
  /** Centavos por mes no pagamento mensal. */
  mensalCentavos: number;
  /** Centavos por ano no pagamento anual. */
  anualCentavos: number;
  reservasPorMes: number;
  clientes: number | null;
  usuarios: number;
  suporte: string;
  recursos: readonly Recurso[];
};

export const PLANOS: Record<PlanoId, Plano> = {
  gratuito: {
    id: "gratuito",
    nome: "Gratuito",
    paraQuem: "Para sair do caderno e começar a receber reservas.",
    mensalCentavos: 0,
    anualCentavos: 0,
    reservasPorMes: 40,
    clientes: 200,
    usuarios: 1,
    suporte: "Central de ajuda",
    recursos: ["reserva_publica", "cardapio", "link_hub", "marca_opt_in"],
  },
  essencial: {
    id: "essencial",
    nome: "Essencial",
    paraQuem: "Para a casa com movimento toda semana.",
    mensalCentavos: 8900,
    anualCentavos: 89000,
    reservasPorMes: 200,
    clientes: null,
    usuarios: 3,
    suporte: "E-mail",
    recursos: [
      "reserva_publica",
      "cardapio",
      "link_hub",
      "marca_opt_in",
      "whatsapp_confirmacao",
      "reconfirmacao",
      "relatorios_periodo",
    ],
  },
  pro: {
    id: "pro",
    nome: "Pro",
    paraQuem: "Para a casa cheia que não pode parar para responder.",
    mensalCentavos: 18900,
    anualCentavos: 189000,
    reservasPorMes: 800,
    clientes: null,
    usuarios: 10,
    suporte: "Prioritário",
    recursos: [
      "reserva_publica",
      "cardapio",
      "link_hub",
      "marca_opt_in",
      "whatsapp_confirmacao",
      "reconfirmacao",
      "assistente_ia",
      "relatorios_periodo",
      "relatorios_completos",
    ],
  },
};

export const ORDEM_PLANOS: readonly PlanoId[] = ["gratuito", "essencial", "pro"];

/** Plano de quem ainda nao tem registro: Pro de lancamento, para nao limitar quem ja usa o produto. */
export const PLANO_LEGADO: PlanoId = "pro";

export const ROTULO_RECURSO: Record<Recurso, string> = {
  reserva_publica: "Página pública de reserva",
  cardapio: "Cardápio digital",
  link_hub: "Link Hub",
  marca_opt_in: "Logo e cor do restaurante",
  whatsapp_confirmacao: "Confirmação e lembrete no WhatsApp",
  reconfirmacao: "Reconfirmação automática",
  assistente_ia: "Assistente no WhatsApp",
  relatorios_periodo: "Relatórios por período",
  relatorios_completos: "Relatórios completos e exportação",
};

/** Ordem de exibicao dos recursos nas tabelas de comparacao (site e Ajustes). */
export const RECURSOS_ORDEM: readonly Recurso[] = [
  "reserva_publica",
  "cardapio",
  "link_hub",
  "marca_opt_in",
  "whatsapp_confirmacao",
  "reconfirmacao",
  "assistente_ia",
  "relatorios_periodo",
  "relatorios_completos",
];

export function ehPlanoId(v: unknown): v is PlanoId {
  return v === "gratuito" || v === "essencial" || v === "pro";
}

/** Valor salvo (ou ausente) para o plano em vigor. */
export function planoEmVigor(valor: unknown): Plano {
  return PLANOS[ehPlanoId(valor) ? valor : PLANO_LEGADO];
}

export function temRecurso(plano: Plano, recurso: Recurso): boolean {
  return plano.recursos.includes(recurso);
}

/** Menor plano que inclui o recurso, para sugerir a mudanca. */
export function planoMinimoPara(recurso: Recurso): Plano {
  for (const id of ORDEM_PLANOS) if (temRecurso(PLANOS[id], recurso)) return PLANOS[id];
  return PLANOS.pro;
}

export type UsoReservas = {
  usadas: number;
  limite: number;
  restantes: number;
  /** 0 a 100, truncado. */
  percentual: number;
  estado: "ok" | "perto" | "excedido";
};

/** "perto" a partir de 80% do limite. Informativo: nunca bloqueia. */
export function usoDeReservas(usadas: number, plano: Plano): UsoReservas {
  const limite = plano.reservasPorMes;
  const u = Math.max(0, Math.floor(usadas));
  const percentual = Math.min(100, Math.floor((u / limite) * 100));
  const estado = u > limite ? "excedido" : u >= Math.ceil(limite * 0.8) ? "perto" : "ok";
  return { usadas: u, limite, restantes: Math.max(0, limite - u), percentual, estado };
}

export function mensalDoAnualCentavos(plano: Plano): number {
  return Math.round(plano.anualCentavos / 12);
}

/** Desconto do anual sobre 12 meses no mensal, em % inteiro. */
export function descontoAnualPercentual(plano: Plano): number {
  const cheio = plano.mensalCentavos * 12;
  if (cheio === 0) return 0;
  return Math.round(((cheio - plano.anualCentavos) / cheio) * 100);
}

export function formatarReais(centavos: number): string {
  const reais = centavos / 100;
  const inteiro = Number.isInteger(reais);
  return reais.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: inteiro ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** Primeiro dia do mes (ISO, fuso de Sao Paulo ja resolvido por quem chama) e do mes seguinte. */
export function intervaloDoMes(hojeISO: string): { inicio: string; fim: string } {
  const [y, m] = hojeISO.split("-").map(Number) as [number, number];
  const pad = (n: number) => String(n).padStart(2, "0");
  const inicio = `${y}-${pad(m)}-01`;
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return { inicio, fim: `${ny}-${pad(nm)}-01` };
}
