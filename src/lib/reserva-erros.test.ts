import { describe, expect, it } from "vitest";

import { mensagemErroReserva } from "@/lib/reserva-erros";

describe("mensagemErroReserva", () => {
  it("traduz as regras da casa", () => {
    expect(mensagemErroReserva({ message: "Data ou horario indisponivel" }, "x")).toMatch(
      /não está disponível/,
    );
    expect(mensagemErroReserva({ message: "Reserva nao pode ser alterada" }, "x")).toMatch(
      /não pode mais/,
    );
    expect(mensagemErroReserva({ message: "Reserva nao encontrada" }, "x")).toMatch(
      /Não encontramos/,
    );
  });
  it("usa o padrao para erros desconhecidos", () => {
    expect(mensagemErroReserva(new Error("boom"), "Padrão")).toBe("Padrão");
    expect(mensagemErroReserva(null, "Padrão")).toBe("Padrão");
  });
});
