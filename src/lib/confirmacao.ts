import {
  AREA_LABEL,
  TIPO_LABEL,
  formatData,
  formatHorario,
  type Reserva,
} from "@/lib/reservations";

/**
 * Template padrão da mensagem de confirmação enviada ao cliente no WhatsApp.
 * Sem emoji, apenas texto. O link fica sozinho na última linha para que o
 * WhatsApp reconheça a URL inteira (links seguidos de texto na mesma linha
 * costumavam ser cortados na visualização).
 */
export const DEFAULT_MENSAGEM_CONFIRMACAO = `Ola {nome}, tudo bem?

Sua reserva no {empresa} esta CONFIRMADA.

Codigo: {codigo}
Data: {data}
Horario: {horario}
Pessoas: {pessoas}
Tipo: {tipo}
Endereco: {endereco}

Se precisar alterar ou cancelar, acesse:
{link_acompanhar}

Ate breve.`;

export const PLACEHOLDERS: Array<{ token: string; descricao: string }> = [
  { token: "{nome}", descricao: "Nome do cliente" },
  { token: "{empresa}", descricao: "Nome do estabelecimento" },
  { token: "{codigo}", descricao: "Código de acompanhamento" },
  { token: "{data}", descricao: "Data da reserva" },
  { token: "{horario}", descricao: "Horário da reserva" },
  { token: "{pessoas}", descricao: "Quantidade de pessoas" },
  { token: "{tipo}", descricao: "Tipo da reserva" },
  { token: "{area}", descricao: "Área escolhida" },
  { token: "{endereco}", descricao: "Endereço do estabelecimento" },
  { token: "{telefone_empresa}", descricao: "Telefone de contato" },
  { token: "{link_acompanhar}", descricao: "Link direto da reserva" },
];

export type ConfirmacaoContexto = {
  reserva: Reserva;
  empresaNome: string;
  endereco?: string | null;
  telefoneEmpresa?: string | null;
  linkAcompanhar: string;
};

/** Remove linhas que ficaram com o valor vazio (ex.: "Endereco: "). */
function limparLinhasVazias(texto: string): string {
  return texto
    .split("\n")
    .filter((linha) => !/^\s*[A-Za-zÀ-ú ]+:\s*$/.test(linha))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildMensagemConfirmacao(
  template: string | null | undefined,
  ctx: ConfirmacaoContexto,
): string {
  const r = ctx.reserva;
  const tpl = (template && template.trim().length > 0)
    ? template
    : DEFAULT_MENSAGEM_CONFIRMACAO;

  const valores: Record<string, string> = {
    "{nome}": r.nome ?? "",
    "{empresa}": ctx.empresaNome ?? "",
    "{codigo}": r.codigo_acompanhamento ?? "",
    "{data}": r.data ? formatData(r.data) : "",
    "{horario}": r.horario ? formatHorario(r.horario) : "",
    "{pessoas}": r.quantidade != null ? String(r.quantidade) : "",
    "{tipo}": TIPO_LABEL[r.tipo] ?? "",
    "{area}": r.area ? AREA_LABEL[r.area] : "",
    "{endereco}": ctx.endereco ?? "",
    "{telefone_empresa}": ctx.telefoneEmpresa ?? "",
    "{link_acompanhar}": ctx.linkAcompanhar,
  };

  let out = tpl;
  for (const [token, valor] of Object.entries(valores)) {
    out = out.split(token).join(valor);
  }
  return limparLinhasVazias(out);
}

/**
 * Monta a URL do WhatsApp. Usa api.whatsapp.com/send, que lida melhor com
 * mensagens longas e multilinha do que o encurtador wa.me em alguns clientes.
 */
export function whatsappUrl(numeroDigitos: string, mensagem: string): string {
  return `https://api.whatsapp.com/send?phone=${numeroDigitos}&text=${encodeURIComponent(mensagem)}`;
}
