import { useNavigate } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { useShellMode } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { MobileNavigation } from "./MobileNavigation";
import { Sidebar } from "./Sidebar";
import type { AdminTab } from "./nav-items";

/**
 * Casca do painel: barra inferior no mobile, trilho de ícones no tablet e Sidebar completa
 * no desktop. Sem hambúrguer. O conteúdo de cada página define o próprio container.
 */
export function AppShell({
  slug,
  tenantNome,
  active,
  children,
}: {
  slug: string;
  tenantNome: string;
  active: AdminTab;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const mode = useShellMode();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/$slug/admin/login", params: { slug } });
  }

  return (
    <div className="min-h-screen bg-background">
      {mode !== "bottom" && (
        <Sidebar
          slug={slug}
          tenantNome={tenantNome}
          active={active}
          onSignOut={signOut}
          variant={mode === "rail" ? "rail" : "full"}
        />
      )}

      <div className={cn(mode === "rail" && "pl-[88px]", mode === "full" && "pl-[248px]")}>
        {mode === "bottom" && (
          <header className="flex h-12 items-center gap-2.5 px-4 safe-top">
            <img
              src="/brand/Teggly_Symbol_Small_Blue.svg"
              alt="Teggly"
              width={27}
              height={24}
              className="h-6 w-auto shrink-0"
            />
            <p className="min-w-0 truncate text-sm font-semibold text-foreground">{tenantNome}</p>
          </header>
        )}

        <main
          className={mode === "bottom" ? "pb-[calc(4.5rem+env(safe-area-inset-bottom))]" : "pb-10"}
        >
          {children}
        </main>
      </div>

      {mode === "bottom" && <MobileNavigation slug={slug} active={active} onSignOut={signOut} />}
    </div>
  );
}
