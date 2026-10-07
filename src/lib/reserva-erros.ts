/**
 * Mensagens amigaveis para os erros das funcoes publicas de reserva (criar, alterar, cancelar).
 * O servidor responde com textos curtos; o cliente nunca ve o texto tecnico.
 */
export function mensagemErroReserva(erro: unknown, padrao: string): string {
  const msg =
    typeof erro === "object" && erro !== null && "message" in erro
      ? String((erro as { message: unknown }).message)
      : "";
  if (msg.includes("indisponivel"))
    return "Essa data ou horário não está disponível. Escolha outro.";
  if (msg.includes("nao pode ser")) return "Esta reserva não pode mais ser alterada.";
  if (msg.includes("nao encontrada")) return "Não encontramos essa reserva. Confira o código.";
  if (msg.includes("Telefone")) return "Confira o telefone informado.";
  return padrao;
}
