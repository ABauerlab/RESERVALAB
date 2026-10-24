import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  datasSemanais,
  parseValor,
  STATUS,
  STATUS_LABEL,
  TIPO_LABEL,
  TIPOS,
  type Atracao,
  type StatusAtracao,
  type TipoAtracao,
} from "@/lib/atracoes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Form = {
  titulo: string;
  data: string;
  inicio: string;
  fim: string;
  tipo: TipoAtracao;
  status: StatusAtracao;
  contato: string;
  cache: string;
  observacoes: string;
  repetir: boolean;
};

function formInicial(atracao: Atracao | null, data: string): Form {
  return {
    titulo: atracao?.titulo ?? "",
    data: atracao?.data ?? data,
    inicio: atracao?.horario_inicio?.slice(0, 5) ?? "",
    fim: atracao?.horario_fim?.slice(0, 5) ?? "",
    tipo: atracao?.tipo ?? "musica_ao_vivo",
    status: atracao?.status ?? "ideia",
    contato: atracao?.contato ?? "",
    cache: atracao?.cache_valor != null ? String(atracao.cache_valor).replace(".", ",") : "",
    observacoes: atracao?.observacoes ?? "",
    repetir: false,
  };
}

/** Criar (atracao = null) ou editar uma atração. Fecha e atualiza a agenda ao salvar. */
export function AtracaoDialog({
  open,
  onClose,
  tenantId,
  atracao,
  dataInicial,
}: {
  open: boolean;
  onClose: () => void;
  tenantId: string;
  atracao: Atracao | null;
  dataInicial: string;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(() => formInicial(atracao, dataInicial));
  const [confirmaExcluir, setConfirmaExcluir] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(formInicial(atracao, dataInicial));
      setConfirmaExcluir(false);
    }
  }, [open, atracao, dataInicial]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const cache = parseValor(form.cache);
  const cacheInvalido = Number.isNaN(cache);
  const horarioInvalido = !!form.inicio && !!form.fim && form.fim <= form.inicio;
  const datasRepetidas = form.repetir && !atracao ? datasSemanais(form.data) : [form.data];
  const pode = form.titulo.trim().length > 0 && !!form.data && !cacheInvalido && !horarioInvalido;

  const invalidar = () => qc.invalidateQueries({ queryKey: ["atracoes", tenantId] });

  const salvar = useMutation({
    mutationFn: async () => {
      const base = {
        titulo: form.titulo.trim(),
        horario_inicio: form.inicio || null,
        horario_fim: form.fim || null,
        tipo: form.tipo,
        status: form.status,
        contato: form.contato.trim() || null,
        cache_valor: cache,
        observacoes: form.observacoes.trim() || null,
      };
      if (atracao) {
        const { error } = await supabase
          .from("atracoes")
          .update({ ...base, data: form.data })
          .eq("id", atracao.id)
          .eq("tenant_id", tenantId);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("atracoes")
        .insert(datasRepetidas.map((data) => ({ ...base, data, tenant_id: tenantId })));
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(atracao ? "Atração atualizada." : "Atração adicionada.");
      invalidar();
      onClose();
    },
    onError: () => toast.error("Não foi possível salvar a atração."),
  });

  const excluir = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("atracoes")
        .delete()
        .eq("id", atracao!.id)
        .eq("tenant_id", tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Atração removida.");
      invalidar();
      onClose();
    },
    onError: () => toast.error("Não foi possível remover a atração."),
  });

  const ocupado = salvar.isPending || excluir.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !ocupado && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{atracao ? "Editar atração" : "Nova atração"}</DialogTitle>
          <DialogDescription>
            Só a equipe e os donos veem esta agenda. Nada aparece para o cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="at-titulo" className="text-[13px]">
              Atração
            </Label>
            <Input
              id="at-titulo"
              value={form.titulo}
              onChange={(e) => set("titulo", e.target.value)}
              placeholder="Ex: Samba com Sérgio Santiago e Banda"
              className="h-11 rounded-md"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="at-data" className="text-[13px]">
                Data
              </Label>
              <Input
                id="at-data"
                type="date"
                value={form.data}
                onChange={(e) => set("data", e.target.value)}
                className="h-11 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="at-inicio" className="text-[13px]">
                Início
              </Label>
              <Input
                id="at-inicio"
                type="time"
                value={form.inicio}
                onChange={(e) => set("inicio", e.target.value)}
                className="h-11 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="at-fim" className="text-[13px]">
                Fim
              </Label>
              <Input
                id="at-fim"
                type="time"
                value={form.fim}
                onChange={(e) => set("fim", e.target.value)}
                aria-invalid={horarioInvalido}
                className="h-11 rounded-md"
              />
            </div>
          </div>
          {horarioInvalido && (
            <p className="-mt-2 text-xs text-destructive">O fim precisa ser depois do início.</p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[13px]">Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => set("tipo", v as TipoAtracao)}>
                <SelectTrigger aria-label="Tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIPO_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Situação</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as StatusAtracao)}>
                <SelectTrigger aria-label="Situação">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="at-contato" className="text-[13px]">
                Contato do artista (opcional)
              </Label>
              <Input
                id="at-contato"
                value={form.contato}
                onChange={(e) => set("contato", e.target.value)}
                placeholder="Nome ou WhatsApp"
                className="h-11 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="at-cache" className="text-[13px]">
                Cachê em R$ (opcional)
              </Label>
              <Input
                id="at-cache"
                inputMode="decimal"
                value={form.cache}
                onChange={(e) => set("cache", e.target.value)}
                aria-invalid={cacheInvalido}
                placeholder="1.500,00"
                className="h-11 rounded-md"
              />
              {cacheInvalido && <p className="text-xs text-destructive">Valor inválido.</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="at-obs" className="text-[13px]">
              Observações (opcional)
            </Label>
            <Textarea
              id="at-obs"
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              placeholder="Equipamento, passagem de som, pendências com o artista..."
              className="min-h-20 rounded-md"
            />
          </div>

          {!atracao && (
            <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border bg-muted/40 p-3 text-sm">
              <input
                type="checkbox"
                checked={form.repetir}
                onChange={(e) => set("repetir", e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                Repetir toda semana até o fim do mês
                {form.repetir && datasRepetidas.length > 1 && (
                  <span className="block text-xs text-muted-foreground">
                    Cria {datasRepetidas.length} atrações, uma por semana.
                  </span>
                )}
              </span>
            </label>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {atracao ? (
            <Button
              type="button"
              variant="ghost"
              disabled={ocupado}
              onClick={() => (confirmaExcluir ? excluir.mutate() : setConfirmaExcluir(true))}
              className="h-11 rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              {excluir.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {confirmaExcluir ? "Confirmar exclusão" : "Excluir"}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={ocupado}
              onClick={onClose}
              className="h-11 rounded-md"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!pode || ocupado}
              onClick={() => salvar.mutate()}
              className="h-11 rounded-md bg-primary px-6 text-primary-foreground hover:bg-blue-700"
            >
              {salvar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
