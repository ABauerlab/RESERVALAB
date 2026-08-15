import { pwaHeadLinks } from "@/lib/pwa-manifest";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { useTenantAdmin } from "@/hooks/use-tenant-admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { clearTenantCache } from "@/lib/tenant";
import { DEFAULT_MENSAGEM_CONFIRMACAO, PLACEHOLDERS } from "@/lib/confirmacao";
import { TIPO_LABEL, type ReservaTipo } from "@/lib/reservations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/$slug/admin/configuracoes")({
  head: ({ params }) => ({
    meta: [
      { title: "Configurações — Reservi" },
      { name: "robots", content: "noindex" },
    ],
    links: pwaHeadLinks(`/${params.slug}/admin`, "Admin"),
  }),
  ssr: false,
  component: ConfiguracoesPage,
});

const TODOS_TIPOS: ReservaTipo[] = ["mesa", "aniversario", "evento", "casamento"];

function ConfiguracoesPage() {
  const { slug } = useParams({ from: "/$slug/admin/configuracoes" });
  const admin = useTenantAdmin(slug);
  const tenant = admin.tenant;
  const qc = useQueryClient();

  const [nome, setNome] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cor, setCor] = useState("#B4552D");
  const [tipos, setTipos] = useState<ReservaTipo[]>([]);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    if (!tenant) return;
    setNome(tenant.nome ?? "");
    setLogoUrl(tenant.logo_url ?? "");
    setEndereco(tenant.endereco ?? "");
    setTelefone(tenant.telefone_contato ?? "");
    setEmail(tenant.email_contato ?? "");
    setWhatsapp(tenant.whatsapp ?? "");
    setCor(tenant.cor_primaria ?? "#B4552D");
    setTipos((tenant.tipos_aceitos ?? []) as ReservaTipo[]);
    setMensagem(tenant.mensagem_confirmacao ?? DEFAULT_MENSAGEM_CONFIRMACAO);
  }, [tenant]);

  const salvar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("tenants")
        .update({
          nome: nome.trim(),
          logo_url: logoUrl.trim() || null,
          endereco: endereco.trim() || null,
          telefone_contato: telefone.trim() || null,
          email_contato: email.trim() || null,
          whatsapp: whatsapp.trim() || null,
          cor_primaria: cor,
          tipos_aceitos: tipos.length > 0 ? tipos : TODOS_TIPOS,
          mensagem_confirmacao: mensagem.trim() || DEFAULT_MENSAGEM_CONFIRMACAO,
        })
        .eq("id", tenant!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações salvas.");
      clearTenantCache(slug);
      qc.invalidateQueries({ queryKey: ["tenant", slug] });
    },
    onError: () => toast.error("Não foi possível salvar."),
  });

  function toggleTipo(t: ReservaTipo) {
    setTipos((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }

  if (!admin.ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AdminShell slug={slug} tenantNome={tenant?.nome ?? ""} active="configuracoes">
      <div className="mx-auto max-w-4xl px-5 pt-6">
        <header className="animate-fade">
          <h2 className="font-serif text-3xl tracking-tight">Configurações</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Estes dados aparecem para o cliente em <span className="font-mono text-foreground">/{slug}</span>.
          </p>
        </header>

        <section className="mt-6 space-y-5 animate-in-up">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-medium">Identidade</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[13px]">Nome do estabelecimento</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Cor principal</Label>
                <div className="flex items-center gap-3">
                  <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="h-11 w-14 cursor-pointer rounded-xl border border-border bg-card p-1" />
                  <Input value={cor} onChange={(e) => setCor(e.target.value)} className="h-11 flex-1 rounded-xl font-mono text-sm" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">URL do logo</Label>
              <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className="h-11 rounded-xl" />
              {logoUrl.trim() && (
                <img src={logoUrl} alt={`Logo ${nome}`} className="mt-2 h-14 w-auto rounded-lg object-contain" />
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-medium">Contato</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[13px]">Endereço</Label>
                <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Telefone</Label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">E-mail</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">WhatsApp</Label>
                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="h-11 rounded-xl" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-medium">Tipos de reserva aceitos</h3>
            <p className="mt-1 text-sm text-muted-foreground">Somente os selecionados aparecem para o cliente.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {TODOS_TIPOS.map((t) => {
                const on = tipos.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTipo(t)}
                    className={`h-9 rounded-full px-4 text-xs font-medium transition-all ${
                      on ? "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]" : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {TIPO_LABEL[t]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <h3 className="font-medium">Mensagem de confirmação (WhatsApp)</h3>
            <p className="text-sm text-muted-foreground">
              Texto enviado ao cliente ao confirmar a reserva. Sem emoji, apenas texto.
            </p>
            <Textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} className="min-h-56 rounded-xl font-mono text-[13px] leading-relaxed" />
            <div className="flex flex-wrap gap-1.5">
              {PLACEHOLDERS.map((p) => (
                <button
                  key={p.token}
                  type="button"
                  onClick={() => setMensagem((m) => `${m}${p.token}`)}
                  title={p.descricao}
                  className="rounded-md bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {p.token}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setMensagem(DEFAULT_MENSAGEM_CONFIRMACAO)}
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Restaurar mensagem padrão
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-medium">Segurança</h3>
            <p className="mt-1 text-sm text-muted-foreground">Altere a senha de acesso a este painel.</p>
            <Link
              to="/$slug/admin/trocar-senha"
              params={{ slug }}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium transition-colors hover:bg-accent"
            >
              <KeyRound className="h-4 w-4" /> Alterar senha
            </Link>
          </div>

          <Button onClick={() => salvar.mutate()} disabled={salvar.isPending || nome.trim().length < 2} className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
            {salvar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar configurações
          </Button>
        </section>
      </div>
    </AdminShell>
  );
}
