import { useEffect } from "react";
import { ArrowLeft, X } from "lucide-react";

import { useIsDesktop } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

/** Largura do painel no desktop; as páginas reservam esse espaço à direita. */
export const SIDE_PANEL_WIDTH = 420;

/**
 * Detalhe sem modal. Desktop: painel fixo de 420px à direita (a lista continua
 * visível e utilizável). Mobile: tela cheia, com a ação principal na zona do polegar.
 */
export function SidePanel({
  open, onClose, title, subtitle, footer, children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Barra de ações fixa na base (zona do polegar no mobile). */
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const desktop = useIsDesktop();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || desktop) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open, desktop]);

  if (!open) return null;

  return (
    <aside
      role="complementary"
      aria-label="Detalhe da reserva"
      className={cn(
        "fixed z-40 flex flex-col bg-card",
        desktop
          ? "inset-y-0 right-0 border-l border-border shadow-lg"
          : "inset-0 animate-in-up",
      )}
      style={desktop ? { width: SIDE_PANEL_WIDTH } : undefined}
    >
      <header className="flex items-start gap-2 border-b border-border px-4 py-4 safe-top lg:px-5">
        {!desktop && (
          <button type="button" onClick={onClose} aria-label="Voltar" className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="truncate text-xl font-extrabold tracking-tight text-foreground">{title}</h2>
          {subtitle && <div className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</div>}
        </div>
        {desktop && (
          <button type="button" onClick={onClose} aria-label="Fechar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 lg:px-5">{children}</div>

      {footer && (
        <footer className="border-t border-border bg-card px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 lg:px-5">
          {footer}
        </footer>
      )}
    </aside>
  );
}
