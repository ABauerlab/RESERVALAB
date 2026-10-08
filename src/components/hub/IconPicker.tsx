import { useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { HubIcone } from "@/components/hub/HubIcone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { enviarImagemDaEmpresa } from "@/lib/assets";
import { CATALOGO_ICONES, ICONE_PROPRIO, iconeDoCatalogo } from "@/lib/hub-icons";
import { cn } from "@/lib/utils";

export type IconeEscolhido = { icone: string | null; icone_url: string | null };

/**
 * Fluxo do icone do link: 1) escolher na biblioteca, 2) ou enviar o proprio, 3) ver a previa,
 * 4) salvar. "Automatico" deixa o Teggly reconhecer a marca pelo endereco do link.
 */
export function IconPicker({
  aberto,
  onFechar,
  tenantId,
  atual,
  titulo,
  onSalvar,
}: {
  aberto: boolean;
  onFechar: () => void;
  tenantId: string;
  atual: IconeEscolhido;
  titulo: string;
  onSalvar: (v: IconeEscolhido) => void;
}) {
  const [sel, setSel] = useState<IconeEscolhido>(atual);
  const [enviando, setEnviando] = useState(false);
  const arquivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aberto) setSel(atual);
  }, [aberto, atual.icone, atual.icone_url]); // eslint-disable-line react-hooks/exhaustive-deps

  async function subir(file: File | undefined) {
    if (!file) return;
    setEnviando(true);
    try {
      const url = await enviarImagemDaEmpresa(tenantId, "icone", file);
      setSel({ icone: ICONE_PROPRIO, icone_url: url });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível enviar o ícone.");
    } finally {
      setEnviando(false);
      if (arquivo.current) arquivo.current.value = "";
    }
  }

  const rotuloSel =
    sel.icone === ICONE_PROPRIO
      ? "Seu ícone"
      : (iconeDoCatalogo(sel.icone)?.rotulo ?? "Automático");

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ícone de {titulo || "link"}</DialogTitle>
          <DialogDescription>
            Escolha na biblioteca ou envie o ícone da sua marca (PNG, JPG ou WebP).
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-slate-50 p-3">
          <span className="grid size-12 place-items-center rounded-lg bg-card">
            <HubIcone chave={sel.icone} iconeUrl={sel.icone_url} colorido className="h-7 w-7" />
          </span>
          <div className="text-sm">
            <p className="font-semibold">{rotuloSel}</p>
            <p className="text-xs text-muted-foreground">Prévia como aparece no Link Hub.</p>
          </div>
        </div>

        <div role="radiogroup" aria-label="Biblioteca de ícones" className="grid grid-cols-3 gap-2">
          <button
            type="button"
            role="radio"
            aria-checked={sel.icone === null}
            onClick={() => setSel({ icone: null, icone_url: null })}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center rounded-lg border px-2 py-2 text-xs font-medium",
              sel.icone === null
                ? "border-primary bg-blue-50 text-blue-700"
                : "border-border hover:bg-accent",
            )}
          >
            Automático
          </button>
          {CATALOGO_ICONES.map((i) => (
            <button
              key={i.chave}
              type="button"
              role="radio"
              aria-checked={sel.icone === i.chave}
              onClick={() => setSel({ icone: i.chave, icone_url: null })}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium",
                sel.icone === i.chave
                  ? "border-primary bg-blue-50 text-blue-700"
                  : "border-border hover:bg-accent",
              )}
            >
              <HubIcone chave={i.chave} className="h-5 w-5" />
              <span className="text-center leading-tight">{i.rotulo}</span>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-border p-3">
          <input
            ref={arquivo}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            aria-label="Enviar ícone próprio"
            onChange={(e) => void subir(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            disabled={enviando}
            onClick={() => arquivo.current?.click()}
            className="h-11 w-full rounded-md"
          >
            {enviando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Enviar meu ícone
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Usamos a imagem em tamanho pequeno e quadrado. Ideal: fundo transparente.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onFechar} className="h-11 rounded-md">
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onSalvar(sel);
              onFechar();
            }}
            disabled={enviando}
            className="h-11 rounded-md"
          >
            Usar este ícone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
