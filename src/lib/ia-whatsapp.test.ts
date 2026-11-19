import { describe, expect, it } from "vitest";
import { chaveTelefone, conversaPausada, descreverPausa, parseIaEstado } from "./ia-whatsapp";

describe("ia-whatsapp", () => {
  it("parseia o estado e trata ausência como ligado", () => {
    expect(parseIaEstado(null)).toEqual({ ativo: true, pausadas: [] });
    const e = parseIaEstado({
      ativo: false,
      pausadas: [
        { telefone: "5538998647210", pausado_ate: null, criado_em: "2026-11-18T10:00:00Z" },
        {},
      ],
    });
    expect(e.ativo).toBe(false);
    expect(e.pausadas).toHaveLength(1);
  });

  it("usa a mesma chave do banco: ignora DDI, DDD e o 9 extra", () => {
    expect(chaveTelefone("(38) 9864-7210")).toBe("98647210");
    expect(chaveTelefone("5538998647210")).toBe("98647210");
    expect(chaveTelefone("553898647210")).toBe("98647210");
  });

  it("reconhece conversa pausada por qualquer formato do número", () => {
    const e = parseIaEstado({ pausadas: [{ telefone: "5538998647210" }] });
    expect(conversaPausada(e, "38 9864-7210")).toBe(true);
    expect(conversaPausada(e, "31 99999-0000")).toBe(false);
    expect(conversaPausada(undefined, "38 9864-7210")).toBe(false);
    expect(conversaPausada(e, "123")).toBe(false);
  });

  it("descreve a pausa", () => {
    const agora = new Date("2026-11-18T12:00:00Z");
    expect(descreverPausa({ telefone: "1", pausadoAte: null, criadoEm: "" }, agora)).toBe(
      "até você religar",
    );
    expect(
      descreverPausa({ telefone: "1", pausadoAte: "2026-11-18T10:00:00Z", criadoEm: "" }, agora),
    ).toBe("expirada");
    expect(
      descreverPausa({ telefone: "1", pausadoAte: "2026-11-19T12:00:00Z", criadoEm: "" }, agora),
    ).toMatch(/^até /);
  });
});
