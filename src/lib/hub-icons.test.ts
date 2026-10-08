import { describe, expect, it } from "vitest";

import { CATALOGO_ICONES, detectarIcone, iconeDoCatalogo, iconeUrlSegura } from "@/lib/hub-icons";

describe("biblioteca de icones", () => {
  it("cobre as marcas pedidas e as funcoes do restaurante", () => {
    const chaves = CATALOGO_ICONES.map((i) => i.chave);
    for (const c of [
      "whatsapp",
      "instagram",
      "facebook",
      "tiktok",
      "ifood",
      "99food",
      "googlemaps",
      "telefone",
      "reservas",
      "cardapio",
      "delivery",
      "site",
      "eventos",
    ]) {
      expect(chaves).toContain(c);
    }
    expect(new Set(chaves).size).toBe(chaves.length);
  });

  it("chaves respeitam a regra do banco (a-z, 0-9, _ ate 32)", () => {
    for (const i of CATALOGO_ICONES) expect(i.chave).toMatch(/^[a-z0-9_]{1,32}$/);
  });

  it("WhatsApp e Instagram usam glifo oficial, nao icone generico", () => {
    expect(iconeDoCatalogo("whatsapp")?.marca).toBe("whatsapp");
    expect(iconeDoCatalogo("instagram")?.marca).toBe("instagram");
  });

  it("detecta a marca pela URL", () => {
    expect(detectarIcone("https://wa.me/5531999999999")).toBe("whatsapp");
    expect(detectarIcone("https://www.instagram.com/casa")).toBe("instagram");
    expect(detectarIcone("https://www.ifood.com.br/delivery/x")).toBe("ifood");
    expect(detectarIcone("https://open.spotify.com/playlist/1")).toBe("spotify");
    expect(detectarIcone("https://www.google.com/maps/place/x")).toBe("googlemaps");
    expect(detectarIcone("tel:+5531999")).toBe("telefone");
    expect(detectarIcone("mailto:a@b.com")).toBe("email");
    expect(detectarIcone("https://exemplo.com.br")).toBeNull();
    expect(detectarIcone("nao e url")).toBeNull();
  });

  it("nao confunde dominio parecido", () => {
    expect(detectarIcone("https://notinstagram.com/x")).toBeNull();
  });

  it("icone proprio exige https", () => {
    expect(iconeUrlSegura("https://cdn/x.png")).toBe(true);
    expect(iconeUrlSegura("http://cdn/x.png")).toBe(false);
    expect(iconeUrlSegura("data:image/png;base64,AA")).toBe(false);
    expect(iconeUrlSegura(null)).toBe(false);
  });
});
