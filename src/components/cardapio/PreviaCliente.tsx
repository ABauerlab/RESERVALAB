import { ExternalLink } from "lucide-react";

import type { LayoutCardapio } from "@/lib/cardapio-layout";

/**
 * "Como o cliente verá": a propria pagina publica em modo previa (so abre conteudo para o admin da
 * empresa), dentro de uma moldura de celular. `versao` forca recarregar depois de cada edicao.
 */
export function PreviaCliente({
  slug,
  layout,
  versao,
}: {
  slug: string;
  layout: LayoutCardapio | null;
  versao: number;
}) {
  const src = `/${slug}/cardapio?previa=1${layout ? `&layout=${layout}` : ""}`;
  return (
    <aside aria-label="Como o cliente verá">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
          Como o cliente verá
        </h2>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Abrir <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>
      <div className="mx-auto w-full max-w-[380px] overflow-hidden rounded-[28px] border-[6px] border-slate-800 bg-background shadow-lg">
        <iframe
          key={`${src}-${versao}`}
          src={src}
          title="Prévia do cardápio como o cliente verá"
          loading="lazy"
          className="h-[min(720px,calc(100dvh-10rem))] w-full border-0"
        />
      </div>
    </aside>
  );
}
