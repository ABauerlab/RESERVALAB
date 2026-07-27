import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ChevronLeft, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Normaliza o código: maiúsculas, sem espaços, com o prefixo RL-. */
export function normalizeCodigo(v: string): string {
  let s = v.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9-]/g, "");
  s = s.replace(/^RL-?/, "");
  return s.length > 0 ? `RL-${s}` : "";
}

export const Route = createFileRoute("/$slug/acompanhar/")({
  head: () => ({
    meta: [
      { title: "Acompanhar reserva — ReservaLab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    codigo: typeof search.codigo === "string" ? search.codigo : undefined,
  }),
  component: AcompanharPage,
});

function AcompanharPage() {
  const { slug } = useParams({ from: "/$slug/acompanhar/" });
  const { codigo: codigoQuery } = Route.useSearch();
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");

  // Se o link já trouxer ?codigo=..., abre a reserva direto, sem pedir de novo.
  useEffect(() => {
    if (!codigoQuery) return;
    const cod = normalizeCodigo(codigoQuery);
    if (cod.length >= 5) {
      navigate({ to: "/$slug/acompanhar/$codigo", params: { slug, codigo: cod }, replace: true });
    }
  }, [codigoQuery, navigate, slug]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-5 pt-6 pb-24 safe-top safe-bottom">
        <Link to="/$slug" params={{ slug }} className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Link>

        <header className="mt-6 animate-fade">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-terracotta">Acompanhar</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight">Sua reserva</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Informe o código recebido após enviar a solicitação.
          </p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const cod = normalizeCodigo(codigo);
            if (cod.length < 5) return;
            navigate({ to: "/$slug/acompanhar/$codigo", params: { slug, codigo: cod } });
          }}
          className="mt-8 space-y-5 animate-in-up"
        >
          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-foreground">Código</Label>
            <Input value={codigo} onChange={(e) => setCodigo(normalizeCodigo(e.target.value))} placeholder="RL-XXXXXX" autoCapitalize="characters" autoComplete="off" className="h-12 rounded-xl font-mono tracking-wider" required />
          </div>

          <Button type="submit" className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
            <Search className="mr-2 h-4 w-4" /> Consultar
          </Button>
        </form>
      </div>
    </main>
  );
}
