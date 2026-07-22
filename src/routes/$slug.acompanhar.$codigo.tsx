import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  AREA_LABEL, STATUS_LABEL, TIPO_LABEL,
  formatData, formatHorario,
  type Reserva, type ReservaArea, type ReservaStatus,
} from "@/lib/reservations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/$slug/acompanhar/$codigo")({
  head: () => ({
    meta: [
      { title: "Sua reserva — ReservaLab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  component: AcompanharDetalhes,
});

function AcompanharDetalhes() {
  const { slug, codigo } = useParams({ from: "/$slug/acompanhar/$codigo" });
  const qc = useQueryClient();

  const reservaQ = useQuery({
    queryKey: ["reserva-por-codigo", codigo],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_reserva_by_codigo", { _codigo: codigo });
      if (error) throw error;
      const first = Array.isArray(data) ? data[0] : null;
      return (first ?? null) as Reserva | null;
    },
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-5 pt-6 pb-24 safe-top safe-bottom">
        <Link to="/$slug/acompanhar" params={{ slug }} className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Outra consulta
        </Link>

        <header className="mt-6 animate-fade">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-terracotta">Acompanhar</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight">Reserva {codigo}</h1>
        </header>

        {reservaQ.isLoading ? (
          <div className="mt-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : !reservaQ.data ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 py-14 text-center">
            <p className="font-serif text-2xl text-foreground">Não encontramos</p>
            <p className="mt-1 text-sm text-muted-foreground">Confira o código digitado.</p>
          </div>
        ) : (
          <ReservaEdit reserva={reservaQ.data} onUpdated={(r) => qc.setQueryData(["reserva-por-codigo", codigo], r)} />
        )}
      </div>
    </main>
  );
}

function ReservaEdit({ reserva, onUpdated }: { reserva: Reserva; onUpdated: (r: Reserva) => void }) {
  const bloqueada = reserva.status === "cancelada" || reserva.status === "finalizada";
  const [data, setData] = useState(reserva.data ?? "");
  const [horario, setHorario] = useState(reserva.horario ?? "");
  const [quantidade, setQuantidade] = useState<string>(String(reserva.quantidade ?? ""));
  const [area, setArea] = useState<ReservaArea | "">(reserva.area ?? "");
  const [observacoes, setObservacoes] = useState(reserva.observacoes ?? "");

  useEffect(() => {
    setData(reserva.data ?? "");
    setHorario(reserva.horario ?? "");
    setQuantidade(String(reserva.quantidade ?? ""));
    setArea(reserva.area ?? "");
    setObservacoes(reserva.observacoes ?? "");
  }, [reserva]);

  const salvar = useMutation({
    mutationFn: async () => {
      const args = {
        _codigo: reserva.codigo_acompanhamento,
        _data: data || null,
        _horario: horario || null,
        _quantidade: quantidade ? parseInt(quantidade, 10) : null,
        _area: area || null,
        _observacoes: observacoes || null,
      };
      const { data: updated, error } = await (supabase.rpc as unknown as (
        fn: "update_reserva_by_codigo",
        params: typeof args,
      ) => Promise<{ data: Reserva | null; error: unknown }>)("update_reserva_by_codigo", args);
      if (error) throw error;
      return updated;
    },
    onSuccess: (r) => { toast.success("Reserva atualizada."); if (r) onUpdated(r); },
    onError: () => toast.error("Não foi possível atualizar."),
  });

  return (
    <div className="mt-6 space-y-5 animate-in-up">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{TIPO_LABEL[reserva.tipo]}</p>
            <p className="mt-1 font-serif text-2xl text-foreground">{reserva.nome}</p>
          </div>
          <StatusPill status={reserva.status} />
        </div>
        <div className="mt-4 grid gap-1.5 text-sm text-muted-foreground">
          <p>Telefone: <span className="text-foreground">{reserva.telefone}</span></p>
          {reserva.data && <p>Data: <span className="text-foreground">{formatData(reserva.data)}</span></p>}
          {reserva.horario && <p>Horário: <span className="text-foreground">{formatHorario(reserva.horario)}</span></p>}
          {reserva.area && <p>Área: <span className="text-foreground">{AREA_LABEL[reserva.area]}</span></p>}
        </div>
      </div>

      {bloqueada ? (
        <p className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Esta reserva está {STATUS_LABEL[reserva.status].toLowerCase()} e não pode mais ser alterada. Para uma nova solicitação, faça uma reserva.
        </p>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <h2 className="font-medium">Alterar dados</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[13px]">Data</Label>
                <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Horário</Label>
                <Input type="time" value={horario} onChange={(e) => setHorario(e.target.value)} className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[13px]">Quantidade</Label>
                <Input type="number" min={1} max={5000} value={quantidade} onChange={(e) => setQuantidade(e.target.value.replace(/\D/g, ""))} className="h-11 rounded-xl" />
              </div>
              {reserva.tipo === "mesa" && (
                <div className="space-y-2">
                  <Label className="text-[13px]">Área</Label>
                  <Select value={area || undefined} onValueChange={(v) => setArea(v as ReservaArea)}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Sem preferência" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interna">Interna</SelectItem>
                      <SelectItem value="externa">Externa</SelectItem>
                      <SelectItem value="sem_preferencia">Sem preferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Observações</Label>
              <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="min-h-24 rounded-xl" />
            </div>
          </div>

          <Button onClick={() => salvar.mutate()} disabled={salvar.isPending} className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
            {salvar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar alterações
          </Button>
        </>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: ReservaStatus }) {
  const styles: Record<ReservaStatus, string> = {
    pendente:   "bg-warning/15 text-[oklch(0.45_0.11_65)]",
    confirmada: "bg-success/15 text-[oklch(0.4_0.12_150)]",
    cancelada:  "bg-destructive/12 text-destructive",
    finalizada: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-medium ${styles[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
