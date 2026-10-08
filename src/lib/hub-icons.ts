import type { MarcaExterna } from "@/components/brand/BrandIcons";

/**
 * Biblioteca de icones do Link Hub. Marcas externas usam o glifo oficial; funcoes do proprio
 * restaurante usam o set de traco do Teggly. A empresa tambem pode enviar o proprio icone
 * (chave "proprio" + URL), por exemplo para marcas sem glifo oficial na biblioteca.
 */

export const ICONE_PROPRIO = "proprio";

export type IconeCatalogo = {
  chave: string;
  rotulo: string;
  grupo: "marca" | "funcao";
  /** Glifo oficial da marca, quando existe. */
  marca?: MarcaExterna;
};

export const CATALOGO_ICONES: readonly IconeCatalogo[] = [
  { chave: "whatsapp", rotulo: "WhatsApp", grupo: "marca", marca: "whatsapp" },
  { chave: "instagram", rotulo: "Instagram", grupo: "marca", marca: "instagram" },
  { chave: "facebook", rotulo: "Facebook", grupo: "marca", marca: "facebook" },
  { chave: "tiktok", rotulo: "TikTok", grupo: "marca", marca: "tiktok" },
  { chave: "youtube", rotulo: "YouTube", grupo: "marca", marca: "youtube" },
  { chave: "ifood", rotulo: "iFood", grupo: "marca", marca: "ifood" },
  // Sem glifo oficial disponivel: aparece como monograma neutro ate a empresa subir o icone da marca.
  { chave: "99food", rotulo: "99Food", grupo: "marca" },
  { chave: "googlemaps", rotulo: "Google Maps", grupo: "marca", marca: "googlemaps" },
  { chave: "google", rotulo: "Avaliações no Google", grupo: "marca", marca: "google" },
  { chave: "spotify", rotulo: "Spotify", grupo: "marca", marca: "spotify" },
  { chave: "reservas", rotulo: "Reservas", grupo: "funcao" },
  { chave: "cardapio", rotulo: "Cardápio", grupo: "funcao" },
  { chave: "delivery", rotulo: "Delivery", grupo: "funcao" },
  { chave: "telefone", rotulo: "Telefone", grupo: "funcao" },
  { chave: "localizacao", rotulo: "Localização", grupo: "funcao" },
  { chave: "eventos", rotulo: "Eventos", grupo: "funcao" },
  { chave: "site", rotulo: "Site", grupo: "funcao" },
  { chave: "email", rotulo: "E-mail", grupo: "funcao" },
  { chave: "link", rotulo: "Link", grupo: "funcao" },
];

export function iconeDoCatalogo(chave: string | null | undefined): IconeCatalogo | undefined {
  return CATALOGO_ICONES.find((i) => i.chave === chave);
}

/** Descobre o icone pela URL quando a empresa nao escolheu um. */
export function detectarIcone(url: string): string | null {
  const u = url.trim().toLowerCase();
  if (u.startsWith("tel:")) return "telefone";
  if (u.startsWith("mailto:")) return "email";
  let host = "";
  try {
    host = new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
  const casa = (...hosts: string[]) => hosts.some((h) => host === h || host.endsWith(`.${h}`));
  if (casa("wa.me", "whatsapp.com", "api.whatsapp.com")) return "whatsapp";
  if (casa("instagram.com")) return "instagram";
  if (casa("facebook.com", "fb.com", "fb.me")) return "facebook";
  if (casa("tiktok.com")) return "tiktok";
  if (casa("youtube.com", "youtu.be")) return "youtube";
  if (casa("ifood.com.br", "ifood.com")) return "ifood";
  if (casa("99app.com", "99food.com.br", "99food.com")) return "99food";
  if (casa("maps.app.goo.gl", "goo.gl") || (casa("google.com") && u.includes("/maps")))
    return "googlemaps";
  if (casa("g.page", "g.co")) return "google";
  if (casa("spotify.com")) return "spotify";
  return null;
}

/** Aceita so imagem https enviada pela empresa (nunca data: ou javascript:). */
export function iconeUrlSegura(url: string | null | undefined): url is string {
  return !!url && /^https:\/\//i.test(url.trim());
}
