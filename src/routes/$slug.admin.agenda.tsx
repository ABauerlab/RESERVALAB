import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarX2, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useTenantAdmin } from "@/hooks/use-tenant-admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { formatData, formatHorario } from "@/lib/reservations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/$slug/admin/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — ReservaLab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  component: AgendaPage,
});

function AgendaPage() {
  const { slug } = useParams({ from: "/$slug/admin/agenda" });
  const admin = useTenantAdmin(slug);
  const tenantId = admin.tenant?.id ?? null;
  const qc = useQueryClient();

  const [data, setData] = useState("");
  const [diaTodo, setDiaTodo] = useState(true);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [motivo, setMotivo] = useState("");

  const bloqueiosQ = useQuery({
    enabled: !!tenantId,
    queryKey: ["bloqueios-admin", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agenda_bloqueios")
        .select("*")
        .eq("tenant_id", tenantId!)
        .gte("data", new Date().toISOString().slice(0, 10))
        .order("data", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const criar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("agenda_bloqueios").insert({
        tenant_id: tenantId!,
        data,
        hora_inicio: diaTodo ? null : (horaInicio || null),
        hora_fim: diaTodo ? null : (horaFim || null),
        motivo: motivo.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bloqueio adicionado.");
      setData(""); setHoraInicio(""); setHoraFim(""); setMotivo(""); setDiaTodo(true);
      qc.invalidateQueries({ queryKey: ["bloqueios-admin", tenantId] });
    },
    onError: () => toast.error("Não foi possível adicionar o bloqueio."),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agenda_bloqueios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bloqueio removido.");
      qc.invalidateQueries({ queryKey: ["bloqueios-admin", tenantId] });
    },
    onError: () => toast.error("Não foi possível remover."),
  });

  const podeCriar = !!data && (diaTodo || (!!horaInicio && !!horaFim && horaFim > horaInicio)) && !criar.isPending;

  if (!admin.ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AdminShell slug={slug} tenantNome={admin.tenant?.nome ?? ""} active="agenda">
      <div className="mx-auto max-w-4xl px-5 pt-6">
        <header className="animate-fade">
          <h2 className="font-serif text-3xl tracking-tight">Bloqueios de agenda</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Dias ou horários bloqueados não aceitam novas reservas dos clientes.
          </p>
        </header>

        <section className="mt-6 rounded-2xl border border-border bg-card p-5 animate-in-up">
          <h3 className="font-medium">Novo bloqueio</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[13px]">Data</Label>
              <Input type="date" min={new Date().toISOString().slice(0, 10)} value={data} onChange={(e) => setData(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Abrangência</Label>
              <div className="flex gap-1.5 rounded-xl bg-muted p-1">
                <button type="button" onClick={() => setDiaTodo(true)} className={`h-9 flex-1 rounded-lg text-xs font-medium transition-all ${diaTodo ? "bg-background shadow-[var(--shadow-sm)]" : "text-muted-foreground"}`}>Dia inteiro</button>
                <button type="button" onClick={() => setDiaTodo(false)} className={`h-9 flex-1 rounded-lg text-xs font-medium transition-all ${!diaTodo ? "bg-background shadow-[var(--shadow-sm)]" : "text-muted-foreground"}`}>Faixa de horário</button>
              </div>
            </div>
          </div>

          {!diaTodo && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[13px]">Das</Label>
                <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Até</Label>
                <Input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} className="h-11 rounded-xl" />
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <Label className="text-[13px]">Motivo (opcional, visível ao cliente)</Label>
            <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: Evento fechado" className="h-11 rounded-xl" />
          </div>

          <Button onClick={() => criar.mutate()} disabled={!podeCriar} className="mt-5 h-11 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto sm:px-6">
            {criar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Bloquear
          </Button>
        </section>

        <section className="mt-8">
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Bloqueios ativos</h3>
          {bloqueiosQ.isLoading ? (
            <div className="mt-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (bloqueiosQ.data?.length ?? 0) === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-card/50 py-12 text-center">
              <CalendarX2 className="mx-auto h-6 w-6 text-muted-foreground/60" />
              <p className="mt-3 font-serif text-2xl">Nenhum bloqueio</p>
              <p className="mt-1 text-sm text-muted-foreground">A agenda está totalmente aberta.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {bloqueiosQ.data!.map((b) => (
                <li key={b.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{formatData(b.data)}</p>
                    <p className="text-sm text-muted-foreground">
                      {b.hora_inicio && b.hora_fim
                        ? `Das ${formatHorario(b.hora_inicio)} às ${formatHorario(b.hora_fim)}`
                        : "Dia inteiro"}
                      {b.motivo ? ` · ${b.motivo}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => remover.mutate(b.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remover bloqueio"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
