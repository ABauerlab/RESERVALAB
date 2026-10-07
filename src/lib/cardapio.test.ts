import { describe, expect, it } from "vitest";

import {
  categoriasVisiveis,
  formatPreco,
  parsePreco,
  precoParaCampo,
  reordenar,
} from "@/lib/cardapio";

describe("preco", () => {
  it("formata em reais e trata ausente", () => {
    expect(formatPreco(4590)).toMatch(/45,90/);
    expect(formatPreco(null)).toBeNull();
  });
  it("converte o campo digitado em centavos", () => {
    expect(parsePreco("45,90")).toBe(4590);
    expect(parsePreco("45.9")).toBe(4590);
    expect(parsePreco("R$ 37")).toBe(3700);
    expect(parsePreco("")).toBeNull();
    expect(parsePreco("abc")).toBeUndefined();
    expect(parsePreco("-3")).toBeUndefined();
    expect(parsePreco("1,234")).toBeUndefined();
  });
  it("devolve ao campo", () => {
    expect(precoParaCampo(4590)).toBe("45,90");
    expect(precoParaCampo(null)).toBe("");
  });
});

describe("reordenar", () => {
  const l = [
    { id: "a", ordem: 0 },
    { id: "b", ordem: 0 },
    { id: "c", ordem: 0 },
  ];
  it("renumera mesmo com ordens iguais e so devolve o que mudou", () => {
    const r = reordenar(l, "b", -1); // vira b, a, c
    const final = new Map(l.map((x) => [x.id, x.ordem]));
    for (const u of r) final.set(u.id, u.ordem);
    expect([...final.entries()].sort((x, y) => x[1] - y[1]).map(([id]) => id)).toEqual([
      "b",
      "a",
      "c",
    ]);
    expect(r.find((x) => x.id === "b")).toBeUndefined(); // b ja estava em 0
  });
  it("nas pontas nao faz nada", () => {
    expect(reordenar(l, "a", -1)).toEqual([]);
    expect(reordenar(l, "c", 1)).toEqual([]);
    expect(reordenar(l, "x", 1)).toEqual([]);
  });
});

describe("categoriasVisiveis", () => {
  it("esconde categorias sem itens", () => {
    const c = {
      nome: "Casa",
      categorias: [
        {
          id: "1",
          nome: "Pratos",
          descricao: null,
          itens: [{ id: "i", nome: "x", descricao: null, preco_centavos: 1, imagem_url: null }],
        },
        { id: "2", nome: "Vazia", descricao: null, itens: [] },
      ],
    };
    expect(categoriasVisiveis(c).map((x) => x.nome)).toEqual(["Pratos"]);
    expect(categoriasVisiveis(null)).toEqual([]);
  });
});
