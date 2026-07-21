import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin — ReservaLab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [manter, setManter] = useState(true);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      setLoading(false);
      if (error) {
        toast.error("E-mail ou senha inválidos.");
        return;
      }
      void manter;
      navigate({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Conta criada. Você já pode entrar.");
      setMode("login");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 safe-top safe-bottom">
      <div className="w-full max-w-sm animate-in-up">
        <Link to="/" className="mb-10 block text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-terracotta">
            ReservaLab
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Painel administrativo</p>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-md)]">
          <h1 className="font-serif text-3xl tracking-tight">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Acesse o painel de reservas." : "Configure o acesso do admin."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[13px]">E-mail</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
                autoComplete="email"
                required
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Senha</Label>
              <Input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={6}
                className="h-12 rounded-xl"
              />
            </div>

            {mode === "login" && (
              <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Checkbox
                  checked={manter}
                  onCheckedChange={(v) => setManter(v === true)}
                />
                Manter conectado neste dispositivo
              </label>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
            className="mt-5 w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {mode === "login" ? "Primeiro acesso? Criar conta" : "Já tem conta? Entrar"}
          </button>
        </div>
      </div>
    </main>
  );
}
