import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, Bell, Sparkles, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ReservaLab — Sistema de reservas para restaurantes e eventos" },
      { name: "description", content: "SaaS multi-tenant de reservas: formulário público, painel admin em tempo real e notificações push. Cada empresa no seu próprio /nome." },
      { property: "og:title", content: "ReservaLab — Reservas simples para o seu estabelecimento" },
      { property: "og:description", content: "Substitua o WhatsApp por um sistema completo de reservas. Rápido, moderno e sem esperas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 pt-16 pb-24 safe-top safe-bottom sm:pt-24">
        <header className="animate-fade">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-terracotta">
            ReservaLab
          </p>
          <h1 className="mt-6 font-serif text-5xl leading-[1.02] tracking-tight text-foreground sm:text-7xl">
            Reservas simples,<br />gestão sem WhatsApp.
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-lg">
            Plataforma multi-empresa para restaurantes, eventos e casamentos. Cada estabelecimento no seu próprio endereço, com formulário público, painel em tempo real e notificações push.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="mailto:contato.bauerlab@gmail.com?subject=Quero%20o%20ReservaLab"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-terracotta px-6 text-sm font-medium text-terracotta-foreground transition hover:bg-terracotta/90"
            >
              Solicitar acesso
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              to="/master/login"
              className="inline-flex h-12 items-center rounded-xl border border-border bg-card px-6 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              Sou admin
            </Link>
          </div>
        </header>

        <section className="mt-20 grid gap-3 sm:grid-cols-2">
          {[
            { icon: CalendarCheck, titulo: "Formulário público", desc: "Sua empresa em reserva.bauerlab.com.br/nomedaempresa" },
            { icon: Bell,          titulo: "Push em tempo real", desc: "Notificação instantânea a cada nova reserva" },
            { icon: Sparkles,      titulo: "Multi-tipo",         desc: "Mesa, aniversário, evento, casamento — você escolhe" },
            { icon: Users,         titulo: "WhatsApp integrado", desc: "Confirmação com mensagem personalizada em 1 clique" },
          ].map((f, i) => (
            <div
              key={f.titulo}
              className="rounded-2xl border border-border bg-card p-5 animate-in-up"
              style={{ animationDelay: `${80 + i * 50}ms` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-terracotta">
                <f.icon className="h-4 w-4" />
              </div>
              <p className="mt-4 font-medium">{f.titulo}</p>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>

        <footer className="mt-24 text-center">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/60">
            ReservaLab · bauerlab
          </p>
        </footer>
      </div>
    </main>
  );
}
