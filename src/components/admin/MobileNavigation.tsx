import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LogOut, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { BottomSheet } from "./BottomSheet";
import { Drop } from "./Drop";
import { BOTTOM_ITEMS, MORE_ITEMS, type AdminTab } from "./nav-items";

/** Esconde a barra enquanto um campo de texto está em foco (teclado aberto). */
function useKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const isField = (el: EventTarget | null) =>
      el instanceof HTMLElement &&
      el.matches("input:not([type=checkbox]):not([type=radio]), textarea, [contenteditable=true]");
    const on = (e: FocusEvent) => {
      if (isField(e.target)) setOpen(true);
    };
    const off = () => setOpen(false);
    document.addEventListener("focusin", on);
    document.addEventListener("focusout", off);
    return () => {
      document.removeEventListener("focusin", on);
      document.removeEventListener("focusout", off);
    };
  }, []);
  return open;
}

/** Barra inferior mobile: Hoje · Reservas · Agenda · Mais. 56px + área segura. */
export function MobileNavigation({
  slug,
  active,
  onSignOut,
}: {
  slug: string;
  active: AdminTab;
  onSignOut: () => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const keyboard = useKeyboardOpen();
  const moreActive = MORE_ITEMS.some((i) => i.id === active);

  const itemCls = (on: boolean) =>
    cn(
      "relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors",
      on ? "text-primary" : "text-muted-foreground",
    );

  return (
    <>
      <nav
        aria-label="Principal"
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]",
          keyboard && "hidden",
        )}
      >
        <div className="mx-auto flex max-w-md">
          {BOTTOM_ITEMS.map((item) => {
            const Icon = item.icon;
            const on = item.id === active;
            return (
              <Link
                key={item.id}
                to={item.to}
                params={{ slug }}
                data-tour={`nav-${item.id}`}
                aria-current={on ? "page" : undefined}
                className={itemCls(on)}
              >
                {on && <Drop className="absolute top-1" />}
                <Icon className={cn("h-5 w-5", on && "mt-1.5")} />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={itemCls(moreActive)}
            aria-haspopup="dialog"
          >
            {moreActive && <Drop className="absolute top-1" />}
            <MoreHorizontal className={cn("h-5 w-5", moreActive && "mt-1.5")} />
            Mais
          </button>
        </div>
      </nav>

      <BottomSheet open={moreOpen} onOpenChange={setMoreOpen} title="Mais">
        <ul className="space-y-1 pb-2">
          {MORE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Link
                  to={item.to}
                  params={{ slug }}
                  onClick={() => setMoreOpen(false)}
                  className="flex h-12 items-center gap-3 rounded-md px-3 text-[15px] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={onSignOut}
              className="flex h-12 w-full items-center gap-3 rounded-md px-3 text-[15px] font-medium text-foreground transition-colors hover:bg-muted"
            >
              <LogOut className="h-5 w-5 text-muted-foreground" /> Sair
            </button>
          </li>
        </ul>
      </BottomSheet>
    </>
  );
}
