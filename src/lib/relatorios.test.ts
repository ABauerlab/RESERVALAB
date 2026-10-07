import { describe, expect, it } from "vitest";

import { buildRelatorio } from "@/lib/relatorios";
import type { Reserva } from "@/lib/reservations";

function r(o: Partial<Reserva>): Reserva {
  return {
    id: "1",
    tenant_id: "t",
    nome: "A",
    telefone: "11999999999",
    tipo: "mesa",
    status: "confirmada",
    data: "2026-10-07",
    horario: "12:00:00",
    quantidade: 2,
    motivo_cancelamento: null,
    ...o,
  } as Reserva;
}

describe("buildRelatorio", () => {
  it("conta por status e tipo, pessoas e taxa", () => {
    const x = buildRelatorio([
      r({ status: "confirmada", quantidade: 4 }),
      r({ status: "finalizada", quantidade: 2, tipo: "aniversario" }),
      r({ status: "pendente", quantidade: 10 }),
      r({ status: "cancelada", quantidade: 5 }),
    ]);
    expect(x.total).toBe(4);
    expect(x.porStatus).toMatchObject({ confirmada: 1, finalizada: 1, pendente: 1, cancelada: 1 });
    expect(x.porTipo.aniversario).toBe(1);
    expect(x.pessoasAtendidas).toBe(6);
    expect(x.taxaConfirmacao).toBe(50);
  });

  it("dia da semana e hora ignoram canceladas; sem horario e contado a parte", () => {
    const x = buildRelatorio([
      r({ data: "2026-10-07", horario: "12:30:00" }), // quarta
      r({ data: "2026-10-07", horario: "12:00:00" }),
      r({ data: "2026-10-10", horario: null }), // sabado
      r({ data: "2026-10-07", horario: "20:00:00", status: "cancelada" }),
    ]);
    expect(x.porDiaSemana[3]).toBe(2);
    expect(x.porDiaSemana[6]).toBe(1);
    expect(x.porHora).toEqual([{ hora: 12, reservas: 2 }]);
    expect(x.semHorario).toBe(1);
  });

  it("motivos de cancelamento agrupam sem diferenciar maiusculas e limitam a 5", () => {
    const m = (t: string) => r({ status: "cancelada", motivo_cancelamento: t });
    const x = buildRelatorio([
      m("Cliente desistiu"),
      m("cliente desistiu "),
      m("Outro"),
      m("A"),
      m("B"),
      m("C"),
      m("D"),
      r({ status: "cancelada", motivo_cancelamento: "  " }),
    ]);
    expect(x.motivos[0]).toEqual({ motivo: "Cliente desistiu", total: 2 });
    expect(x.motivos).toHaveLength(5);
  });

  it("lista vazia nao quebra", () => {
    const x = buildRelatorio([]);
    expect(x.total).toBe(0);
    expect(x.taxaConfirmacao).toBe(0);
    expect(x.porHora).toEqual([]);
  });
});
