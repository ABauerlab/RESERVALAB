import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Check, Copy, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/$slug/obrigado")({
  head: () => ({
    meta: [
      { title: "Reserva enviada — ReservaLab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  component: Obrigado,
});

function Obrigado() {
  const { slug } = useParams({ from: "/$slug/obrigado" });
  const [codigo, setCodigo] = useState<string>("");

  useEffect(() => {
    try { setCodigo(sessionStorage.getItem("ultima-reserva-codigo") ?? ""); } catch { /* noop */ }
  }, []);

  function copiar() {
    if (!codigo) return;
    navigator.clipboard?.writeText(codigo).then(
      () => toast.success("Código copiado."),
      () => toast.error("Não foi possível copiar."),
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 safe-top safe-bottom">
      <div className="w-full max-w-md text-center animate-in-up">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
          <Check className="h-6 w-6" strokeWidth={2.25} />
        </div>

        <h1 className="mt-8 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
          Reserva enviada
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Nossa equipe irá analisar a disponibilidade e entrar em contato para confirmar sua reserva.
        </p>

        {codigo && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-left">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Código de acompanhamento
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="font-serif text-2xl tracking-wider text-foreground">{codigo}</p>
              <button onClick={copiar} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent">
                <Copy className="h-3.5 w-3.5" />
                Copiar
              </button>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
              Guarde este código para consultar ou alterar sua reserva a qualquer momento.
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/$slug/acompanhar" params={{ slug }} className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90">
            <Search className="h-3.5 w-3.5" />
            Acompanhar reserva
          </Link>
          <Link to="/$slug" params={{ slug }} className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-medium transition hover:bg-accent">
            Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  );
}
