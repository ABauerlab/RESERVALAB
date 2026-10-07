import { supabase } from "@/integrations/supabase/client";
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
  tipos_aceitos: string[];
  links: Array<{ id: string; titulo: string; url: string }>;
};

export type HubItem = {
  id: string;
  rotulo: string;
  href: string;
  /** Rota interna do app (usa Link) ou URL externa (usa <a>). */
  interno: boolean;
  tipo: "reserva" | "cardapio" | "whatsapp" | "instagram" | "localizacao" | "telefone" | "extra";
  destaque: boolean;
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

/** Lista final, na ordem: reservar, cardapio, whatsapp, instagram, localizacao, ligar, extras. */
export function buildHubItens(hub: HubDados, slug: string): HubItem[] {
  const itens: HubItem[] = [];
  const mesa = hub.tipos_aceitos.includes("mesa");
  itens.push({
    id: "reserva",
    rotulo: mesa ? "Reservar mesa" : "Fazer uma reserva",
    href: mesa ? `/${slug}/reservar/mesa` : `/${slug}`,
    interno: true,
    tipo: "reserva",
    destaque: true,
  });
  if (hub.cardapio_publicado) {
    itens.push({
      id: "cardapio",
      rotulo: "Cardápio",
      href: `/${slug}/cardapio`,
      interno: true,
      tipo: "cardapio",
      destaque: false,
    });
  }
  const wa = hub.whatsapp ? telefoneToWhatsApp(hub.whatsapp) : "";
  if (wa) {
    itens.push({
      id: "whatsapp",
      rotulo: "WhatsApp",
      href: `https://wa.me/${wa}`,
      interno: false,
      tipo: "whatsapp",
      destaque: false,
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
    });
  }
  for (const l of hub.links) {
    if (!urlSegura(l.url) || !l.titulo.trim()) continue;
    itens.push({
      id: `extra-${l.id}`,
      rotulo: l.titulo.trim(),
      href: l.url.trim(),
      interno: false,
      tipo: "extra",
      destaque: false,
    });
  }
  return itens;
}
