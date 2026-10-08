import { describe, expect, it } from "vitest";

import { extrairMapaEmbed, urlDeMapaValida } from "@/lib/mapa";

const SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3750.0!2d-43.9!3d-19.9!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sBar!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr";
const IFRAME = `<iframe src="${SRC.replace(/&/g, "&amp;")}" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;

describe("extrairMapaEmbed", () => {
  it("aceita o iframe oficial e devolve so a URL", () => {
    expect(extrairMapaEmbed(IFRAME)).toEqual({ ok: true, url: SRC });
  });
  it("aceita a URL pura", () => {
    expect(extrairMapaEmbed(`  ${SRC} `)).toEqual({ ok: true, url: SRC });
  });
  it("rejeita outros hosts, http e esquemas perigosos", () => {
    for (const x of [
      SRC.replace("www.google.com", "evil.com"),
      SRC.replace("https", "http"),
      "javascript:alert(1)",
      `<iframe src="javascript:alert(1)"></iframe>`,
      "https://www.google.com/maps/search/?api=1&query=bar",
      "https://www.google.com.evil.com/maps/embed?pb=!1m18!1m12",
    ]) {
      expect(extrairMapaEmbed(x).ok).toBe(false);
    }
  });
  it("rejeita html extra, varios iframes e aspas dentro da URL", () => {
    expect(extrairMapaEmbed(`${IFRAME}<script>alert(1)</script>`).ok).toBe(true); // so a URL e guardada
    expect(extrairMapaEmbed(IFRAME + IFRAME).ok).toBe(false);
    expect(extrairMapaEmbed(`<iframe src="${SRC}" onload="x()"></iframe>`)).toEqual({
      ok: true,
      url: SRC,
    });
    expect(extrairMapaEmbed(SRC + '"onload="x()').ok).toBe(false);
  });
  it("vazio pede o codigo", () => {
    expect(extrairMapaEmbed("   ").ok).toBe(false);
  });
});

describe("urlDeMapaValida", () => {
  it("so aceita o formato de embed", () => {
    expect(urlDeMapaValida(SRC)).toBe(true);
    expect(urlDeMapaValida(null)).toBe(false);
    expect(urlDeMapaValida("https://maps.google.com/?q=x")).toBe(false);
  });
});
