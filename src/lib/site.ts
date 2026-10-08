/** Dominio publico oficial. Canonical, Open Graph, sitemap e robots partem daqui. */
export const SITE_URL = "https://teggly.com.br";

/** Contatos oficiais do Teggly para o site e materiais publicos. Nao inventar outros. */
export const EMAIL_CONTATO = "contato.bauerlab@gmail.com";
export const INSTAGRAM_TEGGLY = "teggly";

// Texto mantido como estava: chega ao WhatsApp da equipe e pode ser lido por automacoes fora deste
// repositorio. Revisar junto com o atendimento.
export const WHATSAPP_TEGGLY =
  "https://wa.me/5531998021169?text=" +
  encodeURIComponent("Ola! Quero usar o ReservaLab na minha empresa.");

export function mailtoContato(assunto: string, corpo?: string): string {
  const q = [`subject=${encodeURIComponent(assunto)}`];
  if (corpo) q.push(`body=${encodeURIComponent(corpo)}`);
  return `mailto:${EMAIL_CONTATO}?${q.join("&")}`;
}

/**
 * Origem usada nos links publicos que o painel copia ou envia (reserva, Link Hub, acompanhamento).
 * Em producao e sempre o dominio oficial; em desenvolvimento e testes (localhost) segue o endereco aberto.
 */
export function origemPublica(): string {
  if (typeof window === "undefined") return SITE_URL;
  const host = window.location.hostname;
  const local = host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
  return local ? window.location.origin : SITE_URL;
}
