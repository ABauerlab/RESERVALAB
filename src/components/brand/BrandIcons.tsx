import {
  siFacebook,
  siGoogle,
  siGooglemaps,
  siIfood,
  siInstagram,
  siSpotify,
  siTiktok,
  siWhatsapp,
  siYoutube,
} from "simple-icons";

/**
 * Marcas externas (WhatsApp, Instagram, iFood...). Glifos oficiais do pacote simple-icons; nunca
 * balao generico, camera generica ou emoji no lugar da marca. Icones internos do Teggly continuam
 * no set de traco (lucide, 1,75). Marca sem glifo oficial disponivel (ex.: 99Food) nao e desenhada
 * aqui: a empresa sobe o proprio icone no Link Hub.
 */

export type MarcaExterna =
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "ifood"
  | "googlemaps"
  | "google"
  | "spotify";

type Glifo = { path: string; hex: string; rotulo: string };

export const MARCAS: Record<MarcaExterna, Glifo> = {
  whatsapp: { path: siWhatsapp.path, hex: `#${siWhatsapp.hex}`, rotulo: "WhatsApp" },
  instagram: { path: siInstagram.path, hex: `#${siInstagram.hex}`, rotulo: "Instagram" },
  facebook: { path: siFacebook.path, hex: `#${siFacebook.hex}`, rotulo: "Facebook" },
  tiktok: { path: siTiktok.path, hex: `#${siTiktok.hex}`, rotulo: "TikTok" },
  youtube: { path: siYoutube.path, hex: `#${siYoutube.hex}`, rotulo: "YouTube" },
  ifood: { path: siIfood.path, hex: `#${siIfood.hex}`, rotulo: "iFood" },
  googlemaps: { path: siGooglemaps.path, hex: `#${siGooglemaps.hex}`, rotulo: "Google Maps" },
  google: { path: siGoogle.path, hex: `#${siGoogle.hex}`, rotulo: "Google" },
  spotify: { path: siSpotify.path, hex: `#${siSpotify.hex}`, rotulo: "Spotify" },
};

export function ehMarca(v: string): v is MarcaExterna {
  return Object.prototype.hasOwnProperty.call(MARCAS, v);
}

/** `colorido` usa a cor da marca; senao herda currentColor (padrao, mantem a calma da interface). */
export function BrandIcon({
  marca,
  colorido = false,
  className = "h-5 w-5",
}: {
  marca: MarcaExterna;
  colorido?: boolean;
  className?: string;
}) {
  const g = MARCAS[marca];
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={g.rotulo}
      className={className}
      fill={colorido ? g.hex : "currentColor"}
    >
      <path d={g.path} />
    </svg>
  );
}

/** Atalho para quem espera um componente de icone simples (className). */
export function IconeWhatsApp({ className }: { className?: string }) {
  return <BrandIcon marca="whatsapp" className={className} />;
}
