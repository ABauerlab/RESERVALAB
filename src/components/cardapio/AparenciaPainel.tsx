import { Check, Eye, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { CategoriaCardapio } from "@/lib/cardapio";
import {
  LAYOUTS,
  LAYOUT_INFO,
  analisarCardapio,
  ehLayout,
  sugerirLayout,
  type LayoutCardapio,
} from "@/lib/cardapio-layout";
import { cn } from "@/lib/utils";

/** Desenho minimo de cada layout, so com blocos, para a pessoa reconhecer sem ler. */
function Miniatura({ layout }: { layout: LayoutCardapio }) {
  const bloco = "rounded-[3px] bg-slate-300";
  const linha = "h-1 rounded-full bg-slate-200";
  if (layout === "cards")
    return (
      <div className="grid grid-cols-2 gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className="space-y-1 rounded-[4px] border border-slate-200 p-1">
            <div className={cn(bloco, "h-4")} />
            <div className={cn(linha, "w-3/4")} />
          </div>
        ))}
      </div>
    );
  if (layout === "galeria")
    return (
      <div className="space-y-1" aria-hidden="true">
        {[0, 1].map((n) => (
          <div key={n} className="rounded-[4px] border border-slate-200 p-1">
            <div className={cn(bloco, "h-5")} />
            <div className={cn(linha, "mt-1 w-2/3")} />
          </div>
        ))}
      </div>
    );
  if (layout === "compacto")
    return (
      <div className="space-y-1.5" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((n) => (
          <div key={n} className="flex items-center justify-between gap-2">
            <div className={cn(linha, "w-2/3")} />
            <div className={cn(linha, "w-1/6 bg-slate-300")} />
          </div>
        ))}
      </div>
    );
  return (
    <div className="space-y-1.5" aria-hidden="true">
      {[0, 1, 2].map((n) => (
        <div
          key={n}
          className="flex items-center gap-1.5 rounded-[4px] border border-slate-200 p-1"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <div className={cn(linha, "w-3/4 bg-slate-300")} />
            <div className={cn(linha, "w-full")} />
          </div>
          <div className={cn(bloco, "size-4 shrink-0")} />
        </div>
      ))}
    </div>
  );
}

/**
 * Aparencia do cardapio: o sistema olha as fotos, a quantidade de itens e as descricoes e sugere o
 * melhor layout. A pessoa aceita, escolhe outro ou volta ao automatico. Nada de conteudo muda.
 */
export function AparenciaPainel({
  categorias,
  salvo,
  salvando,
  testando,
  onTestar,
  onSalvar,
}: {
  /** So o que esta ativo (o que o cliente veria). */
  categorias: CategoriaCardapio[];
  salvo: string | null | undefined;
  salvando: boolean;
  testando: LayoutCardapio | null;
  onTestar: (l: LayoutCardapio | null) => void;
  onSalvar: (l: LayoutCardapio | null) => void;
}) {
  const analise = useMemo(() => analisarCardapio(categorias), [categorias]);
  const sugestao = useMemo(() => sugerirLayout(analise), [analise]);
  const [aberta, setAberta] = useState(false);
  const atual = ehLayout(salvo) ? salvo : null;
  const emUso = atual ?? sugestao.layout;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">Otimizar visual</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Analisamos suas fotos, itens e descrições e sugerimos o melhor layout. Nada do
              conteúdo muda: preços, itens e publicação ficam como estão.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setAberta(true)}
            disabled={analise.itens === 0}
            className="h-11 rounded-md"
          >
            <Sparkles className="mr-1.5 h-4 w-4" aria-hidden="true" /> Sugerir layout
          </Button>
        </div>

        {analise.itens === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Adicione itens ativos na aba Conteúdo para receber uma sugestão.
          </p>
        )}

        {aberta && analise.itens > 0 && (
          <div
            role="region"
            aria-label="Sugestão de layout"
            className="mt-4 rounded-lg border border-primary/25 bg-accent/60 p-4"
          >
            <p className="text-sm font-semibold text-accent-foreground">
              Recomendamos: {LAYOUT_INFO[sugestao.layout].nome}
            </p>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {sugestao.motivos.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              {analise.itens} {analise.itens === 1 ? "item" : "itens"} em {analise.categorias}{" "}
              {analise.categorias === 1 ? "categoria" : "categorias"}, {analise.comFoto} com foto
              {analise.destaques > 0 ? `, ${analise.destaques} em destaque` : ""}.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => {
                  onSalvar(sugestao.layout);
                  setAberta(false);
                }}
                disabled={salvando}
                className="h-11 rounded-md"
              >
                <Check className="mr-1.5 h-4 w-4" aria-hidden="true" /> Aplicar sugestão
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onTestar(sugestao.layout)}
                className="h-11 rounded-md"
              >
                <Eye className="mr-1.5 h-4 w-4" aria-hidden="true" /> Ver como fica
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  onTestar(null);
                  setAberta(false);
                }}
                className="h-11 rounded-md"
              >
                Agora não
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-base font-semibold">Escolher o layout</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {atual
            ? `Você escolheu ${LAYOUT_INFO[atual].nome}.`
            : `Automático: hoje o sistema usa ${LAYOUT_INFO[sugestao.layout].nome}.`}
        </p>
        <div
          role="radiogroup"
          aria-label="Layout do cardápio"
          className="mt-3 grid gap-2 sm:grid-cols-2"
        >
          {LAYOUTS.map((l) => {
            const ativo = emUso === l;
            return (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={ativo}
                disabled={salvando}
                onClick={() => {
                  onTestar(null);
                  onSalvar(l);
                }}
                className={cn(
                  "flex gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30",
                  ativo ? "border-primary bg-accent/60" : "border-border bg-card hover:bg-muted",
                )}
              >
                <span className="w-16 shrink-0">
                  <Miniatura layout={l} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    {LAYOUT_INFO[l].nome}
                    {ativo && <Check className="h-3.5 w-3.5 text-primary" aria-label="Em uso" />}
                    {!atual && sugestao.layout === l && (
                      <span className="rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground">
                        Sugerido
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                    {LAYOUT_INFO[l].descricao}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {atual && (
          <Button
            type="button"
            variant="ghost"
            disabled={salvando}
            onClick={() => {
              onTestar(null);
              onSalvar(null);
            }}
            className="mt-3 h-11 rounded-md"
          >
            Voltar ao automático
          </Button>
        )}
        {testando && (
          <p className="mt-3 text-xs text-muted-foreground">
            A prévia ao lado mostra {LAYOUT_INFO[testando].nome} só para você ver. Aplique para
            valer.
          </p>
        )}
      </section>
    </div>
  );
}
