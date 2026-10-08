import { Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { Drop } from "./Drop";
import { SIDEBAR_FOOTER, SIDEBAR_GROUPS, type AdminTab, type NavItem } from "./nav-items";
import { TegglyLogo } from "@/components/brand/TegglyLogo";

function SidebarLink({
  item,
  slug,
  active,
  rail,
}: {
  item: NavItem;
  slug: string;
  active: boolean;
  rail: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      params={{ slug }}
      data-tour={`nav-${item.id}`}
      aria-current={active ? "page" : undefined}
      aria-label={rail ? item.label : undefined}
      title={rail ? item.label : undefined}
      className={cn(
        "group relative flex rounded-md text-sm transition-colors",
        rail
          ? "min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px]"
          : "h-11 items-center gap-3 px-3",
        active
          ? "bg-accent font-semibold text-accent-foreground"
          : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {rail ? (
        <span className="max-w-full truncate leading-tight">{item.label}</span>
      ) : (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {active && <Drop />}
        </>
      )}
    </Link>
  );
}

/**
 * Navegação para tablet e desktop. `full`: 248px com logo e empresa. `rail`: 76px só com
 * ícones e rótulo curto (tablet), para não roubar largura do conteúdo.
 */
export function Sidebar({
  slug,
  tenantNome,
  active,
  onSignOut,
  variant = "full",
}: {
  slug: string;
  tenantNome: string;
  active: AdminTab;
  onSignOut: () => void;
  variant?: "full" | "rail";
}) {
  const rail = variant === "rail";
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-card",
        rail ? "w-[88px]" : "w-[248px]",
      )}
    >
      {rail ? (
        <div className="flex h-16 items-center justify-center">
          <TegglyLogo
            arquivo="Teggly_Symbol_Small_Blue.svg"
            width={30}
            height={27}
            className="h-7 w-auto"
          />
        </div>
      ) : (
        <div className="px-5 pb-4 pt-6">
          <TegglyLogo width={101} height={24} className="h-6 w-auto" />
          <p className="mt-4 truncate text-sm font-semibold text-foreground">{tenantNome}</p>
          <p className="text-xs text-muted-foreground">Painel da empresa</p>
        </div>
      )}

      <nav
        aria-label="Principal"
        className={cn("flex-1 overflow-y-auto py-2", rail ? "px-2" : "px-3")}
      >
        {SIDEBAR_GROUPS.map((group, i) => (
          <div key={i} className={cn("space-y-0.5", i > 0 && "mt-3 border-t border-border pt-3")}>
            {group.map((item) => (
              <SidebarLink
                key={item.id}
                item={item}
                slug={slug}
                active={item.id === active}
                rail={rail}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className={cn("space-y-0.5 border-t border-border py-3", rail ? "px-2" : "px-3")}>
        {SIDEBAR_FOOTER.map((item) => (
          <SidebarLink
            key={item.id}
            item={item}
            slug={slug}
            active={item.id === active}
            rail={rail}
          />
        ))}
        <button
          onClick={onSignOut}
          aria-label="Sair"
          className={cn(
            "flex w-full rounded-md font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            rail
              ? "min-h-14 flex-col items-center justify-center gap-0.5 text-[11px]"
              : "h-11 items-center gap-3 px-3 text-sm",
          )}
        >
          <LogOut className="h-5 w-5" /> Sair
        </button>
      </div>
    </aside>
  );
}
