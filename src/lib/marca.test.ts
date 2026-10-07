import { describe, expect, it } from "vitest";

import { contraste, corValida, temaDaMarca } from "@/lib/marca";

describe("marca", () => {
  it("valida hex de 6 digitos", () => {
    expect(corValida("#B4552D")).toBe(true);
    expect(corValida("B4552D")).toBe(false);
    expect(corValida("#fff")).toBe(false);
    expect(corValida("red")).toBe(false);
    expect(corValida(null)).toBe(false);
  });

  it("contraste branco x preto e 21", () => {
    expect(Math.round(contraste("#ffffff", "#000000"))).toBe(21);
  });

  it("gera variaveis e escolhe o texto de maior contraste", () => {
    const escura = temaDaMarca("#1d4ed8")!;
    expect(escura["--primary"]).toBe("#1d4ed8");
    expect(escura["--primary-foreground"]).toBe("#ffffff");
    const media = temaDaMarca("#16a34a")!; // verde medio: texto escuro tem mais contraste
    expect(media["--primary-foreground"]).toBe("#0f172a");
  });

  it("recusa cor invalida ou clara demais para o fundo", () => {
    expect(temaDaMarca("azul")).toBeNull();
    expect(temaDaMarca("#fafafa")).toBeNull();
    expect(temaDaMarca(undefined)).toBeNull();
  });
});
