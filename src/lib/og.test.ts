import { describe, expect, it } from "vitest";

import { montarOg } from "@/lib/og";

const og: Parameters<typeof montarOg>[2] = {
  imagemTipo: "banner",
  nome: "Iracema",
  selo: "Comida de Buteco",
  descricao: "Comida mineira no coração de Santa Tereza.",
  imagem: "https://x.supabase.co/storage/v1/object/public/tenant-assets/t/banner.webp",
};
const get = (m: ReturnType<typeof montarOg>, k: string) =>
  m.meta.find((x) => x.property === k || x.name === k)?.content;

describe("montarOg", () => {
  it("Link Hub: nome, selo, frase e imagem da propria casa", () => {
    const m = montarOg("iracema", "links", og);
    expect(m.meta[0]).toEqual({ title: "Iracema: reservas, cardápio e contato" });
    expect(get(m, "og:description")).toBe(
      "Comida de Buteco. Comida mineira no coração de Santa Tereza.",
    );
    expect(get(m, "og:image")).toBe(og!.imagem);
    expect(get(m, "og:image:height")).toBe("400");
    expect(get(m, "og:url")).toBe("https://teggly.com.br/iracema/links");
    expect(m.links).toEqual([{ rel: "canonical", href: "https://teggly.com.br/iracema/links" }]);
  });
  it("Cardapio e reserva tem titulo e frase proprios", () => {
    expect(get(montarOg("iracema", "cardapio", og), "og:title")).toBe("Cardápio | Iracema");
    expect(get(montarOg("iracema", "cardapio", og), "og:description")).toBe(
      "Veja o cardápio do Iracema e reserve sua mesa.",
    );
    expect(get(montarOg("iracema", "", og), "og:title")).toBe("Reservar mesa | Iracema");
    expect(get(montarOg("iracema", "", og), "og:url")).toBe("https://teggly.com.br/iracema");
  });
  it("sem imagem da casa, usa a imagem padrao; sem dados, so a URL", () => {
    expect(get(montarOg("a", "links", { ...og!, imagem: null }), "og:image")).toBe(
      "https://teggly.com.br/og-image.png",
    );
    const vazio = montarOg("a", "links", null);
    expect(vazio.meta).toEqual([{ property: "og:url", content: "https://teggly.com.br/a/links" }]);
  });
  it("frase longa e cortada", () => {
    const m = montarOg("a", "links", { ...og!, selo: null, descricao: "x".repeat(400) });
    expect((get(m, "og:description") ?? "").length).toBeLessThanOrEqual(200);
  });
});
