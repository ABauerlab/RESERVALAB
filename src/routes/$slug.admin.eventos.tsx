import { pwaHeadLinks } from "@/lib/pwa-manifest";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Music, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useTenantAdmin } from "@/hooks/use-tenant-admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader } from "@/components/admin/PageHeader";
import { formatData, formatHorario } from "@/lib/reservations";
import { todayISO } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type EventoRow = {
  id: string;
  titulo: string;
  data: string;
  horario: string | null;
  descricao: string | null;
  imagem_url: string | null;
};

export const Route = createFileRoute("/$slug/admin/eventos")({
  head: ({ params }) => ({
    meta: [{ title: "Eventos | Teggly" }, { name: "robots", content: "noindex" }],
    links: pwaHeadLinks(`/${params.slug}/admin`, "Admin"),
  }),
  ssr: false,
  component: EventosPage,
});

function EventosPage() {
  const { slug } = useParams({ from: "/$slug/admin/eventos" });
  const admin = useTenantAdmin(slug);
  const tenantId = admin.tenant?.id ?? null;
  const qc = useQueryClient();

  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");

  const eventosQ = useQuery({
    enabled: !!tenantId,
    queryKey: ["eventos-admin", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eventos_destaque")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("data", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const criar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("eventos_destaque").insert({
        tenant_id: tenantId!,
        titulo: titulo.trim(),
        data,
        horario: horario || null,
        descricao: descricao.trim() || null,
        imagem_url: imagemUrl.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Evento adicionado.");
      setTitulo("");
      setData("");
      setHorario("");
      setDescricao("");
      setImagemUrl("");
      qc.invalidateQueries({ queryKey: ["eventos-admin", tenantId] });
    },
    onError: () => toast.error("Não foi possível adicionar o evento."),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("eventos_destaque").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Evento removido.");
      qc.invalidateQueries({ queryKey: ["eventos-admin", tenantId] });
    },
    onError: () => toast.error("Não foi possível remover."),
  });

  const podeCriar = titulo.trim().length > 0 && !!data && !criar.isPending;

  const hoje = todayISO();
  const eventos = eventosQ.data ?? [];
  const futuros = eventos.filter((e: EventoRow) => e.data >= hoje);
  const passados = eventos.filter((e: EventoRow) => e.data < hoje);

  if (!admin.ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AdminShell slug={slug} tenantNome={admin.tenant?.nome ?? ""} active="eventos">
      <div className="mx-auto max-w-4xl px-5 pb-10 pt-6">
        <PageHeader
          title="Eventos"
          description="O próximo evento com data futura aparece automaticamente na página de reservas e some sozinho assim que a data passa."
        />

        <section className="mt-6 rounded-lg border border-border bg-card p-5 animate-in-up">
          <h3 className="font-semibold">Novo evento</h3>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-[13px]">Título</Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Samba com Sérgio Santiago e Banda"
                className="h-11 rounded-md"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[13px]">Data</Label>
                <Input
                  type="date"
                  min={hoje}
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="h-11 rounded-md"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Horário (opcional)</Label>
                <Input
                  type="time"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  className="h-11 rounded-md"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Descrição (opcional)</Label>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes que aparecem para o cliente na página de reservas."
                className="min-h-20 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">URL da imagem/flyer (opcional)</Label>
              <Input
                value={imagemUrl}
                onChange={(e) => setImagemUrl(e.target.value)}
                placeholder="https://..."
                className="h-11 rounded-md"
              />
              {imagemUrl.trim() && (
                <img
                  src={imagemUrl}
                  alt="Prévia do evento"
                  className="mt-2 max-h-48 w-auto rounded-lg object-contain"
                />
              )}
            </div>
          </div>
          <Button
            onClick={() => criar.mutate()}
            disabled={!podeCriar}
            className="mt-5 h-11 w-full rounded-md bg-primary text-primary-foreground hover:bg-blue-700 sm:w-auto sm:px-6"
          >
            {criar.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Adicionar evento
          </Button>
        </section>

        <section className="mt-8">
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Próximos eventos
          </h3>
          {eventosQ.isLoading ? (
            <div className="mt-6 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : futuros.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-border bg-card/50 py-12 text-center">
              <Music className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-3 font-serif font-semibold text-2xl">Nenhum evento</p>
              <p className="mt-1 text-sm text-muted-foreground">
                A página de reservas não mostra nenhum destaque no momento.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {futuros.map((e: EventoRow, i: number) => (
                <li
                  key={e.id}
                  className={`flex items-center gap-3 rounded-lg border bg-card p-4 ${i === 0 ? "border-brand/40" : "border-border"}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{e.titulo}</p>
                      {i === 0 && (
                        <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs font-medium text-brand">
                          No ar agora
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatData(e.data)}
                      {e.horario ? ` às ${formatHorario(e.horario)}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => remover.mutate(e.id)}
                    className="flex h-11 w-11 xl:h-9 xl:w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remover evento"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {passados.length > 0 && (
          <section className="mt-8">
            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Já realizados
            </h3>
            <ul className="mt-4 space-y-2.5">
              {passados.map((e: EventoRow) => (
                <li
                  key={e.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card/60 p-4 opacity-70"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{e.titulo}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatData(e.data)}
                      {e.horario ? ` às ${formatHorario(e.horario)}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => remover.mutate(e.id)}
                    className="flex h-11 w-11 xl:h-9 xl:w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remover evento"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AdminShell>
  );
}
