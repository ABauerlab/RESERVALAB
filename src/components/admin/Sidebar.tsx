import { Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { Drop } from "./Drop";
import { SIDEBAR_FOOTER, SIDEBAR_GROUPS, type AdminTab, type NavItem } from "./nav-items";

function SidebarLink({ item, slug, active }: { item: NavItem; slug: string; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      params={{ slug }}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors",
        active ? "bg-accent font-semibold text-accent-foreground" : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {active && <Drop />}
    </Link>
  );
}

/** Navegação desktop (>= lg): logo, empresa, destinos e sair. 248px fixa. */
export function Sidebar({
  slug, tenantNome, active, onSignOut,
}: { slug: string; tenantNome: string; active: AdminTab; onSignOut: () => void }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-border bg-card lg:flex">
      <div className="px-5 pb-4 pt-6">
        <img src="/brand/Teggly_Logo_Primary.svg" alt="Teggly" width={101} height={24} className="h-6 w-auto" />
        <p className="mt-4 truncate text-sm font-semibold text-foreground">{tenantNome}</p>
        <p className="text-xs text-muted-foreground">Painel da empresa</p>
      </div>

      <nav aria-label="Principal" className="flex-1 overflow-y-auto px-3 py-2">
        {SIDEBAR_GROUPS.map((group, i) => (
          <div key={i} className={cn("space-y-0.5", i > 0 && "mt-4 border-t border-border pt-4")}>
            {group.map((item) => (
              <SidebarLink key={item.id} item={item} slug={slug} active={item.id === active} />
            ))}
          </div>
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-border px-3 py-3">
        {SIDEBAR_FOOTER.map((item) => (
          <SidebarLink key={item.id} item={item} slug={slug} active={item.id === active} />
        ))}
        <button
          onClick={onSignOut}
          className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </aside>
  );
}
