import { supabase } from "@/integrations/supabase/client";
import { ICONE_PROPRIO, detectarIcone, iconeUrlSegura } from "@/lib/hub-icons";
import { telefoneToWhatsApp } from "@/lib/reservations";

/**
 * Link Hub (F10): pagina oficial de links do restaurante, pensada para a bio do Instagram.
 * "Reservar mesa" e sempre o primeiro e o unico destaque. Os demais atalhos saem dos dados que a
 * empresa ja cadastrou (Ajustes) e de links extras configuraveis.
 */

export type HubDados = {
  nome: string;
  endereco: string | null;
  whatsapp: string | null;
  telefone: string | null;
  instagram: string | null;
  cardapio_publicado: boolean;
  /** Toggle "Mostrar cardapio" do Link Hub (padrao ligado). */
  mostrar_cardapio?: boolean;
  descricao?: string | null;
  /** Selo curto de marca (ex.: "Comida de Buteco"), opcional. */
  selo?: string | null;
  /** URL de embed do Google Maps, ja validada no banco; revalidada no app antes de renderizar. */
  mapa_url?: string | null;
  /** Ja vem nulo quando o banner esta desativado. */
  banner_url?: string | null;
  tipos_aceitos: string[];
  links: HubLink[];
};

export type HubLink = {
  id: string;
  titulo: string;
  url: string;
  icone?: string | null;
  icone_url?: string | null;
  destaque?: boolean;
};

export type HubItem = {
  id: string;
  rotulo: string;
  href: string;
  /** Rota interna do app (usa Link) ou URL externa (usa <a>). */
  interno: boolean;
  tipo: "reserva" | "cardapio" | "whatsapp" | "instagram" | "localizacao" | "telefone" | "extra";
  /** "Reservar mesa" (CTA principal) e links marcados como destaque. */
  destaque: boolean;
  /** true so para o CTA de reserva. */
  principal?: boolean;
  /** Chave do icone (catalogo ou "proprio") e URL do icone enviado pela empresa. */
  icone: string;
  iconeUrl?: string | null;
};

export async function fetchHub(slug: string): Promise<HubDados | null> {
  const { data, error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: { _slug: string },
    ) => PromiseLike<{ data: HubDados | null; error: { message: string } | null }>
  )("hub_do_tenant", { _slug: slug });
  if (error) throw new Error(error.message);
  return data ?? null;
}

/** So http(s), tel e mailto. Qualquer outra coisa (ex.: javascript:) e descartada. */
export function urlSegura(url: string): boolean {
  return /^(https?:\/\/|tel:|mailto:)/i.test(url.trim());
}

export function instagramUrl(handle: string): string {
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

export function mapsUrl(endereco: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
}

/**
 * Lista final, na ordem de conversao: reservar (CTA principal), cardapio (se publicado e o toggle
 * estiver ligado), destaques marcados pela casa (ex.: iFood, 99Food), whatsapp, localizacao,
 * instagram, ligar e demais links.
 */
export function buildHubItens(hub: HubDados, slug: string): HubItem[] {
  const mesa = hub.tipos_aceitos.includes("mesa");
  const itens: HubItem[] = [
    {
      id: "reserva",
      rotulo: mesa ? "Reservar mesa" : "Fazer uma reserva",
      href: mesa ? `/${slug}/reservar/mesa` : `/${slug}`,
      interno: true,
      tipo: "reserva",
      destaque: true,
      principal: true,
      icone: "reservas",
    },
  ];
  if (hub.cardapio_publicado && hub.mostrar_cardapio !== false) {
    itens.push({
      id: "cardapio",
      rotulo: "Cardápio",
      href: `/${slug}/cardapio?de=links`,
      interno: true,
      tipo: "cardapio",
      destaque: false,
      icone: "cardapio",
    });
  }

  const extras: HubItem[] = [];
  for (const l of hub.links) {
    if (!urlSegura(l.url) || !l.titulo.trim()) continue;
    const proprio = l.icone === ICONE_PROPRIO && iconeUrlSegura(l.icone_url);
    extras.push({
      id: `extra-${l.id}`,
      rotulo: l.titulo.trim(),
      href: l.url.trim(),
      interno: false,
      tipo: "extra",
      destaque: l.destaque === true,
      icone: proprio ? ICONE_PROPRIO : (l.icone ?? detectarIcone(l.url) ?? "link"),
      iconeUrl: proprio ? l.icone_url : null,
    });
  }
  itens.push(...extras.filter((e) => e.destaque));

  const wa = hub.whatsapp ? telefoneToWhatsApp(hub.whatsapp) : "";
  if (wa) {
    itens.push({
      id: "whatsapp",
      rotulo: "WhatsApp",
      href: `https://wa.me/${wa}`,
      interno: false,
      tipo: "whatsapp",
      destaque: false,
      icone: "whatsapp",
    });
  }
  if (hub.endereco?.trim()) {
    itens.push({
      id: "localizacao",
      rotulo: "Como chegar",
      href: mapsUrl(hub.endereco),
      interno: false,
      tipo: "localizacao",
      destaque: false,
      icone: "localizacao",
    });
  }
  if (hub.instagram) {
    itens.push({
      id: "instagram",
      rotulo: "Instagram",
      href: instagramUrl(hub.instagram),
      interno: false,
      tipo: "instagram",
      destaque: false,
      icone: "instagram",
    });
  }
  const tel = hub.telefone ? hub.telefone.replace(/[^\d+]/g, "") : "";
  if (tel) {
    itens.push({
      id: "telefone",
      rotulo: "Ligar",
      href: `tel:${tel}`,
      interno: false,
      tipo: "telefone",
      destaque: false,
      icone: "telefone",
    });
  }
  itens.push(...extras.filter((e) => !e.destaque));
  return itens;
}
