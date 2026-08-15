import { Link, useNavigate } from "@tanstack/react-router";
import { BarChart3, CalendarX2, LayoutList, Lightbulb, LogOut, Settings } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export type AdminTab = "reservas" | "agenda" | "relatorios" | "configuracoes" | "sugestoes";

const TABS: Array<{
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
}> = [
  { id: "reservas",      label: "Reservas",     icon: LayoutList, to: "/$slug/admin" },
  { id: "agenda",        label: "Agenda",       icon: CalendarX2, to: "/$slug/admin/agenda" },
  { id: "relatorios",    label: "Relatórios",   icon: BarChart3,  to: "/$slug/admin/relatorios" },
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
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-terracotta">
              Reservi · {tenantNome}
            </p>
            <h1 className="truncate text-lg font-medium">Painel da empresa</h1>
          </div>
          <button
            onClick={signOut}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
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
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
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
