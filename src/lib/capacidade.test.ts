import { describe, expect, it } from "vitest";

import {
  cabeNaCasa,
  parseCapacidade,
  restanteNoHorario,
  type CapacidadeDoDia,
} from "@/lib/capacidade";

const cap: CapacidadeDoDia = { dia_restante: 10, horario_maximo: 6, por_horario: { "19:00": 2 } };

describe("capacidade", () => {
  it("parseCapacidade: vazio, zero e lixo viram sem limite", () => {
    expect(parseCapacidade("120")).toBe(120);
    expect(parseCapacidade("")).toBeNull();
    expect(parseCapacidade("0")).toBeNull();
    expect(parseCapacidade("abc")).toBeNull();
    expect(parseCapacidade("999999")).toBeNull();
  });
  it("sem limites configurados, tudo cabe", () => {
    expect(cabeNaCasa(null, "19:00", 500)).toEqual({ ok: true });
    expect(restanteNoHorario(null, "19:00")).toBe(Number.POSITIVE_INFINITY);
  });
  it("limite do horario: usa o restante, ou o maximo se ninguem reservou", () => {
    expect(cabeNaCasa(cap, "19:00", 2)).toEqual({ ok: true });
    expect(cabeNaCasa(cap, "19:00", 3)).toEqual({ ok: false, motivo: "horario" });
    expect(cabeNaCasa(cap, "20:00", 6)).toEqual({ ok: true });
    expect(cabeNaCasa(cap, "20:00", 7)).toEqual({ ok: false, motivo: "horario" });
  });
  it("limite do dia vence primeiro", () => {
    expect(cabeNaCasa(cap, "20:00", 11)).toEqual({ ok: false, motivo: "dia" });
    expect(cabeNaCasa(cap, null, 11)).toEqual({ ok: false, motivo: "dia" });
    expect(restanteNoHorario(cap, "20:00")).toBe(6);
    expect(restanteNoHorario({ ...cap, dia_restante: 4 }, "20:00")).toBe(4);
  });
});
