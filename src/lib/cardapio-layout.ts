import type { CategoriaCardapio } from "@/lib/cardapio";

/**
 * Sugestao de layout do Cardapio, 100% nativa e deterministica: so olha os dados que o restaurante
 * ja cadastrou (itens, fotos, descricoes, destaques) e escolhe como apresentar. Nunca altera
 * conteudo, preco nem publicacao; so devolve uma recomendacao que a pessoa aceita ou nao.
 */
export const LAYOUTS = ["lista", "cards", "galeria", "compacto"] as const;
export type LayoutCardapio = (typeof LAYOUTS)[number];

export const LAYOUT_INFO: Record<LayoutCardapio, { nome: string; descricao: string }> = {
  lista: { nome: "Lista", descricao: "Nome, descrição e preço, com uma foto pequena ao lado." },
  cards: { nome: "Cards", descricao: "Grade de pratos com foto em cima. Bom para quem tem fotos." },
  galeria: {
    nome: "Galeria",
    descricao: "Fotos grandes, um prato por vez. Para poucos itens com foto.",
  },
  compacto: { nome: "Compacto", descricao: "Lista densa sem fotos. Para muitos itens." },
};

export function ehLayout(v: unknown): v is LayoutCardapio {
  return typeof v === "string" && (LAYOUTS as readonly string[]).includes(v);
}

export type AnaliseCardapio = {
  categorias: number;
  itens: number;
  comFoto: number;
  /** 0 a 100. */
  percentualComFoto: number;
  destaques: number;
  /** Media de caracteres da descricao, so dos itens que tem descricao. */
  mediaDescricao: number;
  comPreco: number;
};

export function analisarCardapio(categorias: CategoriaCardapio[]): AnaliseCardapio {
  const itens = categorias.flatMap((c) => c.itens);
  const comFoto = itens.filter((i) => !!i.imagem_url).length;
  const descricoes = itens.map((i) => (i.descricao ?? "").trim()).filter(Boolean);
  return {
    categorias: categorias.length,
    itens: itens.length,
    comFoto,
    percentualComFoto: itens.length ? Math.round((comFoto / itens.length) * 100) : 0,
    destaques: itens.filter((i) => i.destaque).length,
    mediaDescricao: descricoes.length
      ? Math.round(descricoes.reduce((n, d) => n + d.length, 0) / descricoes.length)
      : 0,
    comPreco: itens.filter((i) => i.preco_centavos != null).length,
  };
}

export type Sugestao = {
  layout: LayoutCardapio;
  motivos: string[];
  /** Busca e atalhos de categoria ajudam quando o cardapio e grande. */
  mostrarBusca: boolean;
};

export function sugerirLayout(a: AnaliseCardapio): Sugestao {
  const mostrarBusca = a.itens > 12;
  if (a.itens === 0) {
    return { layout: "lista", motivos: ["Ainda não há itens ativos."], mostrarBusca };
  }
  const fotos = `${a.comFoto} de ${a.itens} itens têm foto`;
  if (a.percentualComFoto >= 60 && a.itens <= 24) {
    return {
      layout: "galeria",
      motivos: [`${fotos}, e o cardápio é enxuto: fotos grandes vendem o prato.`],
      mostrarBusca,
    };
  }
  if (a.percentualComFoto >= 40) {
    return {
      layout: "cards",
      motivos: [`${fotos}: uma grade com foto em cima mostra bem os pratos.`],
      mostrarBusca,
    };
  }
  if (a.percentualComFoto < 15 && a.itens > 25) {
    return {
      layout: "compacto",
      motivos: [
        `São ${a.itens} itens e poucas fotos: uma lista compacta deixa tudo fácil de percorrer.`,
      ],
      mostrarBusca,
    };
  }
  const motivos = [
    a.comFoto === 0
      ? "Ainda não há fotos: texto claro, com nome, descrição e preço."
      : `${fotos}: a lista mostra tudo com a foto pequena ao lado.`,
  ];
  if (a.mediaDescricao > 90)
    motivos.push("As descrições são longas, e a lista dá espaço para ler.");
  return { layout: "lista", motivos, mostrarBusca };
}

/** Layout em uso: o salvo pelo restaurante, se valido; senao a sugestao. */
export function layoutEfetivo(
  salvo: string | null | undefined,
  categorias: CategoriaCardapio[],
): LayoutCardapio {
  return ehLayout(salvo) ? salvo : sugerirLayout(analisarCardapio(categorias)).layout;
}
