import { describe, expect, it } from "vitest";

import { parseReservasBusca } from "@/lib/reservas-busca";

const ID = "3f2b8c1e-5d4a-4e9b-8a7c-1d2e3f4a5b6c";

describe("parseReservasBusca", () => {
  it("vazio e padrao", () => {
    expect(parseReservasBusca({})).toEqual({});
  });
  it("um dia valido na URL vira periodo 'dia'", () => {
    expect(parseReservasBusca({ dia: "2026-10-21" })).toEqual({
      periodo: "dia",
      dia: "2026-10-21",
    });
  });
  it("dia invalido ou periodo 'dia' sem data sao descartados", () => {
    expect(parseReservasBusca({ dia: "2026-02-31" })).toEqual({});
    expect(parseReservasBusca({ periodo: "dia" })).toEqual({});
  });
  it("mantem filtros validos e descarta o resto", () => {
    expect(
      parseReservasBusca({
        periodo: "mes",
        status: "pendente",
        tipo: "evento",
        area: "varanda",
        q: " ana ",
        reserva: ID,
      }),
    ).toEqual({
      periodo: "mes",
      status: "pendente",
      tipo: "evento",
      area: "varanda",
      q: " ana ",
      reserva: ID,
    });
    expect(parseReservasBusca({ periodo: "x", status: "y", tipo: "z", reserva: "../1" })).toEqual(
      {},
    );
  });
  it("valores padrao nao poluem a URL", () => {
    expect(parseReservasBusca({ periodo: "semana", status: "todos", encerradas: "ambas" })).toEqual(
      {},
    );
  });
});
