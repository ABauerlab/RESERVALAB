import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/acompanhar")({
  head: () => ({
    meta: [
      { title: "Acompanhar reserva — ReservaLab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AcompanharPage,
});

function AcompanharPage() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");

  function normalize(v: string) {
    return v.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9-]/g, "");
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-5 pt-6 pb-24 safe-top safe-bottom">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Link>

        <header className="mt-6 animate-fade">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-terracotta">
            Acompanhar
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight">
            Sua reserva
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Informe o código recebido após enviar a solicitação.
          </p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const cod = normalize(codigo);
            if (cod.length < 4) return;
            navigate({ to: "/acompanhar/$codigo", params: { codigo: cod } });
          }}
          className="mt-8 space-y-5 animate-in-up"
        >
          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-foreground">Código</Label>
            <Input
              value={codigo}
              onChange={(e) => setCodigo(normalize(e.target.value))}
              placeholder="RL-XXXXXX"
              autoCapitalize="characters"
              autoComplete="off"
              className="h-12 rounded-xl font-mono tracking-wider"
              required
            />
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Search className="mr-2 h-4 w-4" />
            Consultar
          </Button>
        </form>
      </div>
    </main>
  );
}
