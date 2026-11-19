/**
 * Atendente de WhatsApp (Dona Iracema): estado de liga/desliga.
 * O servidor devolve JSON solto; aqui ele vira um tipo seguro.
 */

export type ConversaPausada = {
  telefone: string;
  pausadoAte: string | null; // null = até alguém religar
  criadoEm: string;
};

export type IaWhatsappEstado = {
  ativo: boolean;
  pausadas: ConversaPausada[];
};

export function parseIaEstado(raw: unknown): IaWhatsappEstado {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const lista = Array.isArray(o.pausadas) ? o.pausadas : [];
  return {
    ativo: o.ativo !== false,
    pausadas: lista
      .map((p) => {
        const r = (p ?? {}) as Record<string, unknown>;
        return {
          telefone: String(r.telefone ?? ""),
          pausadoAte: typeof r.pausado_ate === "string" ? r.pausado_ate : null,
          criadoEm: String(r.criado_em ?? ""),
        };
      })
      .filter((p) => p.telefone),
  };
}

/** Mesma chave do banco (ia_tel_chave): últimos 8 dígitos, ignora DDI, DDD e o 9 extra. */
export function chaveTelefone(tel: string): string {
  return tel.replace(/\D/g, "").slice(-8);
}

export function conversaPausada(estado: IaWhatsappEstado | undefined, tel: string): boolean {
  if (!estado) return false;
  const k = chaveTelefone(tel);
  return k.length === 8 && estado.pausadas.some((p) => chaveTelefone(p.telefone) === k);
}

/** Texto curto para a lista de conversas pausadas. */
export function descreverPausa(p: ConversaPausada, agora = new Date()): string {
  if (!p.pausadoAte) return "até você religar";
  const fim = new Date(p.pausadoAte);
  if (Number.isNaN(fim.getTime()) || fim <= agora) return "expirada";
  return `até ${fim.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`;
}
