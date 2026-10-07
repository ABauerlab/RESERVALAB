import { useNavigate } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { MobileNavigation } from "./MobileNavigation";
import { Sidebar } from "./Sidebar";
import type { AdminTab } from "./nav-items";

/**
 * Casca do painel: Sidebar no desktop, barra inferior no mobile.
 * Sem hambúrguer. O conteúdo de cada página define o próprio container.
 */
export function AppShell({
  slug, tenantNome, active, children,
}: { slug: string; tenantNome: string; active: AdminTab; children: React.ReactNode }) {
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/$slug/admin/login", params: { slug } });
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar slug={slug} tenantNome={tenantNome} active={active} onSignOut={signOut} />

      <div className="lg:pl-[248px]">
        <header className="flex h-12 items-center gap-2.5 px-4 safe-top lg:hidden">
          <img src="/brand/Teggly_Symbol_Small_Blue.svg" alt="Teggly" width={27} height={24} className="h-6 w-auto shrink-0" />
          <p className="min-w-0 truncate text-sm font-semibold text-foreground">{tenantNome}</p>
        </header>

        <main className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-10">{children}</main>
      </div>

      <MobileNavigation slug={slug} active={active} onSignOut={signOut} />
    </div>
  );
}
