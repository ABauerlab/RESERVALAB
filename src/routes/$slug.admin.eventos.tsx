import { pwaHeadLinks } from "@/lib/pwa-manifest";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Music, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { enviarFlyerDoEvento } from "@/lib/assets";
import { FlyerEvento } from "@/components/public/FlyerEvento";
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
  imagem_largura?: number | null;
  imagem_altura?: number | null;
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
  const [dim, setDim] = useState<{ w: number; h: number } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const arquivo = useRef<HTMLInputElement>(null);
  const arquivoTroca = useRef<HTMLInputElement>(null);
  const [trocandoId, setTrocandoId] = useState<string | null>(null);

  async function enviarFlyer(file: File | undefined) {
    if (!file || !tenantId) return;
    setEnviando(true);
    try {
      const f = await enviarFlyerDoEvento(tenantId, file);
      setImagemUrl(f.url);
      setDim({ w: f.largura, h: f.altura });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível enviar o flyer.");
    } finally {
      setEnviando(false);
      if (arquivo.current) arquivo.current.value = "";
    }
  }

  const trocarFlyer = useMutation({
    mutationFn: async (a: { id: string; file: File }) => {
      const f = await enviarFlyerDoEvento(tenantId!, a.file);
      const { error } = await supabase
        .from("eventos_destaque")
        .update({ imagem_url: f.url, imagem_largura: f.largura, imagem_altura: f.altura } as never)
        .eq("id", a.id)
        .eq("tenant_id", tenantId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Flyer atualizado.");
      qc.invalidateQueries({ queryKey: ["eventos-admin", tenantId] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível trocar o flyer."),
    onSettled: () => {
      setTrocandoId(null);
      if (arquivoTroca.current) arquivoTroca.current.value = "";
    },
  });

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
        ...(imagemUrl.trim() && dim ? { imagem_largura: dim.w, imagem_altura: dim.h } : {}),
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Evento adicionado.");
      setTitulo("");
      setData("");
      setHorario("");
      setDescricao("");
      setImagemUrl("");
      setDim(null);
      qc.invalidateQueries({ queryKey: ["eventos-admin", tenantId] });
    },
    onError: () => toast.error("Não foi possível adicionar o evento."),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("eventos_destaque")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId!);
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

        <section
          data-tour="eventos-novo"
          className="mt-6 rounded-lg border border-border bg-card p-5 animate-in-up"
        >
          <h3 className="font-semibold">Novo evento</h3>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ev-titulo" className="text-[13px]">
                Título
              </Label>
              <Input
                id="ev-titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Samba com Sérgio Santiago e Banda"
                className="h-11 rounded-md"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ev-data" className="text-[13px]">
                  Data
                </Label>
                <Input
                  id="ev-data"
                  type="date"
                  min={hoje}
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="h-11 rounded-md"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ev-horario" className="text-[13px]">
                  Horário (opcional)
                </Label>
                <Input
                  id="ev-horario"
                  type="time"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  className="h-11 rounded-md"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-descricao" className="text-[13px]">
                Descrição (opcional)
              </Label>
              <Textarea
                id="ev-descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes que aparecem para o cliente na página de reservas."
                className="min-h-20 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Flyer do evento (opcional)</Label>
              <p className="text-xs text-muted-foreground">
                Qualquer formato: vertical, horizontal ou quadrado. O flyer aparece inteiro, sem
                cortar nem esticar.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={arquivo}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  aria-label="Enviar flyer"
                  onChange={(e) => void enviarFlyer(e.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={enviando || !tenantId}
                  onClick={() => arquivo.current?.click()}
                  className="h-11 rounded-md"
                >
                  {enviando ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="mr-2 h-4 w-4" />
                  )}
                  {imagemUrl ? "Trocar flyer" : "Enviar flyer"}
                </Button>
                {imagemUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setImagemUrl("");
                      setDim(null);
                    }}
                    className="h-11 rounded-md"
                  >
                    Remover
                  </Button>
                )}
                {dim && (
                  <span className="text-xs text-muted-foreground">
                    {dim.w} × {dim.h} px
                  </span>
                )}
              </div>
              <Input
                value={imagemUrl}
                onChange={(e) => {
                  setImagemUrl(e.target.value);
                  setDim(null);
                }}
                placeholder="ou cole o endereço da imagem (https://...)"
                aria-label="Endereço do flyer"
                className="h-11 rounded-md"
              />
              {imagemUrl.trim() && /^https?:\/\//i.test(imagemUrl.trim()) && (
                <div className="mt-2 max-w-xs overflow-hidden rounded-lg border border-border">
                  <p className="bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                    Como aparece para o cliente
                  </p>
                  <FlyerEvento
                    src={imagemUrl.trim()}
                    alt={titulo.trim() || "Prévia do flyer"}
                    largura={dim?.w}
                    altura={dim?.h}
                  />
                </div>
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
                  {e.imagem_url && (
                    <img
                      src={e.imagem_url}
                      alt=""
                      width={e.imagem_largura ?? 48}
                      height={e.imagem_altura ?? 64}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-16 w-12 shrink-0 rounded-md border border-border bg-slate-100 object-contain"
                    />
                  )}
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
                    type="button"
                    onClick={() => {
                      setTrocandoId(e.id);
                      arquivoTroca.current?.click();
                    }}
                    disabled={trocarFlyer.isPending}
                    className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent xl:h-9 xl:w-9"
                    aria-label={`${e.imagem_url ? "Trocar" : "Enviar"} flyer de ${e.titulo}`}
                  >
                    <ImagePlus className="h-4 w-4" />
                  </button>
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
          <input
            ref={arquivoTroca}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            aria-label="Novo flyer do evento"
            onChange={(ev) => {
              const f = ev.target.files?.[0];
              if (f && trocandoId) trocarFlyer.mutate({ id: trocandoId, file: f });
            }}
          />
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
