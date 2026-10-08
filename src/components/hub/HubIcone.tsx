import {
  BookOpen,
  Bike,
  CalendarCheck,
  Globe,
  Link2,
  Mail,
  MapPin,
  Music,
  Phone,
} from "lucide-react";

import { BrandIcon } from "@/components/brand/BrandIcons";
import { ICONE_PROPRIO, iconeDoCatalogo, iconeUrlSegura } from "@/lib/hub-icons";

const FUNCOES: Record<string, typeof Phone> = {
  reservas: CalendarCheck,
  cardapio: BookOpen,
  delivery: Bike,
  telefone: Phone,
  localizacao: MapPin,
  eventos: Music,
  site: Globe,
  email: Mail,
  link: Link2,
};

/**
 * Icone de um item do Link Hub: icone proprio enviado pela empresa, glifo oficial da marca,
 * funcao no set de traco do Teggly, ou link generico. `colorido` so para destaques.
 */
export function HubIcone({
  chave,
  iconeUrl,
  colorido = false,
  className = "h-[18px] w-[18px]",
}: {
  chave?: string | null;
  iconeUrl?: string | null;
  colorido?: boolean;
  className?: string;
}) {
  if (chave === ICONE_PROPRIO && iconeUrlSegura(iconeUrl)) {
    return (
      <img
        src={iconeUrl}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className={`${className} rounded-[4px] object-contain`}
      />
    );
  }
  const item = iconeDoCatalogo(chave);
  if (item?.marca)
    return <BrandIcon marca={item.marca} colorido={colorido} className={className} />;
  if (item?.chave === "99food") {
    return (
      <span
        aria-hidden="true"
        className={`${className} inline-grid place-items-center rounded-[5px] bg-slate-900 text-[9px] font-extrabold leading-none text-white`}
      >
        99
      </span>
    );
  }
  const Funcao = (item && FUNCOES[item.chave]) || Link2;
  return <Funcao className={className} aria-hidden="true" />;
}
