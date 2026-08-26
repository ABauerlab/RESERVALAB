import { describe, expect, it } from "vitest";
import { agruparContatos, contatosToCsv } from "@/lib/contatos";
import type { Reserva } from "@/lib/reservations";

function makeReserva(overrides: Partial<Reserva> = {}): Reserva {
  return {
    id: "1",
    tenant_id: "t1",
    nome: "Maria",
    telefone: "5511912345678",
    tipo: "mesa",
    status: "confirmada",
    area: "interna",
    data: "2026-08-10",
    horario: "19:30:00",
    quantidade: 4,
    codigo_acompanhamento: "ABC123",
    created_at: "2026-08-08T00:00:00Z",
    updated_at: "2026-08-08T00:00:00Z",
    observacoes: null,
    motivo_cancelamento: null,
    ...overrides,
  } as Reserva;
}

describe("agruparContatos", () => {
  it("agrupa reservas do mesmo telefone em um único contato", () => {
    const contatos = agruparContatos([
      makeReserva({ id: "1", telefone: "11912345678", data: "2026-08-01" }),
      makeReserva({ id: "2", telefone: "11912345678", data: "2026-08-10" }),
    ]);
    expect(contatos).toHaveLength(1);
    expect(contatos[0].reservas).toBe(2);
    expect(contatos[0].ultimaData).toBe("2026-08-10");
  });

  it("mantém contatos com telefones diferentes separados", () => {
    const contatos = agruparContatos([
      makeReserva({ id: "1", nome: "Maria", telefone: "11911111111" }),
      makeReserva({ id: "2", nome: "João", telefone: "11922222222" }),
    ]);
    expect(contatos).toHaveLength(2);
  });

  it("usa o nome e status da reserva mais recente de cada contato", () => {
    const contatos = agruparContatos([
      makeReserva({ id: "1", nome: "Maria Antiga", telefone: "11911111111", data: "2026-08-01", status: "cancelada" }),
      makeReserva({ id: "2", nome: "Maria Nova", telefone: "11911111111", data: "2026-08-15", status: "confirmada" }),
    ]);
    expect(contatos[0].nome).toBe("Maria Nova");
    expect(contatos[0].ultimoStatus).toBe("confirmada");
  });

  it("ignora reservas sem nome ou sem telefone válido", () => {
    const contatos = agruparContatos([
      makeReserva({ id: "1", nome: "", telefone: "11911111111" }),
      makeReserva({ id: "2", nome: "Alguém", telefone: "" }),
    ]);
    expect(contatos).toHaveLength(0);
  });

  it("normaliza telefones equivalentes (com/sem 55, com/sem formatação) como o mesmo contato", () => {
    const contatos = agruparContatos([
      makeReserva({ id: "1", telefone: "(11) 91234-5678", data: "2026-08-01" }),
      makeReserva({ id: "2", telefone: "5511912345678", data: "2026-08-05" }),
    ]);
    expect(contatos).toHaveLength(1);
    expect(contatos[0].reservas).toBe(2);
  });

  it("ordena contatos pela reserva mais recente primeiro", () => {
    const contatos = agruparContatos([
      makeReserva({ id: "1", telefone: "11911111111", data: "2026-08-01" }),
      makeReserva({ id: "2", telefone: "11922222222", data: "2026-08-20" }),
    ]);
    expect(contatos[0].telefoneWhatsapp).toBe("5511922222222");
    expect(contatos[1].telefoneWhatsapp).toBe("5511911111111");
  });
});

describe("contatosToCsv", () => {
  it("gera cabeçalho e linhas com valores entre aspas", () => {
    const csv = contatosToCsv(
      agruparContatos([makeReserva({ nome: "Maria", telefone: "11912345678" })]),
    );
    const linhas = csv.split("\r\n");
    expect(linhas[0]).toBe('"Nome","Telefone","WhatsApp","Reservas","Última reserva","Último status"');
    expect(linhas[1]).toContain('"Maria"');
    expect(linhas[1]).toContain('"5511912345678"');
  });

  it("escapa aspas duplas dentro dos valores", () => {
    const csv = contatosToCsv(
      agruparContatos([makeReserva({ nome: 'Maria "Mari"', telefone: "11912345678" })]),
    );
    expect(csv).toContain('"Maria ""Mari"""');
  });
});
