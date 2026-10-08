import { Star } from "lucide-react";
import { useState } from "react";

import { formatPreco, type ItemCardapio } from "@/lib/cardapio";
import type { LayoutCardapio } from "@/lib/cardapio-layout";
import { cn } from "@/lib/utils";

/** Foto com espaco reservado (sem salto de layout) e sem quebrar quando a imagem falha. */
export function Foto({
  src,
  alt,
  prioridade,
  className,
  proporcao,
  contain,
}: {
  src: string;
  alt: string;
  prioridade?: boolean;
  className?: string;
  proporcao?: string;
  contain?: boolean;
}) {
  const [falhou, setFalhou] = useState(false);
  if (falhou) return null;
  return (
    <img
      src={src}
      alt={alt}
      width={800}
      height={600}
      loading={prioridade ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={prioridade ? "high" : undefined}
      referrerPolicy="no-referrer"
      onError={() => setFalhou(true)}
      style={proporcao ? { aspectRatio: proporcao } : undefined}
      className={cn("w-full bg-slate-100", contain ? "object-contain" : "object-cover", className)}
    />
  );
}

export function SeloDestaque() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em] text-warning-700">
      <Star className="h-3 w-3 fill-current" aria-hidden="true" />
      Destaque
    </span>
  );
}

const botao =
  "block w-full text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30";

/** Um item do cardapio no layout escolhido. Sempre abre o detalhe ao tocar. */
export function ItemDoCardapio({
  item,
  layout,
  indice,
  onAbrir,
}: {
  item: ItemCardapio;
  layout: LayoutCardapio;
  indice: number;
  onAbrir: (id: string) => void;
}) {
  const preco = formatPreco(item.preco_centavos);
  const temFoto = !!item.imagem_url;
  const abrir = () => onAbrir(item.id);
  const rotulo = `Ver ${item.nome}`;

  if (layout === "cards") {
    return (
      <button
        type="button"
        onClick={abrir}
        aria-label={rotulo}
        className={cn(
          botao,
          "flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card hover:border-slate-300",
        )}
      >
        {temFoto && (
          <Foto src={item.imagem_url!} alt="" prioridade={indice < 4} proporcao="4 / 3" />
        )}
        <span className="flex flex-1 flex-col p-3">
          {item.destaque && (
            <span className="mb-1.5">
              <SeloDestaque />
            </span>
          )}
          <span className="break-words text-[15px] font-semibold leading-snug text-foreground">
            {item.nome}
          </span>
          {item.descricao && !temFoto && (
            <span className="mt-1 line-clamp-3 text-[13px] leading-snug text-muted-foreground">
              {item.descricao}
            </span>
          )}
          {preco && (
            <span className="mt-auto pt-2 text-sm font-bold tabular-nums text-foreground">
              {preco}
            </span>
          )}
        </span>
      </button>
    );
  }

  if (layout === "galeria") {
    return (
      <button
        type="button"
        onClick={abrir}
        aria-label={rotulo}
        className={cn(
          botao,
          "overflow-hidden rounded-2xl border border-border bg-card hover:border-slate-300",
        )}
      >
        {temFoto && (
          <Foto src={item.imagem_url!} alt="" prioridade={indice < 2} proporcao="16 / 10" />
        )}
        <span className="block p-4">
          {item.destaque && (
            <span className="mb-1.5 block">
              <SeloDestaque />
            </span>
          )}
          <span className="flex items-baseline justify-between gap-3">
            <span className="break-words text-lg font-bold leading-tight text-foreground">
              {item.nome}
            </span>
            {preco && (
              <span className="shrink-0 text-base font-bold tabular-nums text-foreground">
                {preco}
              </span>
            )}
          </span>
          {item.descricao && (
            <span className="mt-1.5 line-clamp-3 block text-sm leading-relaxed text-muted-foreground">
              {item.descricao}
            </span>
          )}
        </span>
      </button>
    );
  }

  if (layout === "compacto") {
    return (
      <button
        type="button"
        onClick={abrir}
        aria-label={rotulo}
        className={cn(botao, "px-4 py-2.5 hover:bg-slate-50")}
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 break-words text-[15px] font-semibold text-foreground">
            {item.destaque && (
              <Star
                className="mr-1 inline h-3.5 w-3.5 fill-warning-500 text-warning-500"
                aria-label="Destaque"
              />
            )}
            {item.nome}
          </span>
          {preco && (
            <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
              {preco}
            </span>
          )}
        </span>
        {item.descricao && (
          <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-muted-foreground">
            {item.descricao}
          </span>
        )}
      </button>
    );
  }

  // lista
  return (
    <button
      type="button"
      onClick={abrir}
      aria-label={rotulo}
      className={cn(botao, "flex gap-4 p-4 hover:bg-slate-50")}
    >
      <span className="min-w-0 flex-1">
        {item.destaque && (
          <span className="mb-1 block">
            <SeloDestaque />
          </span>
        )}
        <span className="block break-words font-semibold text-foreground">{item.nome}</span>
        {item.descricao && (
          <span className="mt-1 line-clamp-3 block text-sm leading-relaxed text-muted-foreground">
            {item.descricao}
          </span>
        )}
        {preco && (
          <span className="mt-2 block text-sm font-semibold tabular-nums text-foreground">
            {preco}
          </span>
        )}
      </span>
      {temFoto && (
        <span className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border/60">
          <Foto src={item.imagem_url!} alt="" prioridade={indice < 3} className="h-full w-full" />
        </span>
      )}
    </button>
  );
}
