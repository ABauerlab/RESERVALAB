import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { cacheHasReservaId, deletedIdIsInCache } from "./agenda-realtime";

describe("cacheHasReservaId", () => {
  it("lê listas e objetos { reservas }", () => {
    expect(cacheHasReservaId([{ id: "a" }], "a")).toBe(true);
    expect(cacheHasReservaId({ reservas: [{ id: "a" }], truncado: false }, "a")).toBe(true);
    expect(cacheHasReservaId({ reservas: [{ id: "a" }] }, "b")).toBe(false);
  });
  it("ignora formatos inesperados", () => {
    expect(cacheHasReservaId(undefined, "a")).toBe(false);
    expect(cacheHasReservaId({ foo: 1 }, "a")).toBe(false);
    expect(cacheHasReservaId([null, 3], "a")).toBe(false);
  });
});

describe("deletedIdIsInCache", () => {
  const qc = new QueryClient();
  qc.setQueryData(["reservas", "t1", "agenda-semana", "2026-10-05", "2026-10-11"], {
    reservas: [{ id: "r1" }],
    truncado: false,
  });
  qc.setQueryData(["reservas", "t2", "lista"], [{ id: "r2" }]);

  it("só reage a ids do cache do próprio tenant", () => {
    expect(deletedIdIsInCache(qc, "t1", "r1")).toBe(true);
    expect(deletedIdIsInCache(qc, "t1", "r2")).toBe(false);
    expect(deletedIdIsInCache(qc, "t1", "desconhecido")).toBe(false);
  });
  it("rejeita id inválido", () => {
    expect(deletedIdIsInCache(qc, "t1", undefined)).toBe(false);
    expect(deletedIdIsInCache(qc, "t1", 5)).toBe(false);
  });
});
