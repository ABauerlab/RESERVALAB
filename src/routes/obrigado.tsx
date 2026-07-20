import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

export const Route = createFileRoute("/obrigado")({
  head: () => ({
    meta: [
      { title: "Reserva enviada — Iracema" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Obrigado,
});

function Obrigado() {
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
        <p className="mt-6 font-serif text-lg italic text-terracotta">
          Obrigado por escolher o Iracema.
        </p>

        <Link
          to="/"
          className="mt-10 inline-flex h-12 items-center justify-center rounded-xl border border-border bg-background px-6 text-sm font-medium transition hover:bg-accent"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
