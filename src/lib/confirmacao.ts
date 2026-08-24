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

/**
 * Template padrão da mensagem de cancelamento enviada ao cliente no WhatsApp.
 * Sempre inclui o link para fazer uma nova reserva, reforçando que o cliente
 * continua no controle mesmo com o cancelamento.
 */
export const DEFAULT_MENSAGEM_CANCELAMENTO = `Ola {nome}, tudo bem?

Sua reserva no {empresa} (codigo {codigo}) foi CANCELADA.

Data: {data}
Horario: {horario}
Motivo: {motivo_cancelamento}

Se quiser, voce pode fazer uma nova reserva a qualquer momento:
{link_nova_reserva}

Qualquer duvida, e so chamar.`;

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

export const PLACEHOLDERS_CANCELAMENTO: Array<{ token: string; descricao: string }> = [
  { token: "{nome}", descricao: "Nome do cliente" },
  { token: "{empresa}", descricao: "Nome do estabelecimento" },
  { token: "{codigo}", descricao: "Código de acompanhamento" },
  { token: "{data}", descricao: "Data da reserva" },
  { token: "{horario}", descricao: "Horário da reserva" },
  { token: "{pessoas}", descricao: "Quantidade de pessoas" },
  { token: "{tipo}", descricao: "Tipo da reserva" },
  { token: "{motivo_cancelamento}", descricao: "Motivo do cancelamento" },
  { token: "{link_nova_reserva}", descricao: "Link para fazer uma nova reserva" },
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
  out = limparLinhasVazias(out);

  // Garante que o cliente sempre receba o código e o link de acompanhamento,
  // mesmo que o template personalizado da empresa não use os placeholders.
  const extras: string[] = [];
  if (!tpl.includes("{codigo}") && valores["{codigo}"]) {
    extras.push(`Codigo da reserva: ${valores["{codigo}"]}`);
  }
  if (!tpl.includes("{link_acompanhar}") && ctx.linkAcompanhar) {
    extras.push("Acompanhe, altere ou cancele sua reserva em:", ctx.linkAcompanhar);
  }
  if (extras.length > 0) out = `${out}\n\n${extras.join("\n")}`;

  return out;
}


export type CancelamentoContexto = {
  reserva: Reserva;
  empresaNome: string;
  motivoCancelamento?: string | null;
  linkNovaReserva: string;
};

export function buildMensagemCancelamento(
  template: string | null | undefined,
  ctx: CancelamentoContexto,
): string {
  const r = ctx.reserva;
  const tpl = (template && template.trim().length > 0)
    ? template
    : DEFAULT_MENSAGEM_CANCELAMENTO;

  const valores: Record<string, string> = {
    "{nome}": r.nome ?? "",
    "{empresa}": ctx.empresaNome ?? "",
    "{codigo}": r.codigo_acompanhamento ?? "",
    "{data}": r.data ? formatData(r.data) : "",
    "{horario}": r.horario ? formatHorario(r.horario) : "",
    "{pessoas}": r.quantidade != null ? String(r.quantidade) : "",
    "{tipo}": TIPO_LABEL[r.tipo] ?? "",
    "{motivo_cancelamento}": ctx.motivoCancelamento ?? "",
    "{link_nova_reserva}": ctx.linkNovaReserva,
  };

  let out = tpl;
  for (const [token, valor] of Object.entries(valores)) {
    out = out.split(token).join(valor);
  }
  out = limparLinhasVazias(out);

  const extras: string[] = [];
  if (!tpl.includes("{link_nova_reserva}") && ctx.linkNovaReserva) {
    extras.push("Faça uma nova reserva quando quiser:", ctx.linkNovaReserva);
  }
  if (extras.length > 0) out = `${out}\n\n${extras.join("\n")}`;

  return out;
}

/**
 * Monta a URL do WhatsApp. Usa api.whatsapp.com/send, que lida melhor com
 * mensagens longas e multilinha do que o encurtador wa.me em alguns clientes.
 */
export function whatsappUrl(numeroDigitos: string, mensagem: string): string {
  return `https://api.whatsapp.com/send?phone=${numeroDigitos}&text=${encodeURIComponent(mensagem)}`;
}
