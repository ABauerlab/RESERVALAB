import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Maximize2, X } from "lucide-react";
import { useState } from "react";

import { formatPreco, type ItemCardapio } from "@/lib/cardapio";
import { Foto, SeloDestaque } from "./ItemCardapio";

/**
 * Detalhe do prato: folha que sobe no celular e janela no desktop. A foto aparece inteira (sem
 * cortar) e pode ser ampliada em tela cheia. Fechar volta ao ponto exato da lista.
 */
export function ItemDetalhe({
  item,
  categoria,
  onFechar,
}: {
  item: ItemCardapio | null;
  categoria?: string;
  onFechar: () => void;
}) {
  const [ampliada, setAmpliada] = useState(false);
  const preco = item ? formatPreco(item.preco_centavos) : null;
  return (
    <>
      <DialogPrimitive.Root open={!!item} onOpenChange={(o) => !o && onFechar()}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-card shadow-xl safe-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-8 sm:inset-y-auto sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 sm:rounded-2xl"
          >
            {item && (
              <>
                <div className="relative overflow-y-auto overscroll-contain">
                  {item.imagem_url && (
                    <div className="relative bg-slate-100">
                      <button
                        type="button"
                        onClick={() => setAmpliada(true)}
                        aria-label={`Ampliar foto de ${item.nome}`}
                        className="block w-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
                      >
                        <Foto
                          src={item.imagem_url}
                          alt={item.nome}
                          prioridade
                          contain
                          className="max-h-[52dvh] w-full"
                        />
                      </button>
                      <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-slate-900/70 px-2.5 py-1 text-xs font-semibold text-white">
                        <Maximize2 className="h-3 w-3" aria-hidden="true" /> Ampliar
                      </span>
                    </div>
                  )}
                  <div className="p-5">
                    {item.destaque && (
                      <div className="mb-2">
                        <SeloDestaque />
                      </div>
                    )}
                    {categoria && (
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {categoria}
                      </p>
                    )}
                    <DialogPrimitive.Title className="mt-0.5 break-words text-2xl font-extrabold leading-tight tracking-tight text-foreground">
                      {item.nome}
                    </DialogPrimitive.Title>
                    {preco && (
                      <p className="mt-2 text-xl font-bold tabular-nums text-foreground">{preco}</p>
                    )}
                    {item.descricao && (
                      <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
                        {item.descricao}
                      </p>
                    )}
                  </div>
                </div>
                <DialogPrimitive.Close
                  aria-label="Fechar"
                  className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-card/90 text-foreground shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
                >
                  <X className="h-5 w-5" />
                </DialogPrimitive.Close>
              </>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <DialogPrimitive.Root open={ampliada && !!item?.imagem_url} onOpenChange={setAmpliada}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/90" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-0 z-[60] flex items-center justify-center p-3 outline-none"
            onClick={() => setAmpliada(false)}
          >
            <DialogPrimitive.Title className="sr-only">Foto de {item?.nome}</DialogPrimitive.Title>
            {item?.imagem_url && (
              <img
                src={item.imagem_url}
                alt={item.nome}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain"
              />
            )}
            <DialogPrimitive.Close
              aria-label="Fechar foto"
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
