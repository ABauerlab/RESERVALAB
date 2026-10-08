import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Maximize2, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Flyer do evento inteiro, em qualquer proporcao. O espaco e reservado pelo tamanho real (sem
 * salto de layout), a imagem usa `contain` (nunca corta texto), respeita a altura da tela e abre
 * ampliada ao toque. Sem tamanho conhecido, usa o da propria imagem ao carregar.
 */
export function FlyerEvento({
  src,
  alt,
  largura,
  altura,
  prioridade,
  className,
}: {
  src: string;
  alt: string;
  largura?: number | null;
  altura?: number | null;
  prioridade?: boolean;
  className?: string;
}) {
  const [ampliado, setAmpliado] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  if (falhou) return null;
  const w = largura && altura ? largura : natural?.w;
  const h = largura && altura ? altura : natural?.h;
  return (
    <>
      <button
        type="button"
        onClick={() => setAmpliado(true)}
        aria-label={`Ampliar o flyer de ${alt}`}
        className={cn(
          "group relative flex w-full items-center justify-center bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30",
          className,
        )}
      >
        <img
          src={src}
          alt={alt}
          width={w ?? undefined}
          height={h ?? undefined}
          loading={prioridade ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={prioridade ? "high" : undefined}
          referrerPolicy="no-referrer"
          onLoad={(e) =>
            setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
          }
          onError={() => setFalhou(true)}
          style={w && h ? { aspectRatio: `${w} / ${h}` } : undefined}
          className="h-auto max-h-[min(80dvh,720px)] w-full object-contain"
        />
        <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-slate-900/70 px-2.5 py-1 text-xs font-semibold text-white">
          <Maximize2 className="h-3 w-3" aria-hidden="true" /> Ampliar
        </span>
      </button>

      <DialogPrimitive.Root open={ampliado} onOpenChange={setAmpliado}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/90" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            onClick={() => setAmpliado(false)}
            className="fixed inset-0 z-[60] flex items-center justify-center p-3 outline-none"
          >
            <DialogPrimitive.Title className="sr-only">Flyer: {alt}</DialogPrimitive.Title>
            <img
              src={src}
              alt={alt}
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full object-contain"
            />
            <DialogPrimitive.Close
              aria-label="Fechar flyer"
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
