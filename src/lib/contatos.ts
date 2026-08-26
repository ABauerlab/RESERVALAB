import {
  STATUS_LABEL,
  formatData,
  telefoneToWhatsApp,
  type Reserva,
  type ReservaStatus,
} from "@/lib/reservations";

export type Contato = {
  telefoneWhatsapp: string;
  nome: string;
  telefone: string;
  reservas: number;
  ultimaData: string | null;
  ultimoStatus: ReservaStatus;
};

/**
 * Agrupa reservas por telefone (contato único), pensado para exportação de
 * lista de remarketing. Mantém o nome e o status mais recentes de cada
 * contato e conta quantas reservas ele já fez.
 */
export function agruparContatos(reservas: Reserva[]): Contato[] {
  const porTelefone = new Map<string, Contato & { _ultimoTimestamp: string }>();

  for (const r of reservas) {
    const whats = telefoneToWhatsApp(r.telefone);
    if (!whats || !r.nome?.trim()) continue;

    const timestamp = r.data ?? r.created_at ?? "";
    const atual = porTelefone.get(whats);

    if (!atual || timestamp >= atual._ultimoTimestamp) {
      porTelefone.set(whats, {
        telefoneWhatsapp: whats,
        nome: r.nome.trim(),
        telefone: r.telefone,
        reservas: (atual?.reservas ?? 0) + 1,
        ultimaData: r.data ?? null,
        ultimoStatus: r.status,
        _ultimoTimestamp: timestamp,
      });
    } else {
      atual.reservas += 1;
    }
  }

  return Array.from(porTelefone.values())
    .map(({ _ultimoTimestamp, ...c }) => c)
    .sort((a, b) => (b.ultimaData ?? "").localeCompare(a.ultimaData ?? ""));
}

function csvCell(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

export function contatosToCsv(contatos: Contato[]): string {
  const header = ["Nome", "Telefone", "WhatsApp", "Reservas", "Última reserva", "Último status"];
  const linhas = contatos.map((c) => [
    c.nome,
    c.telefone,
    c.telefoneWhatsapp,
    String(c.reservas),
    c.ultimaData ? formatData(c.ultimaData) : "",
    STATUS_LABEL[c.ultimoStatus] ?? c.ultimoStatus,
  ]);
  return [header, ...linhas].map((linha) => linha.map(csvCell).join(",")).join("\r\n");
}
