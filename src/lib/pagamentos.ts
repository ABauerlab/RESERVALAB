/**
 * Nucleo de pagamentos, independente de provedor. Decide o que fazer com um evento ja normalizado.
 * O que depende da InfinitePay (verificar autenticidade e traduzir o payload do webhook) entra pela
 * interface `ProvedorPagamento` quando a documentacao e os webhooks reais forem fornecidos.
 * Nada aqui libera plano por retorno de URL: so por evento confirmado e validado.
 */
import { PLANOS, type PlanoId } from "@/lib/plans";

export type CicloPlano = "mensal" | "anual";
export type StatusPedido = "pendente" | "aprovado" | "recusado" | "cancelado" | "estornado";

export type Pedido = {
  id: string;
  tenantId: string;
  plano: Exclude<PlanoId, "gratuito">;
  ciclo: CicloPlano;
  /** Valor esperado, em centavos, congelado na criacao do pedido. */
  valorCentavos: number;
  status: StatusPedido;
  /** Data do ultimo evento aplicado (ms). Protege contra eventos fora de ordem. */
  ultimoEventoEm: number | null;
};

/** Evento ja verificado e traduzido pelo adaptador do provedor. */
export type EventoPagamento = {
  provedor: string;
  eventoId: string;
  /** Referencia do pedido enviada ao provedor na criacao do checkout. */
  referencia: string;
  valorCentavos: number;
  moeda: string;
  status: StatusPedido;
  ocorridoEm: number;
};

export type ProvedorPagamento = {
  nome: string;
  /** Valida origem e autenticidade conforme o mecanismo oficial do provedor. */
  verificar(requisicao: Request): Promise<boolean>;
  /** Traduz o payload oficial em evento normalizado; null se o formato nao for reconhecido. */
  normalizar(corpo: unknown): EventoPagamento | null;
};

export function valorEsperadoCentavos(plano: Pedido["plano"], ciclo: CicloPlano): number {
  const p = PLANOS[plano];
  return ciclo === "anual" ? p.anualCentavos : p.mensalCentavos;
}

export type Decisao =
  | { acao: "ignorar"; motivo: "duplicado" | "fora_de_ordem" | "sem_mudanca" }
  | { acao: "rejeitar"; motivo: "pedido_inexistente" | "moeda_invalida" | "valor_divergente" }
  | {
      acao: "aplicar";
      novoStatus: StatusPedido;
      /** true = ativar o plano; false = manter plano; "revogar" = estorno/cancelamento. */
      plano: "ativar" | "manter" | "revogar";
      /** Em modo de teste o estado do pedido muda mas nenhum plano pago e liberado. */
      simulado: boolean;
    };

const RANK: Record<StatusPedido, number> = {
  pendente: 0,
  recusado: 1,
  aprovado: 2,
  cancelado: 3,
  estornado: 3,
};

export function decidirEvento(
  pedido: Pedido | null,
  evento: EventoPagamento,
  opcoes: { eventoJaProcessado: boolean; liberacaoAtiva: boolean },
): Decisao {
  if (opcoes.eventoJaProcessado) return { acao: "ignorar", motivo: "duplicado" };
  if (!pedido) return { acao: "rejeitar", motivo: "pedido_inexistente" };
  if (evento.moeda.toUpperCase() !== "BRL") return { acao: "rejeitar", motivo: "moeda_invalida" };
  if (evento.valorCentavos !== pedido.valorCentavos)
    return { acao: "rejeitar", motivo: "valor_divergente" };
  if (pedido.ultimoEventoEm !== null && evento.ocorridoEm < pedido.ultimoEventoEm)
    return { acao: "ignorar", motivo: "fora_de_ordem" };
  // Estado final nunca regride (ex.: "pendente" atrasado depois de "aprovado").
  if (RANK[evento.status] < RANK[pedido.status])
    return { acao: "ignorar", motivo: "fora_de_ordem" };
  if (evento.status === pedido.status) return { acao: "ignorar", motivo: "sem_mudanca" };

  const plano =
    evento.status === "aprovado"
      ? "ativar"
      : evento.status === "cancelado" || evento.status === "estornado"
        ? "revogar"
        : "manter";
  return {
    acao: "aplicar",
    novoStatus: evento.status,
    plano,
    simulado: !opcoes.liberacaoAtiva,
  };
}
