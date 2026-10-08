import { describe, expect, it } from "vitest";

import {
  categoriasVisiveis,
  moverPara,
  filtrarCardapio,
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

describe("filtrarCardapio", () => {
  const cats = [
    {
      id: "1",
      nome: "Petiscos",
      descricao: null,
      itens: [
        {
          id: "a",
          nome: "Pão de queijo",
          descricao: "Mineiro",
          preco_centavos: 1000,
          imagem_url: null,
        },
        {
          id: "b",
          nome: "Fritas",
          descricao: "Serve 2 pessoas.",
          preco_centavos: 3990,
          imagem_url: null,
        },
      ],
    },
    {
      id: "2",
      nome: "Bebidas",
      descricao: null,
      itens: [
        { id: "c", nome: "Água tônica", descricao: null, preco_centavos: 900, imagem_url: null },
      ],
    },
  ];
  it("ignora acento e caixa e procura tambem na descricao", () => {
    expect(filtrarCardapio(cats, "PAO").map((c) => c.itens.length)).toEqual([1]);
    expect(filtrarCardapio(cats, "agua")[0]?.itens[0]?.id).toBe("c");
    expect(filtrarCardapio(cats, "pessoas")[0]?.itens[0]?.id).toBe("b");
  });
  it("sem termo devolve tudo e sem resultado devolve vazio", () => {
    expect(filtrarCardapio(cats, "  ")).toHaveLength(2);
    expect(filtrarCardapio(cats, "sushi")).toEqual([]);
  });
});

describe("moverPara (arrastar)", () => {
  const l = [
    { id: "a", ordem: 0 },
    { id: "b", ordem: 1 },
    { id: "c", ordem: 2 },
    { id: "d", ordem: 3 },
  ];
  it("move para baixo e para cima renumerando so o que mudou", () => {
    expect(moverPara(l, "a", "c")).toEqual([
      { id: "b", ordem: 0 },
      { id: "c", ordem: 1 },
      { id: "a", ordem: 2 },
    ]);
    expect(moverPara(l, "d", "b")).toEqual([
      { id: "d", ordem: 1 },
      { id: "b", ordem: 2 },
      { id: "c", ordem: 3 },
    ]);
  });
  it("sem mudanca para o mesmo item ou id desconhecido", () => {
    expect(moverPara(l, "b", "b")).toEqual([]);
    expect(moverPara(l, "x", "b")).toEqual([]);
  });
  it("funciona mesmo com todas as ordens iguais", () => {
    const iguais = ["a", "b", "c"].map((id) => ({ id, ordem: 0 }));
    const r = moverPara(iguais, "c", "a");
    // c fica em 0 (igual ao que ja era); a e b ganham 1 e 2.
    expect(r).toEqual([
      { id: "a", ordem: 1 },
      { id: "b", ordem: 2 },
    ]);
  });
});
