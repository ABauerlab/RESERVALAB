import { describe, expect, it } from "vitest";

import { buildHubItens, urlSegura, type HubDados } from "@/lib/hub";

const base: HubDados = {
  nome: "Casa",
  endereco: "Rua A, 10",
  whatsapp: "(31) 99999-0000",
  telefone: "(31) 3333-4444",
  instagram: "casa_bh",
  cardapio_publicado: true,
  tipos_aceitos: ["mesa", "aniversario"],
  links: [{ id: "1", titulo: "Playlist", url: "https://example.com/p" }],
};

describe("buildHubItens", () => {
  it("Reservar mesa vem primeiro e e o unico destaque", () => {
    const itens = buildHubItens(base, "casa");
    expect(itens[0]).toMatchObject({
      tipo: "reserva",
      rotulo: "Reservar mesa",
      destaque: true,
      href: "/casa/reservar/mesa",
    });
    expect(itens.filter((i) => i.destaque)).toHaveLength(1);
    expect(itens.map((i) => i.tipo)).toEqual([
      "reserva",
      "cardapio",
      "whatsapp",
      "instagram",
      "localizacao",
      "telefone",
      "extra",
    ]);
  });

  it("sem cardapio publicado nao mostra o cardapio", () => {
    const itens = buildHubItens({ ...base, cardapio_publicado: false }, "casa");
    expect(itens.some((i) => i.tipo === "cardapio")).toBe(false);
  });

  it("sem mesa aceita, a reserva leva a escolha do tipo", () => {
    const itens = buildHubItens({ ...base, tipos_aceitos: ["evento"] }, "casa");
    expect(itens[0]).toMatchObject({ rotulo: "Fazer uma reserva", href: "/casa" });
  });

  it("so mostra o que a empresa preencheu", () => {
    const itens = buildHubItens(
      {
        ...base,
        whatsapp: null,
        instagram: null,
        endereco: " ",
        telefone: null,
        links: [],
        cardapio_publicado: false,
      },
      "casa",
    );
    expect(itens.map((i) => i.tipo)).toEqual(["reserva"]);
  });

  it("descarta links extras com url insegura", () => {
    const itens = buildHubItens(
      {
        ...base,
        links: [
          { id: "x", titulo: "Mau", url: "javascript:alert(1)" },
          { id: "y", titulo: "Bom", url: "mailto:a@b.com" },
        ],
      },
      "casa",
    );
    expect(itens.filter((i) => i.tipo === "extra").map((i) => i.rotulo)).toEqual(["Bom"]);
    expect(urlSegura("data:text/html,x")).toBe(false);
    expect(urlSegura("HTTPS://x.com")).toBe(true);
  });

  it("toggle Mostrar cardapio desliga o item mesmo com cardapio publicado", () => {
    const off = buildHubItens({ ...base, mostrar_cardapio: false }, "casa");
    expect(off.some((i) => i.tipo === "cardapio")).toBe(false);
    const on = buildHubItens({ ...base, mostrar_cardapio: true }, "casa");
    expect(on.some((i) => i.tipo === "cardapio")).toBe(true);
    // Ausente (clientes antigos do RPC) conta como ligado.
    expect(buildHubItens(base, "casa").some((i) => i.tipo === "cardapio")).toBe(true);
  });

  it("destaques (iFood, 99Food) vem logo depois do cardapio, antes do WhatsApp", () => {
    const itens = buildHubItens(
      {
        ...base,
        links: [
          { id: "a", titulo: "Playlist", url: "https://example.com/p" },
          { id: "b", titulo: "Peça no iFood", url: "https://www.ifood.com.br/x", destaque: true },
          {
            id: "c",
            titulo: "99Food",
            url: "https://99app.com/x",
            destaque: true,
            icone: "99food",
          },
        ],
      },
      "casa",
    );
    expect(itens.map((i) => i.rotulo)).toEqual([
      "Reservar mesa",
      "Cardápio",
      "Peça no iFood",
      "99Food",
      "WhatsApp",
      "Instagram",
      "Como chegar",
      "Ligar",
      "Playlist",
    ]);
    expect(itens[0]?.principal).toBe(true);
    expect(itens[2]).toMatchObject({ destaque: true, icone: "ifood" });
    expect(itens[3]).toMatchObject({ destaque: true, icone: "99food" });
  });

  it("icone proprio so vale com imagem https; senao cai na deteccao ou no link", () => {
    const itens = buildHubItens(
      {
        ...base,
        links: [
          {
            id: "a",
            titulo: "A",
            url: "https://ex.com",
            icone: "proprio",
            icone_url: "https://cdn/x.png",
          },
          {
            id: "b",
            titulo: "B",
            url: "https://ex.com",
            icone: "proprio",
            icone_url: "javascript:x",
          },
        ],
      },
      "casa",
    );
    const [a, b] = itens.filter((i) => i.tipo === "extra");
    expect(a).toMatchObject({ icone: "proprio", iconeUrl: "https://cdn/x.png" });
    expect(b?.iconeUrl ?? null).toBeNull();
  });
});
