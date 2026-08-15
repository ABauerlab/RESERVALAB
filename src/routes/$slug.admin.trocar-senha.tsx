import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/$slug/admin/trocar-senha")({
  head: () => ({
    meta: [
      { title: "Trocar senha — ReservaLab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  component: TrocarSenha,
});

function TrocarSenha() {
  const { slug } = useParams({ from: "/$slug/admin/trocar-senha" });
  const navigate = useNavigate();
  const [checando, setChecando] = useState(true);
  const [obrigatorio, setObrigatorio] = useState(false);
  const [nova, setNova] = useState("");
  const [confirma, setConfirma] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { navigate({ to: "/$slug/admin/login", params: { slug } }); return; }
      setObrigatorio(data.session.user.user_metadata?.must_change_password === true);
      setChecando(false);
    })();
  }, [navigate, slug]);

  const forte = nova.length >= 8 && /[A-Za-z]/.test(nova) && /\d/.test(nova);
  const podeSalvar = nova.length >= 6 && nova === confirma && !salvando;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!podeSalvar) return;
    setSalvando(true);
    const { error } = await supabase.auth.updateUser({
      password: nova,
      data: { must_change_password: false },
    });
    setSalvando(false);
    if (error) { toast.error(error.message || "Não foi possível alterar a senha."); return; }
    toast.success("Senha alterada com sucesso.");
    navigate({ to: "/$slug/admin", params: { slug } });
  }

  if (checando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 safe-top safe-bottom">
      <div className="w-full max-w-sm animate-in-up">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-terracotta">ReservaLab</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-md)]">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cream text-terracotta">
            <KeyRound className="h-5 w-5" />
          </div>
          <h1 className="font-serif text-3xl tracking-tight">
            {obrigatorio ? "Defina sua senha" : "Alterar senha"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {obrigatorio
              ? "Este é o seu primeiro acesso. Escolha uma senha própria para continuar."
              : "Escolha uma nova senha para o seu acesso."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[13px]">Nova senha</Label>
              <Input type="password" value={nova} onChange={(e) => setNova(e.target.value)} autoComplete="new-password" required minLength={6} className="h-12 rounded-xl" />
              <p className={`text-[11px] ${forte ? "text-muted-foreground" : "text-muted-foreground"}`}>
                Mínimo de 6 caracteres. Recomendado: 8+, com letras e números.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Confirmar nova senha</Label>
              <Input type="password" value={confirma} onChange={(e) => setConfirma(e.target.value)} autoComplete="new-password" required minLength={6} className="h-12 rounded-xl" />
              {confirma.length > 0 && confirma !== nova && (
                <p className="text-[11px] text-destructive">As senhas não conferem.</p>
              )}
            </div>

            <Button type="submit" disabled={!podeSalvar} className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar nova senha"}
            </Button>
          </form>

          {!obrigatorio && (
            <button
              onClick={() => navigate({ to: "/$slug/admin", params: { slug } })}
              className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Voltar ao painel
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
