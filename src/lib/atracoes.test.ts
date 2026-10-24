import { describe, expect, it } from "vitest";

import {
  datasSemanais,
  faixaHorario,
  gradeDoMes,
  mudarMes,
  parseMes,
  parseValor,
  resumoDoMes,
  textoDoMes,
  ultimoDia,
  type Atracao,
} from "@/lib/atracoes";

let seq = 0;
function atracao(over: Partial<Atracao> = {}): Atracao {
  seq += 1;
  return {
    id: `a${seq}`,
    tenant_id: "t1",
    data: "2026-10-03",
    horario_inicio: "20:00:00",
    horario_fim: null,
    titulo: `Atração ${seq}`,
    tipo: "musica_ao_vivo",
    status: "confirmada",
    contato: null,
    cache_valor: null,
    observacoes: null,
    updated_at: "2026-10-01T10:00:00Z",
    ...over,
  };
}

describe("meses", () => {
  it("muda de mês atravessando o ano", () => {
    expect(mudarMes("2026-12", 1)).toBe("2027-01");
    expect(mudarMes("2026-01", -1)).toBe("2025-12");
  });

  it("acha o último dia, inclusive em ano bissexto", () => {
    expect(ultimoDia("2026-10")).toBe("2026-10-31");
    expect(ultimoDia("2028-02")).toBe("2028-02-29");
    expect(ultimoDia("2026-02")).toBe("2026-02-28");
  });

  it("valida o parâmetro de mês", () => {
    expect(parseMes("2026-10", "2026-01")).toBe("2026-10");
    expect(parseMes("2026-13", "2026-01")).toBe("2026-01");
    expect(parseMes(undefined, "2026-01")).toBe("2026-01");
  });
});

describe("gradeDoMes", () => {
  it("monta semanas de domingo a sábado cobrindo o mês inteiro", () => {
    const grade = gradeDoMes("2026-10");
    expect(grade.every((s) => s.length === 7)).toBe(true);
    // 1/out/2026 é quinta: a primeira semana começa no domingo 27/set.
    expect(grade[0]![0]).toEqual({ iso: "2026-09-27", doMes: false });
    expect(grade[0]![4]).toEqual({ iso: "2026-10-01", doMes: true });
    const doMes = grade.flat().filter((c) => c.doMes);
    expect(doMes).toHaveLength(31);
  });
});

describe("datasSemanais", () => {
  it("repete o mesmo dia da semana até o fim do mês", () => {
    expect(datasSemanais("2026-10-03")).toEqual([
      "2026-10-03",
      "2026-10-10",
      "2026-10-17",
      "2026-10-24",
      "2026-10-31",
    ]);
    expect(datasSemanais("2026-10-31")).toEqual(["2026-10-31"]);
  });
});

describe("resumoDoMes", () => {
  it("ignora canceladas e outros meses, e conta dias sem atração", () => {
    const resumo = resumoDoMes("2026-10", [
      atracao({ data: "2026-10-03", status: "confirmada", cache_valor: 1000 }),
      atracao({ data: "2026-10-03", status: "ideia" }),
      atracao({ data: "2026-10-10", status: "negociando", cache_valor: 500 }),
      atracao({ data: "2026-10-17", status: "cancelada", cache_valor: 900 }),
      atracao({ data: "2026-11-07", status: "confirmada" }),
    ]);
    expect(resumo).toEqual({
      total: 3,
      confirmadas: 1,
      emAberto: 2,
      diasSemAtracao: 29,
      cachePrevisto: 1500,
    });
  });
});

describe("textoDoMes", () => {
  it("lista por data, marca pendentes e esconde canceladas", () => {
    const texto = textoDoMes(
      "2026-10",
      [
        atracao({
          data: "2026-10-10",
          titulo: "DJ Lua",
          status: "negociando",
          horario_inicio: "22:00:00",
        }),
        atracao({
          data: "2026-10-03",
          titulo: "Samba da Casa",
          horario_inicio: "20:00:00",
          horario_fim: "23:00:00",
        }),
        atracao({ data: "2026-10-17", titulo: "Cancelada", status: "cancelada" }),
      ],
      "Iracema",
    );
    expect(texto).toBe(
      [
        "*Atrações de Outubro de 2026 | Iracema*",
        "03/10 sáb 20:00 às 23:00: Samba da Casa",
        "10/10 sáb 22:00: DJ Lua (negociando)",
      ].join("\n"),
    );
  });

  it("avisa quando não há nada", () => {
    expect(textoDoMes("2026-10", [], "")).toContain("Nenhuma atração cadastrada.");
  });
});

describe("faixaHorario e parseValor", () => {
  it("formata a faixa", () => {
    expect(faixaHorario({ horario_inicio: "20:00:00", horario_fim: "23:30:00" })).toBe(
      "20:00 às 23:30",
    );
    expect(faixaHorario({ horario_inicio: null, horario_fim: null })).toBe("");
  });

  it("lê valores em formato brasileiro", () => {
    expect(parseValor("")).toBeNull();
    expect(parseValor("1500")).toBe(1500);
    expect(parseValor("1.500,50")).toBe(1500.5);
    expect(parseValor("abc")).toBeNaN();
    expect(parseValor("-10")).toBeNaN();
  });
});
