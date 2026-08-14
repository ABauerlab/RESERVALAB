import { describe, expect, it } from "vitest";
import { isValidEmail, isValidNome, isValidSenha, isValidSlug, slugify } from "@/lib/validators";

describe("slugify", () => {
  it("converte para minúsculas e troca espaços/caracteres inválidos por hífen", () => {
    expect(slugify("Meu Restaurante!")).toBe("meu-restaurante-");
  });

  it("remove espaços nas pontas", () => {
    expect(slugify("  bar-legal  ")).toBe("bar-legal");
  });
});

describe("isValidSlug", () => {
  it("aceita slugs com letras minúsculas, números e hífen (3-41 chars)", () => {
    expect(isValidSlug("bar-legal")).toBe(true);
    expect(isValidSlug("a1")).toBe(true);
  });

  it("rejeita slug de um único caractere", () => {
    expect(isValidSlug("a")).toBe(false);
  });

  it("rejeita slug começando com hífen", () => {
    expect(isValidSlug("-bar")).toBe(false);
  });

  it("rejeita slug com maiúsculas ou caracteres especiais", () => {
    expect(isValidSlug("Bar-Legal")).toBe(false);
    expect(isValidSlug("bar_legal")).toBe(false);
    expect(isValidSlug("bar legal")).toBe(false);
  });

  it("rejeita slug acima de 41 caracteres", () => {
    expect(isValidSlug("a".repeat(42))).toBe(false);
    expect(isValidSlug("a".repeat(41))).toBe(true);
  });
});

describe("isValidEmail", () => {
  it("aceita e-mails com formato válido", () => {
    expect(isValidEmail("contato@exemplo.com")).toBe(true);
    expect(isValidEmail("a.b+c@sub.exemplo.com.br")).toBe(true);
  });

  it("rejeita e-mails sem @ ou sem domínio", () => {
    expect(isValidEmail("invalido")).toBe(false);
    expect(isValidEmail("invalido@")).toBe(false);
    expect(isValidEmail("invalido@dominio")).toBe(false);
  });

  it("rejeita valores nulos/indefinidos/vazios", () => {
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("isValidNome", () => {
  it("exige ao menos 2 caracteres após remover espaços", () => {
    expect(isValidNome("Jo")).toBe(true);
    expect(isValidNome("J")).toBe(false);
    expect(isValidNome("  J  ")).toBe(false);
  });

  it("rejeita nulo/indefinido/vazio", () => {
    expect(isValidNome(null)).toBe(false);
    expect(isValidNome(undefined)).toBe(false);
    expect(isValidNome("")).toBe(false);
  });
});

describe("isValidSenha", () => {
  it("exige ao menos 6 caracteres", () => {
    expect(isValidSenha("123456")).toBe(true);
    expect(isValidSenha("12345")).toBe(false);
  });

  it("rejeita nulo/indefinido/vazio", () => {
    expect(isValidSenha(null)).toBe(false);
    expect(isValidSenha(undefined)).toBe(false);
    expect(isValidSenha("")).toBe(false);
  });
});
