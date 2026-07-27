import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Loader2, LogOut, Plus, Power } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { criarTenant, listarTenants, toggleTenantAtivo } from "@/lib/master.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/master/")({
  head: () => ({
    meta: [
      { title: "Master — ReservaLab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  component: MasterPanel,
});

function MasterPanel() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [openNew, setOpenNew] = useState(false);
  const [aba, setAba] = useState<"empresas" | "sugestoes">("empresas");


  const listar = useServerFn(listarTenants);
  const criar = useServerFn(criarTenant);
  const toggle = useServerFn(toggleTenantAtivo);
  const qc = useQueryClient();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { navigate({ to: "/master/login" }); return; }
      const { data: isSuper } = await supabase.rpc("has_role", {
        _user_id: data.session.user.id, _role: "super_admin",
      });
      if (!isSuper) { await supabase.auth.signOut(); navigate({ to: "/master/login" }); return; }
      setReady(true);
    })();
  }, [navigate]);

  const tenantsQ = useQuery({
    enabled: ready,
    queryKey: ["master-tenants"],
    queryFn: async () => (await listar()).tenants,
  });

  const criarM = useMutation({
    mutationFn: async (input: Parameters<typeof criar>[0]) => criar(input),
    onSuccess: () => {
      toast.success("Empresa criada.");
      qc.invalidateQueries({ queryKey: ["master-tenants"] });
      setOpenNew(false);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao criar empresa."),
  });

  const toggleM = useMutation({
    mutationFn: async (v: { id: string; ativo: boolean }) => toggle({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["master-tenants"] }),
    onError: () => toast.error("Falha ao atualizar."),
  });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/master/login" });
  }

  if (!ready) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <main className="min-h-screen bg-background safe-top safe-bottom">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-terracotta">ReservaLab</p>
            <h1 className="truncate text-lg font-medium">Painel master</h1>
          </div>
          <button onClick={signOut} className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" aria-label="Sair">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 pt-6 pb-16">
        <div className="mb-6 flex gap-1.5">
          {(["empresas", "sugestoes"] as const).map((id) => (
            <button
              key={id}
              onClick={() => setAba(id)}
              className={`h-9 rounded-full px-4 text-xs font-medium transition-all ${
                aba === id ? "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]" : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {id === "empresas" ? "Empresas" : "Sugestões"}
            </button>
          ))}
        </div>

        {aba === "sugestoes" ? (
          <MasterFeedbacks />
        ) : (
        <>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-3xl tracking-tight">Empresas</h2>
            <p className="text-sm text-muted-foreground">{tenantsQ.data?.length ?? 0} cadastradas</p>
          </div>
          <Button onClick={() => setOpenNew(true)} className="h-11 rounded-xl bg-terracotta text-terracotta-foreground hover:bg-terracotta/90">
            <Plus className="mr-1.5 h-4 w-4" /> Nova empresa
          </Button>
        </div>



        <div className="mt-6 space-y-2.5">
          {tenantsQ.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (tenantsQ.data ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 py-14 text-center">
              <p className="font-serif text-2xl">Nenhuma empresa</p>
              <p className="mt-1 text-sm text-muted-foreground">Clique em "Nova empresa" para começar.</p>
            </div>
          ) : (
            (tenantsQ.data ?? []).map((t) => (
              <div key={t.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{t.nome}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      /{t.slug} · {t.email_contato ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-medium ${t.ativo ? "bg-success/15 text-[oklch(0.4_0.12_150)]" : "bg-muted text-muted-foreground"}`}>
                      {t.ativo ? "Ativa" : "Inativa"}
                    </span>
                    <Link to="/$slug" params={{ slug: t.slug }} className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-accent" target="_blank">
                      <ExternalLink className="h-3.5 w-3.5" /> Abrir
                    </Link>
                    <button
                      onClick={() => toggleM.mutate({ id: t.id, ativo: !t.ativo })}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-accent"
                    >
                      <Power className="h-3.5 w-3.5" /> {t.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        </>
        )}
      </div>


      <NovoTenantDialog
        open={openNew}
        onClose={() => setOpenNew(false)}
        onSubmit={(input) => criarM.mutate({ data: input })}
        pending={criarM.isPending}
      />
    </main>
  );
}

function NovoTenantDialog({ open, onClose, onSubmit, pending }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: {
    slug: string; nome: string; email_admin: string; senha_admin: string;
    endereco?: string; telefone_contato?: string; whatsapp?: string;
  }) => void;
  pending: boolean;
}) {
  const [slug, setSlug] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [wa, setWa] = useState("");

  useEffect(() => {
    if (!open) { setSlug(""); setNome(""); setEmail(""); setSenha(""); setEndereco(""); setTelefone(""); setWa(""); }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-normal">Nova empresa</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              slug, nome, email_admin: email, senha_admin: senha,
              endereco: endereco || undefined,
              telefone_contato: telefone || undefined,
              whatsapp: wa || undefined,
            });
          }}
          className="space-y-3.5"
        >
          <Field label="Slug (URL)"><Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="minha-empresa" required minLength={2} className="h-11 rounded-xl" /></Field>
          <Field label="Nome"><Input value={nome} onChange={(e) => setNome(e.target.value)} required minLength={2} className="h-11 rounded-xl" /></Field>
          <Field label="E-mail do admin"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 rounded-xl" /></Field>
          <Field label="Senha inicial"><Input type="text" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} className="h-11 rounded-xl" /></Field>
          <Field label="Endereço"><Input value={endereco} onChange={(e) => setEndereco(e.target.value)} className="h-11 rounded-xl" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefone"><Input value={telefone} onChange={(e) => setTelefone(e.target.value)} className="h-11 rounded-xl" /></Field>
            <Field label="WhatsApp"><Input value={wa} onChange={(e) => setWa(e.target.value)} className="h-11 rounded-xl" /></Field>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={pending} className="bg-terracotta text-terracotta-foreground hover:bg-terracotta/90">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-[12px] text-muted-foreground">{label}</Label>{children}</div>;
}

const FEEDBACK_STATUS = ["aberto", "em_analise", "planejado", "concluido", "recusado"] as const;
type FeedbackStatus = (typeof FEEDBACK_STATUS)[number];
const FEEDBACK_LABEL: Record<FeedbackStatus, string> = {
  aberto: "Aberto",
  em_analise: "Em análise",
  planejado: "Planejado",
  concluido: "Concluído",
  recusado: "Recusado",
};

/** Sugestões enviadas pelas empresas — visível apenas para o master. */
function MasterFeedbacks() {
  const qc = useQueryClient();
  const [respostas, setRespostas] = useState<Record<string, string>>({});

  const feedbacksQ = useQuery({
    queryKey: ["master-feedbacks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedbacks")
        .select("*, tenants(nome, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const atualizar = useMutation({
    mutationFn: async (v: { id: string; status?: FeedbackStatus; resposta_master?: string }) => {
      const { id, ...patch } = v;
      const { error } = await supabase.from("feedbacks").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sugestão atualizada.");
      qc.invalidateQueries({ queryKey: ["master-feedbacks"] });
    },
    onError: () => toast.error("Falha ao atualizar."),
  });

  return (
    <section>
      <h2 className="font-serif text-3xl tracking-tight">Sugestões das empresas</h2>
      <p className="text-sm text-muted-foreground">{feedbacksQ.data?.length ?? 0} recebidas</p>

      {feedbacksQ.isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (feedbacksQ.data ?? []).length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/50 py-14 text-center">
          <p className="font-serif text-2xl">Nenhuma sugestão</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {(feedbacksQ.data ?? []).map((f) => {
            const empresa = (f as unknown as { tenants?: { nome?: string } }).tenants?.nome ?? "—";
            return (
              <li key={f.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{f.titulo}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {empresa} · {new Date(f.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {FEEDBACK_STATUS.map((s) => (
                      <button
                        key={s}
                        onClick={() => atualizar.mutate({ id: f.id, status: s })}
                        className={`h-8 rounded-full px-3 text-[11px] font-medium transition-all ${
                          f.status === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {FEEDBACK_LABEL[s]}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{f.descricao}</p>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={respostas[f.id] ?? f.resposta_master ?? ""}
                    onChange={(e) => setRespostas((r) => ({ ...r, [f.id]: e.target.value }))}
                    placeholder="Resposta para a empresa (opcional)"
                    className="h-10 flex-1 rounded-xl"
                  />
                  <Button
                    onClick={() => atualizar.mutate({ id: f.id, resposta_master: respostas[f.id] ?? "" })}
                    className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Responder
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
