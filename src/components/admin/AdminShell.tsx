import { Link, useNavigate } from "@tanstack/react-router";
import { BarChart3, CalendarX2, LayoutList, Lightbulb, LogOut, Music, Settings, Users } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export type AdminTab = "reservas" | "agenda" | "eventos" | "relatorios" | "contatos" | "configuracoes" | "sugestoes";

const TABS: Array<{
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
}> = [
  { id: "reservas",      label: "Reservas",     icon: LayoutList, to: "/$slug/admin" },
  { id: "agenda",        label: "Agenda",       icon: CalendarX2, to: "/$slug/admin/agenda" },
  { id: "eventos",       label: "Eventos",      icon: Music,      to: "/$slug/admin/eventos" },
  { id: "relatorios",    label: "Relatórios",   icon: BarChart3,  to: "/$slug/admin/relatorios" },
  { id: "contatos",      label: "Contatos",     icon: Users,      to: "/$slug/admin/contatos" },
  { id: "configuracoes", label: "Configurações",icon: Settings,   to: "/$slug/admin/configuracoes" },
  { id: "sugestoes",     label: "Sugestões",    icon: Lightbulb,  to: "/$slug/admin/sugestoes" },
];

export function AdminShell({
  slug, tenantNome, active, children,
}: {
  slug: string;
  tenantNome: string;
  active: AdminTab;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/$slug/admin/login", params: { slug } });
  }

  return (
    <main className="min-h-screen bg-background pb-16 safe-top safe-bottom">
      <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src="/brand/Teggly_Logo_Primary.svg"
                alt="Teggly"
                width={101}
                height={24}
                className="h-6 w-auto shrink-0"
              />
              <span className="h-5 w-px shrink-0 bg-border" aria-hidden="true" />
              <p className="truncate text-sm font-semibold text-foreground">{tenantNome}</p>
            </div>
            <h1 className="mt-1 truncate text-lg font-semibold">Painel da empresa</h1>
          </div>
          <button
            onClick={signOut}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Sair"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        <nav className="mx-auto max-w-4xl overflow-x-auto px-5 pb-2 scrollbar-none">
          <div className="flex gap-1.5">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = t.id === active;
              return (
                <Link
                  key={t.id}
                  to={t.to}
                  params={{ slug }}
                  className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3.5 text-sm transition-colors ${
                    isActive
                      ? "bg-accent font-semibold text-accent-foreground"
                      : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {children}
    </main>
  );
}
