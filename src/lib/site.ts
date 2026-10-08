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
