import type { QueryClient } from "@tanstack/react-query";

import { fetchCardapioPublico } from "@/lib/cardapio";
import { fetchHub } from "@/lib/hub";
import { iconeUrlSegura } from "@/lib/hub-icons";
import { SITE_URL } from "@/lib/site";

/**
 * Open Graph por restaurante: ao compartilhar o link (WhatsApp, Instagram, Facebook), o preview
 * mostra o nome da casa, uma frase e uma imagem dela (banner do Link Hub, senao a foto de um prato
 * do cardapio publicado, senao a imagem padrao do Teggly). Tudo sai dos dados que a casa ja cadastrou
 * e so de conteudo publico (hub publicado, cardapio publicado).
 */
export type OgRestaurante = {
  nome: string;
  selo: string | null;
  descricao: string | null;
  imagem: string | null;
  /** Origem da imagem, para informar o tamanho certo ao preview. */
  imagemTipo?: "banner" | "prato" | null;
};

export type OgRota = "" | "links" | "cardapio";

const limitar = (t: string, n: number) => (t.length <= n ? t : `${t.slice(0, n - 1).trimEnd()}…`);

/** Busca os dados do preview. Nunca lanca: sem dados, a pagina usa o preview generico. */
export async function fetchOgRestaurante(slug: string): Promise<OgRestaurante | null> {
  try {
    const limite = new Promise<null>((r) => setTimeout(() => r(null), 3000));
    const buscar = (async () => {
      const hub = await fetchHub(slug);
      if (!hub) return null;
      let imagem = iconeUrlSegura(hub.banner_url) ? (hub.banner_url ?? null) : null;
      let imagemTipo: OgRestaurante["imagemTipo"] = imagem ? "banner" : null;
      if (!imagem && hub.cardapio_publicado) {
        const c = await fetchCardapioPublico(slug).catch(() => null);
        imagem =
          c?.categorias.flatMap((cat) => cat.itens).find((i) => iconeUrlSegura(i.imagem_url))
            ?.imagem_url ?? null;
        if (imagem) imagemTipo = "prato";
      }
      return {
        nome: hub.nome,
        selo: hub.selo?.trim() || null,
        descricao: hub.descricao?.trim() || null,
        imagem,
        imagemTipo,
      } satisfies OgRestaurante;
    })();
    return await Promise.race([buscar, limite]);
  } catch {
    return null;
  }
}

/**
 * Loader das paginas publicas. No servidor busca o preview completo (o que os crawlers leem). No
 * navegador nao espera rede: a navegacao entre paginas nao pode esperar por uma busca so de
 * titulo, entao usa o que o Link Hub ja carregou (nome e frase) ou o titulo generico.
 */
export async function carregarOg(
  slug: string,
  queryClient: QueryClient,
): Promise<OgRestaurante | null> {
  if (typeof window === "undefined") return fetchOgRestaurante(slug);
  const hub = queryClient.getQueryData<Awaited<ReturnType<typeof fetchHub>>>(["hub-publico", slug]);
  if (!hub) return null;
  return {
    nome: hub.nome,
    selo: hub.selo?.trim() || null,
    descricao: hub.descricao?.trim() || null,
    imagem: null,
  };
}

export type MetaTag = Record<string, string>;

function tituloDaRota(nome: string, rota: OgRota): string {
  if (rota === "links") return `${nome}: reservas, cardápio e contato`;
  if (rota === "cardapio") return `Cardápio | ${nome}`;
  return `Reservar mesa | ${nome}`;
}

function descricaoDaRota(og: OgRestaurante, rota: OgRota): string {
  const base =
    rota === "cardapio"
      ? `Veja o cardápio do ${og.nome} e reserve sua mesa.`
      : (og.descricao ?? `Reserve sua mesa no ${og.nome}, veja o cardápio e fale com a casa.`);
  return limitar(og.selo && rota !== "cardapio" ? `${og.selo}. ${base}` : base, 200);
}

/** Meta tags (e link canonical) de uma pagina publica do restaurante. */
export function montarOg(
  slug: string,
  rota: OgRota,
  og: OgRestaurante | null,
): { meta: MetaTag[]; links: MetaTag[] } {
  const caminho = rota ? `/${slug}/${rota}` : `/${slug}`;
  const url = `${SITE_URL}${caminho}`;
  if (!og) {
    return {
      meta: [{ property: "og:url", content: url }],
      links: [{ rel: "canonical", href: url }],
    };
  }
  const titulo = tituloDaRota(og.nome, rota);
  const descricao = descricaoDaRota(og, rota);
  const imagem = og.imagem ?? `${SITE_URL}/og-image.png`;
  // O site define 1200x630 para a imagem padrao; a imagem da casa tem outro tamanho.
  const tamanho =
    og.imagem == null
      ? { w: "1200", h: "630" }
      : og.imagemTipo === "banner"
        ? { w: "1200", h: "400" }
        : { w: "900", h: "900" };
  return {
    meta: [
      { title: titulo },
      { name: "description", content: descricao },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: og.nome },
      { property: "og:title", content: titulo },
      { property: "og:description", content: descricao },
      { property: "og:url", content: url },
      { property: "og:image", content: imagem },
      { property: "og:image:width", content: tamanho.w },
      { property: "og:image:height", content: tamanho.h },
      { property: "og:locale", content: "pt_BR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: titulo },
      { name: "twitter:description", content: descricao },
      { name: "twitter:image", content: imagem },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
