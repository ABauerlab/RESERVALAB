import { describe, expect, it } from "vitest";

import {
  AGENDA_LIMITE_RESERVAS,
  fetchBloqueiosIntervalo,
  fetchEventosIntervalo,
  fetchFeriadosIntervalo,
  fetchReservasIntervalo,
} from "@/lib/agenda-queries";

type Call = [string, unknown[]];

/** Cliente falso que registra a cadeia de chamadas e devolve `rows` ao final. */
function fakeClient(rows: unknown[] = []) {
  const calls: Call[] = [];
  const builder: Record<string, unknown> = {};
  const chain =
    (name: string) =>
    (...args: unknown[]) => {
      calls.push([name, args]);
      return builder;
    };
  for (const m of ["select", "eq", "gte", "lte", "order", "limit"]) builder[m] = chain(m);
  builder.then = (resolve: (v: unknown) => unknown) => resolve({ data: rows, error: null });
  const client = {
    from(table: string) {
      calls.push(["from", [table]]);
      return builder;
    },
  };
  return { client: client as never, calls };
}

const has = (calls: Call[], name: string, ...args: unknown[]) =>
  calls.some(([n, a]) => n === name && args.every((v, i) => a[i] === v));

describe("consultas da Agenda: tenant_id sempre explícito", () => {
  const casos: Array<[string, string, (c: never) => Promise<unknown>]> = [
    ["reservas", "reservas", (c) => fetchReservasIntervalo(c, "T1", "2026-10-05", "2026-10-11")],
    [
      "agenda_bloqueios",
      "agenda_bloqueios",
      (c) => fetchBloqueiosIntervalo(c, "T1", "2026-10-05", "2026-10-11"),
    ],
    ["feriados", "feriados", (c) => fetchFeriadosIntervalo(c, "T1", "2026-10-05", "2026-10-11")],
    [
      "eventos_destaque",
      "eventos_destaque",
      (c) => fetchEventosIntervalo(c, "T1", "2026-10-05", "2026-10-11"),
    ],
  ];

  for (const [nome, tabela, run] of casos) {
    it(`${nome}: filtra por tenant_id e pelo intervalo, só leitura`, async () => {
      const { client, calls } = fakeClient();
      await run(client);
      expect(has(calls, "from", tabela)).toBe(true);
      expect(has(calls, "eq", "tenant_id", "T1")).toBe(true);
      expect(has(calls, "gte", "data", "2026-10-05")).toBe(true);
      expect(has(calls, "lte", "data", "2026-10-11")).toBe(true);
      const nomes = calls.map(([n]) => n);
      expect(nomes).toContain("select");
      for (const proibido of ["insert", "update", "delete", "upsert", "rpc"]) {
        expect(nomes).not.toContain(proibido);
      }
    });
  }

  it("reservas: limite de 500 e sinaliza truncamento", async () => {
    const cheio = Array.from({ length: AGENDA_LIMITE_RESERVAS }, (_, i) => ({ id: String(i) }));
    const { client, calls } = fakeClient(cheio);
    const r = await fetchReservasIntervalo(client, "T1", "2026-10-05", "2026-10-11");
    expect(has(calls, "limit", AGENDA_LIMITE_RESERVAS)).toBe(true);
    expect(r.truncado).toBe(true);
    const pouco = await fetchReservasIntervalo(fakeClient([{ id: "1" }]).client, "T1", "a", "b");
    expect(pouco.truncado).toBe(false);
  });

  it("reservas: ordena por data, horário (sem horário por último) e criação", async () => {
    const { client, calls } = fakeClient();
    await fetchReservasIntervalo(client, "T1", "2026-10-05", "2026-10-11");
    const orders = calls.filter(([n]) => n === "order").map(([, a]) => a);
    expect(orders[0][0]).toBe("data");
    expect(orders[1]).toEqual(["horario", { ascending: true, nullsFirst: false }]);
    expect(orders[2]).toEqual(["created_at", { ascending: false }]);
  });
});
