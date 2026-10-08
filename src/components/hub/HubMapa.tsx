import { useState } from "react";
import { MapPin } from "lucide-react";

import { urlDeMapaValida } from "@/lib/mapa";
import { cn } from "@/lib/utils";

/**
 * Mapa incorporado do Google. O iframe e montado aqui a partir de uma URL validada (nunca HTML da
 * empresa), com sandbox, carregamento preguicoso e titulo para leitores de tela.
 */
export function MapaIncorporado({
  url,
  nome,
  className,
}: {
  url: string;
  nome: string;
  className?: string;
}) {
  if (!urlDeMapaValida(url)) return null;
  return (
    <iframe
      src={url}
      title={`Mapa de ${nome}`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      className={cn("h-full w-full border-0", className)}
    />
  );
}

/**
 * Mapa recolhivel (celular): fechado por padrao para a pagina caber numa tela e nada pesado carregar
 * antes da hora; o iframe so e criado quando a pessoa abre.
 */
export function MapaRecolhivel({ url, nome }: { url: string; nome: string }) {
  const [aberto, setAberto] = useState(false);
  if (!urlDeMapaValida(url)) return null;
  return (
    <details
      className="group rounded-[10px] border border-border bg-card"
      onToggle={(e) => setAberto(e.currentTarget.open)}
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-center gap-2.5 px-5 text-[15px] font-semibold text-foreground [&::-webkit-details-marker]:hidden">
        <MapPin className="h-[18px] w-[18px]" aria-hidden="true" />
        {aberto ? "Esconder o mapa" : "Ver no mapa"}
      </summary>
      {aberto && (
        <div className="aspect-[4/3] w-full overflow-hidden rounded-b-[10px] border-t border-border">
          <MapaIncorporado url={url} nome={nome} />
        </div>
      )}
    </details>
  );
}
