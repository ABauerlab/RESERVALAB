import { describe, expect, it } from "vitest";

import { separarLinks } from "./linkify";

describe("separarLinks", () => {
  it("mantém texto sem link", () => {
    expect(separarLinks("Somente com ingresso")).toEqual([{ texto: "Somente com ingresso" }]);
  });
  it("marca a url e preserva o texto ao redor", () => {
    expect(separarLinks("Ingressos: https://shotgun.live/x\nFim")).toEqual([
      { texto: "Ingressos: " },
      { texto: "https://shotgun.live/x", href: "https://shotgun.live/x" },
      { texto: "\nFim" },
    ]);
  });
  it("tira pontuação final da url", () => {
    expect(separarLinks("veja https://a.com/b.")).toEqual([
      { texto: "veja " },
      { texto: "https://a.com/b", href: "https://a.com/b" },
      { texto: "." },
    ]);
  });
  it("ignora esquemas que não são http(s)", () => {
    expect(separarLinks("javascript:alert(1)")).toEqual([{ texto: "javascript:alert(1)" }]);
  });
});
