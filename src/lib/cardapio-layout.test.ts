import { describe, expect, it } from "vitest";

import { analisarCardapio, ehLayout, layoutEfetivo, sugerirLayout } from "@/lib/cardapio-layout";
import type { CategoriaCardapio } from "@/lib/cardapio";

function cardapio(total: number, comFoto: number, descricao = "Prato bom"): CategoriaCardapio[] {
  return [
    {
      id: "c",
      nome: "Pratos",
      descricao: null,
      itens: Array.from({ length: total }, (_, i) => ({
        id: `i${i}`,
        nome: `Item ${i}`,
        descricao,
        preco_centavos: 1000,
        imagem_url: i < comFoto ? `https://x/${i}.jpg` : null,
        destaque: i === 0,
      })),
    },
  ];
}

describe("sugerirLayout", () => {
  it("poucos itens, quase todos com foto: galeria", () => {
    const s = sugerirLayout(analisarCardapio(cardapio(10, 9)));
    expect(s.layout).toBe("galeria");
    expect(s.mostrarBusca).toBe(false);
  });
  it("muitas fotos e cardapio grande: cards com busca", () => {
    const s = sugerirLayout(analisarCardapio(cardapio(40, 30)));
    expect(s.layout).toBe("cards");
    expect(s.mostrarBusca).toBe(true);
  });
  it("muitos itens e quase sem fotos: compacto", () => {
    expect(sugerirLayout(analisarCardapio(cardapio(60, 2))).layout).toBe("compacto");
  });
  it("sem fotos e cardapio medio: lista", () => {
    const s = sugerirLayout(analisarCardapio(cardapio(15, 0)));
    expect(s.layout).toBe("lista");
    expect(s.motivos[0]).toMatch(/fotos/);
  });
  it("descricao longa vira motivo extra", () => {
    const s = sugerirLayout(analisarCardapio(cardapio(10, 2, "x".repeat(120))));
    expect(s.layout).toBe("lista");
    expect(s.motivos).toHaveLength(2);
  });
  it("vazio e deterministico", () => {
    expect(sugerirLayout(analisarCardapio([])).layout).toBe("lista");
    const a = analisarCardapio(cardapio(30, 12));
    expect(sugerirLayout(a)).toEqual(sugerirLayout(a));
  });
});

describe("layoutEfetivo", () => {
  it("usa o salvo quando valido e a sugestao quando nao", () => {
    expect(layoutEfetivo("compacto", cardapio(10, 10))).toBe("compacto");
    expect(layoutEfetivo("invalido", cardapio(10, 10))).toBe("galeria");
    expect(layoutEfetivo(null, cardapio(10, 0))).toBe("lista");
    expect(ehLayout("cards")).toBe(true);
    expect(ehLayout("x")).toBe(false);
  });
});

describe("analisarCardapio", () => {
  it("conta fotos, destaques e media de descricao", () => {
    const a = analisarCardapio(cardapio(4, 2, "abcd"));
    expect(a).toMatchObject({
      itens: 4,
      comFoto: 2,
      percentualComFoto: 50,
      destaques: 1,
      mediaDescricao: 4,
    });
  });
});
