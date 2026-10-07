import { pwaHeadLinks } from "@/lib/pwa-manifest";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lightbulb, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useTenantAdmin } from "@/hooks/use-tenant-admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/$slug/admin/sugestoes")({
  head: ({ params }) => ({
    meta: [
      { title: "Sugestões | Teggly" },
      { name: "robots", content: "noindex" },
    ],
    links: pwaHeadLinks(`/${params.slug}/admin`, "Admin"),
  }),
  ssr: false,
  component: SugestoesPage,
});

const STATUS_TXT: Record<string, string> = {
  novo: "Recebida",
  em_analise: "Em análise",
  feito: "Implementada",
  recusado: "Não será feita",
};

// Pilulas de status no padrao Teggly: fundo 50, ponto 500, texto 700.
const STATUS_TONE: Record<string, string> = {
  novo: "bg-accent text-accent-foreground before:bg-blue-500",
  em_analise: "bg-warning-50 text-warning-700 before:bg-warning-500",
  feito: "bg-success-50 text-success-700 before:bg-success-500",
  recusado: "bg-error-50 text-error-700 before:bg-error-500",
};

function SugestoesPage() {
  const { slug } = useParams({ from: "/$slug/admin/sugestoes" });
  const admin = useTenantAdmin(slug);
  const tenantId = admin.tenant?.id ?? null;
  const qc = useQueryClient();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");

  const listaQ = useQuery({
    enabled: !!tenantId,
    queryKey: ["feedbacks", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedbacks")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const enviar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("feedbacks").insert({
        tenant_id: tenantId!,
        autor_user_id: admin.userId,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sugestão enviada. Obrigado!");
      setTitulo(""); setDescricao("");
      qc.invalidateQueries({ queryKey: ["feedbacks", tenantId] });
    },
    onError: () => toast.error("Não foi possível enviar a sugestão."),
  });

  if (!admin.ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const podeEnviar = titulo.trim().length >= 3 && descricao.trim().length >= 10 && !enviar.isPending;

  return (
    <AdminShell slug={slug} tenantNome={admin.tenant?.nome ?? ""} active="sugestoes">
      <div className="mx-auto max-w-4xl px-5 pt-6">
        <header className="animate-fade">
          <h2 className="font-serif text-3xl tracking-tight">Sugestões de melhoria</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Conte o que falta ou o que poderia funcionar melhor. A equipe Teggly recebe direto.
          </p>
        </header>

        <section className="mt-6 rounded-lg border border-border bg-card p-5 space-y-4 animate-in-up">
          <div className="space-y-2">
            <Label className="text-[13px]">Título</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Exportar reservas em planilha" className="h-11 rounded-md" />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px]">Descrição</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Explique como isso ajudaria no dia a dia." className="min-h-32 rounded-md" />
          </div>
          <Button onClick={() => enviar.mutate()} disabled={!podeEnviar} className="h-11 w-full rounded-md bg-primary text-primary-foreground hover:bg-blue-700 sm:w-auto sm:px-6">
            {enviar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Enviar sugestão
          </Button>
        </section>

        <section className="mt-8">
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Enviadas</h3>
          {listaQ.isLoading ? (
            <div className="mt-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (listaQ.data?.length ?? 0) === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-border bg-card/50 py-12 text-center">
              <Lightbulb className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-3 font-serif font-semibold text-2xl">Nenhuma sugestão ainda</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {listaQ.data!.map((f) => (
                <li key={f.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{f.titulo}</p>
                    <span className={`inline-flex h-[26px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold before:size-[7px] before:rounded-full before:content-[''] ${STATUS_TONE[f.status] ?? "bg-muted text-muted-foreground before:bg-slate-400"}`}>
                      {STATUS_TXT[f.status] ?? f.status}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">{f.descricao}</p>
                  {f.resposta_master && (
                    <p className="mt-3 rounded-lg bg-cream/60 p-3 text-sm">
                      <span className="font-medium">Resposta Teggly: </span>{f.resposta_master}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
