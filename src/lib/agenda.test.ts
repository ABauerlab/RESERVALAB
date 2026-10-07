import { describe, expect, it } from "vitest";

import { addDaysISO, todayISO } from "@/lib/admin-dates";
import {
  bloqueioCobre,
  buildAgendaDia,
  buildWeekStrip,
  grupoLabel,
  mondayIndex,
  parseDiaParam,
  precisaAtencao,
  reservaDentroDeBloqueio,
  resolveSelectedDay,
  weekRange,
  type Bloqueio,
  type Feriado,
  type EventoDestaque,
} from "@/lib/agenda";
import type { Reserva } from "@/lib/reservations";

let seq = 0;
function reserva(over: Partial<Reserva> = {}): Reserva {
  seq += 1;
  return {
    id: `r${seq}`,
    tenant_id: "t1",
    codigo_acompanhamento: `RL-${seq}`,
    tipo: "mesa",
    nome: `Cliente ${seq}`,
    telefone: "31999999999",
    quantidade: 2,
    data: "2026-10-07",
    horario: "19:00:00",
    area: null,
    leva_bolo: null,
    comandas: null,
    tipo_evento: null,
    observacoes: null,
    status: "confirmada",
    created_at: `2026-10-01T10:00:${String(seq).padStart(2, "0")}Z`,
    updated_at: "2026-10-01T10:00:00Z",
    motivo_cancelamento: null,
    reconfirmada_em: null,
    ...over,
  } as Reserva;
}
const bloqueio = (over: Partial<Bloqueio> = {}): Bloqueio =>
  ({
    id: "b1",
    tenant_id: "t1",
    data: "2026-10-07",
    hora_inicio: null,
    hora_fim: null,
    motivo: null,
    created_at: "",
    updated_at: "",
    ...over,
  }) as Bloqueio;
const feriado = (data: string): Feriado =>
  ({ id: "f1", tenant_id: "t1", data, motivo: "Feriado", created_at: "" }) as Feriado;
const evento = (data: string): EventoDestaque =>
  ({
    id: "e1",
    tenant_id: "t1",
    data,
    titulo: "Jazz",
    descricao: null,
    horario: "20:00:00",
    imagem_url: null,
    created_at: "",
  }) as EventoDestaque;

describe("datas e semana (segunda a domingo)", () => {
  it("valida ?dia= como data ISO real", () => {
    expect(parseDiaParam("2026-10-07")).toBe("2026-10-07");
    expect(parseDiaParam("2026-02-30")).toBeNull();
    expect(parseDiaParam("2026-13-01")).toBeNull();
    expect(parseDiaParam("07/10/2026")).toBeNull();
    expect(parseDiaParam(undefined)).toBeNull();
    expect(parseDiaParam(20261007)).toBeNull();
  });

  it("aceita 29/02 só em ano bissexto", () => {
    expect(parseDiaParam("2028-02-29")).toBe("2028-02-29");
    expect(parseDiaParam("2027-02-29")).toBeNull();
  });

  it("segunda = 0 e domingo = 6", () => {
    expect(mondayIndex("2026-10-05")).toBe(0); // segunda
    expect(mondayIndex("2026-10-07")).toBe(2); // quarta
    expect(mondayIndex("2026-10-11")).toBe(6); // domingo
  });

  it("quarta cai na semana de segunda 05/10 a domingo 11/10", () => {
    const r = weekRange("2026-10-07");
    expect(r.weekStart).toBe("2026-10-05");
    expect(r.weekEnd).toBe("2026-10-11");
    expect(r.days).toHaveLength(7);
    expect(r.days[0]).toBe("2026-10-05");
    expect(r.days[6]).toBe("2026-10-11");
    expect(r.selectedDay).toBe("2026-10-07");
  });

  it("domingo pertence à semana que termina nele, não à seguinte", () => {
    const r = weekRange("2026-10-11");
    expect(r.weekStart).toBe("2026-10-05");
    expect(r.weekEnd).toBe("2026-10-11");
  });

  it("segunda inicia a própria semana", () => {
    expect(weekRange("2026-10-12").weekStart).toBe("2026-10-12");
  });

  it("atravessa virada de mês e de ano", () => {
    expect(weekRange("2026-10-01").weekStart).toBe("2026-09-28");
    expect(weekRange("2027-01-01").weekStart).toBe("2026-12-28");
    expect(weekRange("2027-01-01").weekEnd).toBe("2027-01-03");
  });

  it("sem ?dia= usa o fallback (hoje por padrão); inválido também", () => {
    expect(resolveSelectedDay(undefined)).toBe(todayISO());
    expect(resolveSelectedDay("lixo", "2026-10-07")).toBe("2026-10-07");
    expect(resolveSelectedDay("2026-10-09", "2026-10-07")).toBe("2026-10-09");
  });
});

describe("rótulos informativos (nunca capacidade)", () => {
  it("mais de 30 = Grupo grande; mais de 50 = Evento fechado", () => {
    expect(grupoLabel(null)).toBeNull();
    expect(grupoLabel(30)).toBeNull();
    expect(grupoLabel(31)).toBe("Grupo grande");
    expect(grupoLabel(50)).toBe("Grupo grande");
    expect(grupoLabel(51)).toBe("Evento fechado");
    expect(grupoLabel(180)).toBe("Evento fechado");
  });
});

describe("bloqueio cobre reserva (mesma regra do servidor)", () => {
  it("dia inteiro cobre qualquer horário e também reserva sem horário", () => {
    const b = bloqueio();
    expect(bloqueioCobre(b, "2026-10-07", "12:00:00")).toBe(true);
    expect(bloqueioCobre(b, "2026-10-07", null)).toBe(true);
    expect(bloqueioCobre(b, "2026-10-08", "12:00:00")).toBe(false);
  });

  it("faixa inclui as duas pontas", () => {
    const b = bloqueio({ hora_inicio: "12:00:00", hora_fim: "15:00:00" });
    expect(bloqueioCobre(b, "2026-10-07", "11:59:00")).toBe(false);
    expect(bloqueioCobre(b, "2026-10-07", "12:00:00")).toBe(true);
    expect(bloqueioCobre(b, "2026-10-07", "15:00:00")).toBe(true);
    expect(bloqueioCobre(b, "2026-10-07", "15:01:00")).toBe(false);
  });

  it("só início cobre até o fim do dia; só fim cobre desde o começo", () => {
    expect(bloqueioCobre(bloqueio({ hora_inicio: "18:00:00" }), "2026-10-07", "23:30:00")).toBe(
      true,
    );
    expect(bloqueioCobre(bloqueio({ hora_inicio: "18:00:00" }), "2026-10-07", "17:59:00")).toBe(
      false,
    );
    expect(bloqueioCobre(bloqueio({ hora_fim: "12:00:00" }), "2026-10-07", "08:00:00")).toBe(true);
  });

  it("reserva sem horário não é coberta por bloqueio de faixa", () => {
    const b = bloqueio({ hora_inicio: "12:00:00", hora_fim: "15:00:00" });
    expect(bloqueioCobre(b, "2026-10-07", null)).toBe(false);
  });

  it("só reserva ativa (pendente ou confirmada) é marcada como dentro de bloqueio", () => {
    const b = [bloqueio()];
    expect(reservaDentroDeBloqueio(reserva({ status: "cancelada" }), b)).toBe(false);
    expect(reservaDentroDeBloqueio(reserva({ status: "confirmada" }), b)).toBe(true);
    expect(reservaDentroDeBloqueio(reserva({ status: "pendente" }), b)).toBe(true);
    expect(reservaDentroDeBloqueio(reserva({ status: "finalizada" }), b)).toBe(false);
  });
});

describe("Precisa de atenção", () => {
  it("pendente e dentro de bloqueio pedem atenção", () => {
    expect(precisaAtencao(reserva({ status: "pendente" }), false)).toBe(true);
    expect(precisaAtencao(reserva({ status: "confirmada", data: "2030-01-01" }), true)).toBe(true);
  });

  it("confirmada de hoje sem reconfirmação pede atenção; reconfirmada não", () => {
    const hoje = todayISO();
    expect(precisaAtencao(reserva({ data: hoje }), false)).toBe(true);
    expect(
      precisaAtencao(reserva({ data: hoje, reconfirmada_em: "2026-10-01T00:00:00Z" }), false),
    ).toBe(false);
    expect(precisaAtencao(reserva({ data: addDaysISO(hoje, 5) }), false)).toBe(false);
  });

  it("cancelada e finalizada não pedem atenção", () => {
    expect(precisaAtencao(reserva({ status: "cancelada" }), true)).toBe(false);
    expect(precisaAtencao(reserva({ status: "finalizada" }), true)).toBe(false);
  });
});

describe("linha do tempo do dia", () => {
  const base = { dia: "2026-10-07", bloqueios: [], feriados: [], eventos: [] };

  it("agrupa por hora cheia SEM arredondar nem mover horários", () => {
    const a = reserva({ horario: "19:00:00" });
    const b = reserva({ horario: "19:10:00" });
    const c = reserva({ horario: "19:30:00" });
    const d = reserva({ horario: "20:05:00" });
    const dia = buildAgendaDia({ ...base, reservas: [d, c, b, a] });
    expect(dia.horas.map((h) => h.label)).toEqual(["19h", "20h"]);
    expect(dia.horas[0].items.map((x) => x.reserva.horario)).toEqual([
      "19:00:00",
      "19:10:00",
      "19:30:00",
    ]);
    expect(dia.horas[1].items[0].reserva.horario).toBe("20:05:00");
  });

  it("mantém a ordem estável: mesmo horário, mais recente primeiro", () => {
    const antiga = reserva({ horario: "19:00:00", created_at: "2026-10-01T09:00:00Z" });
    const nova = reserva({ horario: "19:00:00", created_at: "2026-10-02T09:00:00Z" });
    const dia = buildAgendaDia({ ...base, reservas: [antiga, nova] });
    expect(dia.horas[0].items.map((x) => x.reserva.id)).toEqual([nova.id, antiga.id]);
  });

  it("reserva sem horário não ganha horário e fica separada", () => {
    const sem = reserva({ horario: null, tipo: "casamento" });
    const com = reserva({ horario: "12:00:00" });
    const dia = buildAgendaDia({ ...base, reservas: [sem, com] });
    expect(dia.semHorario).toHaveLength(1);
    expect(dia.semHorario[0].reserva.horario).toBeNull();
    expect(dia.horas).toHaveLength(1);
    expect(dia.horas[0].items[0].reserva.id).toBe(com.id);
  });

  it("só considera o dia pedido", () => {
    const outro = reserva({ data: "2026-10-08" });
    const dia = buildAgendaDia({ ...base, reservas: [outro] });
    expect(dia.horas).toHaveLength(0);
    expect(dia.resumo.reservas).toBe(0);
  });

  it("resumo e grupos contam pessoas sem canceladas; canceladas aparecem à parte", () => {
    const rs = [
      reserva({ quantidade: 4 }),
      reserva({ quantidade: 6, status: "pendente" }),
      reserva({ quantidade: 10, status: "cancelada" }),
    ];
    const dia = buildAgendaDia({ ...base, reservas: rs });
    expect(dia.resumo).toMatchObject({ reservas: 2, pessoas: 10, pendentes: 1, canceladas: 1 });
    expect(dia.horas[0].items).toHaveLength(2);
    expect(dia.horas[0].reservas).toBe(2);
    expect(dia.horas[0].pessoas).toBe(10);
  });

  it("Mostrar canceladas inclui as canceladas nas listas sem somar nas contagens", () => {
    const rs = [reserva({ quantidade: 4 }), reserva({ quantidade: 10, status: "cancelada" })];
    const dia = buildAgendaDia({
      ...base,
      reservas: rs,
      filtros: { soAtencao: false, mostrarCanceladas: true },
    });
    expect(dia.horas[0].items).toHaveLength(2);
    expect(dia.horas[0].reservas).toBe(1);
    expect(dia.horas[0].pessoas).toBe(4);
    expect(dia.resumo.canceladas).toBe(1);
  });

  it("Precisa de atenção filtra a lista, mas o resumo do dia continua completo", () => {
    // Dia distante de hoje: a confirmada não cai na regra de reconfirmação próxima.
    const futuro = "2030-03-06";
    const rs = [
      reserva({ data: futuro, status: "pendente", quantidade: 3 }),
      reserva({ data: futuro, status: "confirmada", quantidade: 5 }),
    ];
    const dia = buildAgendaDia({
      ...base,
      dia: futuro,
      reservas: rs,
      filtros: { soAtencao: true, mostrarCanceladas: false },
    });
    expect(dia.horas[0].items).toHaveLength(1);
    expect(dia.horas[0].items[0].reserva.status).toBe("pendente");
    expect(dia.resumo.reservas).toBe(2);
    expect(dia.resumo.atencao).toBe(1);
  });

  it("marca dentro de bloqueio e grupo, sem alterar a reserva", () => {
    const r = reserva({ horario: "13:00:00", quantidade: 56 });
    const copia = { ...r };
    const dia = buildAgendaDia({
      ...base,
      reservas: [r],
      bloqueios: [bloqueio({ hora_inicio: "12:00:00", hora_fim: "15:00:00" })],
    });
    const item = dia.horas[0].items[0];
    expect(item.dentroBloqueio).toBe(true);
    expect(item.grupo).toBe("Evento fechado");
    expect(item.atencao).toBe(true);
    expect(item.reserva).toEqual(copia);
    expect(dia.resumo.dentroBloqueio).toBe(1);
  });

  it("contexto: bloqueios, feriado (não fecha o dia) e eventos do dia", () => {
    const dia = buildAgendaDia({
      ...base,
      reservas: [reserva()],
      bloqueios: [bloqueio(), bloqueio({ id: "b2", data: "2026-10-09" })],
      feriados: [feriado("2026-10-07")],
      eventos: [evento("2026-10-07"), evento("2026-10-08")],
    });
    expect(dia.contexto.bloqueios).toHaveLength(1);
    expect(dia.contexto.feriado?.data).toBe("2026-10-07");
    expect(dia.contexto.eventos).toHaveLength(1);
    // feriado e evento não removem nem alteram reservas
    expect(dia.horas[0].items).toHaveLength(1);
  });
});

describe("faixa da semana", () => {
  it("devolve 7 dias com contagem simples, sem ocupação", () => {
    const range = weekRange("2026-10-07");
    const strip = buildWeekStrip({
      range,
      reservas: [
        reserva({ data: "2026-10-07", quantidade: 4 }),
        reserva({ data: "2026-10-07", quantidade: 6, status: "pendente" }),
        reserva({ data: "2026-10-07", quantidade: 9, status: "cancelada" }),
        reserva({ data: "2026-10-09", quantidade: 2 }),
      ],
      bloqueios: [bloqueio({ data: "2026-10-09" })],
      feriados: [feriado("2026-10-10")],
      eventos: [evento("2026-10-11")],
      hoje: "2026-10-07",
    });
    expect(strip.map((d) => d.weekday)).toEqual(["seg", "ter", "qua", "qui", "sex", "sáb", "dom"]);
    const qua = strip[2];
    expect(qua).toMatchObject({
      iso: "2026-10-07",
      dayNumber: 7,
      selected: true,
      hoje: true,
      reservas: 2,
      pessoas: 10,
      pendentes: 1,
    });
    expect(strip[4]).toMatchObject({ reservas: 1, bloqueio: true, dentroBloqueio: 1 });
    expect(strip[5].feriado).toBe(true);
    expect(strip[6].evento).toBe(true);
    expect(strip.filter((d) => d.selected)).toHaveLength(1);
    // nenhum campo de capacidade/ocupação
    expect(Object.keys(qua).join(",")).not.toMatch(/ocupa|capacidade|lota|vagas|disponib/i);
  });
});
