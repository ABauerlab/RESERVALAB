import { describe, expect, it } from "vitest";

import { clientesDeCasa, resumoDoDia } from "@/lib/dashboard";
import type { Reserva } from "@/lib/reservations";

const r = (id: string, status: string, horario: string | null, q: number, tel = "31988887777") =>
  ({
    id,
    nome: `Cliente ${id}`,
    telefone: tel,
    status,
    horario,
    quantidade: q,
    data: "2026-10-07",
  }) as unknown as Reserva;

describe("resumoDoDia", () => {
  const lista = [
    r("a", "confirmada", "12:00:00", 4),
    r("b", "pendente", "13:30:00", 2),
    r("c", "cancelada", "14:00:00", 8),
    r("d", "confirmada", null, 10),
    r("e", "confirmada", "20:00:00", 6),
  ];
  it("conta so reservas ativas e soma pessoas", () => {
    const s = resumoDoDia(lista, "2026-10-07", "2026-10-07", "09:00");
    expect(s).toMatchObject({ reservas: 4, pessoas: 22, pendentes: 1, canceladas: 1 });
  });
  it("hoje: proxima chegada e a primeira a partir de agora", () => {
    const s = resumoDoDia(lista, "2026-10-07", "2026-10-07", "13:00");
    expect(s.proxima?.id).toBe("b");
    expect(s.restantes).toBe(2);
  });
  it("depois do ultimo horario nao ha proxima chegada", () => {
    const s = resumoDoDia(lista, "2026-10-07", "2026-10-07", "22:00");
    expect(s.proxima).toBeNull();
    expect(s.restantes).toBe(0);
  });
  it("outro dia: a primeira do dia, sem filtrar por horario", () => {
    const s = resumoDoDia(lista, "2026-10-08", "2026-10-07", "22:00");
    expect(s.proxima?.id).toBe("a");
  });
  it("dia vazio", () => {
    expect(resumoDoDia([], "2026-10-07", "2026-10-07", "10:00")).toMatchObject({
      reservas: 0,
      proxima: null,
    });
  });
});

describe("clientesDeCasa", () => {
  const hist = [
    { telefone: "(31) 98888-7777", data: "2026-09-01", status: "finalizada" },
    { telefone: "31988887777", data: "2026-09-15", status: "confirmada" },
    { telefone: "5531988887777", data: "2026-09-20", status: "cancelada" },
    { telefone: "31977776666", data: "2026-09-10", status: "finalizada" },
    { telefone: "31988887777", data: "2026-10-07", status: "confirmada" },
  ] as never;
  it("junta telefones em formatos diferentes e ignora canceladas e o proprio dia", () => {
    const out = clientesDeCasa([r("a", "confirmada", "12:00:00", 4)], hist, "2026-10-07");
    expect(out).toHaveLength(1);
    expect(out[0]?.anteriores).toBe(2);
  });
  it("quem tem so 1 reserva anterior nao entra", () => {
    const out = clientesDeCasa(
      [r("b", "confirmada", "12:00:00", 2, "31977776666")],
      hist,
      "2026-10-07",
    );
    expect(out).toEqual([]);
  });
  it("reserva cancelada hoje nao conta e telefone repetido aparece uma vez", () => {
    const out = clientesDeCasa(
      [
        r("a", "confirmada", "12:00:00", 4),
        r("z", "confirmada", "20:00:00", 2),
        r("c", "cancelada", "13:00:00", 2),
      ],
      hist,
      "2026-10-07",
    );
    expect(out).toHaveLength(1);
  });
});
