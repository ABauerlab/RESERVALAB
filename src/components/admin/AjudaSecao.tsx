import { PlayCircle } from "lucide-react";
import { toast } from "sonner";

import { EVENTO_REINICIAR } from "@/lib/onboarding";
import { EMAIL_CONTATO } from "@/lib/site";

/** Ajuda: refazer o passo a passo e falar com o time. */
export function AjudaSecao() {
  return (
    <div className="space-y-4 border-t border-border/60 pt-5 first:border-t-0 first:pt-0">
      <div>
        <h3 className="font-semibold">Passo a passo do painel</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Um tour curto por Hoje, Reservas, Agenda, Clientes, Cardápio, Link Hub e Ajustes.
        </p>
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new Event(EVENTO_REINICIAR));
            toast.success("Passo a passo aberto.");
          }}
          className="mt-3 inline-flex h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-accent"
        >
          <PlayCircle className="h-4 w-4" aria-hidden="true" /> Refazer onboarding
        </button>
      </div>
      <div>
        <h3 className="font-semibold">Falar com a gente</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Dúvida ou algo que não deu certo? Escreva para{" "}
          <a
            className="font-medium text-primary underline-offset-2 hover:underline"
            href={`mailto:${EMAIL_CONTATO}`}
          >
            {EMAIL_CONTATO}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
