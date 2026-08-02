import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/master/login")({
  head: () => ({
    meta: [
      { title: "Master — ReservaLab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  component: MasterLogin,
});

function MasterLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("contato.bauerlab@gmail.com");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const { data: isSuper } = await supabase.rpc("has_role", {
          _user_id: data.session.user.id, _role: "super_admin",
        });
        if (isSuper) navigate({ to: "/master" });
      }
    })();
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const { data: signIn, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error || !signIn.session) {
      setLoading(false);
      toast.error("E-mail ou senha inválidos.");
      return;
    }
    const { data: isSuper } = await supabase.rpc("has_role", {
      _user_id: signIn.session.user.id, _role: "super_admin",
    });
    setLoading(false);
    if (!isSuper) {
      await supabase.auth.signOut();
      toast.error("Este acesso não é master.");
      return;
    }
    navigate({ to: "/master" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 safe-top safe-bottom">
      <div className="w-full max-w-sm animate-in-up">
        <Link to="/" className="mb-10 block text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-terracotta">ReservaLab</p>
          <p className="mt-1 text-xs text-muted-foreground">Painel master</p>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-md)]">
          <h1 className="font-serif text-3xl tracking-tight">Master</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesso restrito ao administrador da plataforma.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[13px]">E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Senha</Label>
              <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} className="h-12 rounded-xl" />
            </div>

            <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
