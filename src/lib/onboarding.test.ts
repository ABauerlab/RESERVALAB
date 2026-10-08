import { describe, expect, it } from "vitest";

import {
  caminhoDoPasso,
  deveMostrar,
  estadoDoUsuario,
  limitarPasso,
  mesmaPagina,
  passosDoTour,
} from "@/lib/onboarding";

describe("onboarding: quem ve o tour", () => {
  it("usuario novo sem estado ve; sem data de criacao conta como novo", () => {
    expect(deveMostrar({ created_at: "2026-10-09T10:00:00Z", user_metadata: {} })).toBe(true);
    expect(deveMostrar({ user_metadata: null })).toBe(true);
  });
  it("quem concluiu ou pulou nao ve de novo", () => {
    for (const k of ["concluido_em", "pulado_em"]) {
      expect(
        deveMostrar({
          created_at: "2026-10-09T00:00:00Z",
          user_metadata: { teggly_onboarding: { versao: 1, [k]: "2026-10-09T10:00:00Z" } },
        }),
      ).toBe(false);
    }
  });
  it("usuario antigo (criado antes do lancamento) nao ve sozinho", () => {
    expect(deveMostrar({ created_at: "2026-09-01T00:00:00Z", user_metadata: {} })).toBe(false);
  });
  it("estado malformado e ignorado", () => {
    expect(estadoDoUsuario({ user_metadata: { teggly_onboarding: "x" } })).toBeNull();
  });
});

describe("passos do tour", () => {
  const ids = (w: boolean, a = false) =>
    passosDoTour({ whatsapp: w, assistente: a }).map((p) => p.id);
  it("passeia pelas telas reais e volta ao Dashboard na conclusao", () => {
    expect(ids(false)).toEqual([
      "inicio",
      "hoje",
      "reservas",
      "agenda",
      "cardapio",
      "hub",
      "eventos",
      "ajustes",
      "fim",
    ]);
    const p = passosDoTour({ whatsapp: false, assistente: false });
    expect(p.map((x) => x.rota)).toEqual([
      "",
      "",
      "/reservas",
      "/agenda",
      "/cardapio",
      "/links",
      "/eventos",
      "/configuracoes",
      "",
    ]);
  });
  it("caminho e comparacao de pagina", () => {
    expect(caminhoDoPasso("iracema", { rota: "/reservas" })).toBe("/iracema/admin/reservas");
    expect(caminhoDoPasso("iracema", { rota: "" })).toBe("/iracema/admin");
    expect(caminhoDoPasso("iracema", {})).toBeNull();
    expect(mesmaPagina("/iracema/admin/", "/iracema/admin")).toBe(true);
    expect(mesmaPagina("/iracema/admin/agenda", "/iracema/admin")).toBe(false);
  });
  it("passo de WhatsApp so aparece quando o plano inclui", () => {
    expect(ids(true)).toContain("whatsapp");
    expect(ids(false)).not.toContain("whatsapp");
  });
  it("curto: no maximo 10 passos", () => {
    expect(ids(true, true).length).toBeLessThanOrEqual(10);
  });
  it("sem emoji nem travessao nos textos", () => {
    for (const p of passosDoTour({ whatsapp: true, assistente: true })) {
      expect(`${p.titulo} ${p.texto}`).not.toMatch(/[—–]|\p{Extended_Pictographic}/u);
    }
  });
});

describe("limitarPasso", () => {
  it("mantem dentro do intervalo", () => {
    expect(limitarPasso(-3, 5)).toBe(0);
    expect(limitarPasso(9, 5)).toBe(4);
    expect(limitarPasso(NaN, 5)).toBe(0);
  });
});
