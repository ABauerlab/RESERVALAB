import { describe, expect, it } from "vitest";

import {
  PLANOS,
  descontoAnualPercentual,
  formatarReais,
  intervaloDoMes,
  mensalDoAnualCentavos,
  planoEmVigor,
  planoMinimoPara,
  temRecurso,
  usoDeReservas,
} from "./plans";

describe("planos", () => {
  it("empresa sem registro vale como Pro de lancamento", () => {
    expect(planoEmVigor(undefined).id).toBe("pro");
    expect(planoEmVigor(null).id).toBe("pro");
    expect(planoEmVigor("qualquer coisa").id).toBe("pro");
    expect(planoEmVigor("gratuito").id).toBe("gratuito");
  });

  it("cardapio e Link Hub estao em todos os planos", () => {
    for (const p of Object.values(PLANOS)) {
      expect(temRecurso(p, "cardapio")).toBe(true);
      expect(temRecurso(p, "link_hub")).toBe(true);
    }
  });

  it("recursos de WhatsApp e IA escalam por plano", () => {
    expect(temRecurso(PLANOS.gratuito, "whatsapp_confirmacao")).toBe(false);
    expect(temRecurso(PLANOS.essencial, "whatsapp_confirmacao")).toBe(true);
    expect(temRecurso(PLANOS.essencial, "assistente_ia")).toBe(false);
    expect(temRecurso(PLANOS.pro, "assistente_ia")).toBe(true);
    expect(planoMinimoPara("whatsapp_confirmacao").id).toBe("essencial");
    expect(planoMinimoPara("assistente_ia").id).toBe("pro");
  });

  it("limites crescem e o gratuito e mais generoso que 25 e 30 do mercado", () => {
    expect(PLANOS.gratuito.reservasPorMes).toBeGreaterThan(30);
    expect(PLANOS.essencial.reservasPorMes).toBeGreaterThan(PLANOS.gratuito.reservasPorMes);
    expect(PLANOS.pro.reservasPorMes).toBeGreaterThan(PLANOS.essencial.reservasPorMes);
  });

  it("anual vale 10 meses (17% de desconto) nos planos pagos", () => {
    expect(descontoAnualPercentual(PLANOS.essencial)).toBe(17);
    expect(descontoAnualPercentual(PLANOS.pro)).toBe(17);
    expect(descontoAnualPercentual(PLANOS.gratuito)).toBe(0);
    expect(mensalDoAnualCentavos(PLANOS.essencial)).toBe(7417);
  });

  it("formata reais sem centavos quando inteiro", () => {
    expect(formatarReais(8900).replace(/\s/g, " ")).toBe("R$ 89");
    expect(formatarReais(7417).replace(/\s/g, " ")).toBe("R$ 74,17");
    expect(formatarReais(0).replace(/\s/g, " ")).toBe("R$ 0");
  });
});

describe("uso de reservas", () => {
  it("ok, perto (80%) e excedido; nunca bloqueia", () => {
    expect(usoDeReservas(10, PLANOS.gratuito)).toMatchObject({ estado: "ok", restantes: 30 });
    expect(usoDeReservas(32, PLANOS.gratuito).estado).toBe("perto");
    expect(usoDeReservas(40, PLANOS.gratuito)).toMatchObject({ estado: "perto", restantes: 0 });
    expect(usoDeReservas(41, PLANOS.gratuito)).toMatchObject({
      estado: "excedido",
      percentual: 100,
      restantes: 0,
    });
  });

  it("entrada negativa ou fracionada e normalizada", () => {
    expect(usoDeReservas(-3, PLANOS.essencial).usadas).toBe(0);
    expect(usoDeReservas(10.9, PLANOS.essencial).usadas).toBe(10);
  });
});

describe("intervalo do mes", () => {
  it("meio do ano e virada de dezembro", () => {
    expect(intervaloDoMes("2026-10-08")).toEqual({ inicio: "2026-10-01", fim: "2026-11-01" });
    expect(intervaloDoMes("2026-12-31")).toEqual({ inicio: "2026-12-01", fim: "2027-01-01" });
  });
});
