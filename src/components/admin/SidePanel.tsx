import { useEffect, useRef } from "react";
import { ArrowLeft, X } from "lucide-react";

import { useDetailMode } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

/** Largura do painel acoplado (>= 1280); as páginas reservam esse espaço à direita. */
export const SIDE_PANEL_WIDTH = 420;

/**
 * Detalhe sem modal tradicional.
 * - >= 1280: acoplado à direita (a lista continua visível e utilizável).
 * - 768 a 1279 (tablet/notebook): painel sobreposto de 420px com fundo esmaecido.
 * - < 768 ou paisagem baixa (mobile): tela cheia, ação principal na zona do polegar.
 */
export function SidePanel({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Barra de ações fixa na base (zona do polegar no mobile). */
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const mode = useDetailMode();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Tela cheia e sobreposto travam o scroll da página atrás.
  useEffect(() => {
    if (!open || mode === "dock") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, mode]);

  useEffect(() => {
    if (open && mode !== "dock") ref.current?.focus();
  }, [open, mode]);

  if (!open) return null;

  return (
    <>
      {mode === "overlay" && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 animate-fade"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        ref={ref}
        tabIndex={-1}
        role={mode === "dock" ? "complementary" : "dialog"}
        aria-modal={mode === "dock" ? undefined : true}
        aria-label="Detalhe da reserva"
        className={cn(
          "fixed flex flex-col bg-card outline-none",
          mode === "dock" && "inset-y-0 right-0 z-40 border-l border-border shadow-lg",
          mode === "overlay" &&
            "inset-y-0 right-0 z-50 w-[min(420px,100vw)] border-l border-border shadow-lg",
          mode === "full" && "inset-0 z-50 animate-in-up",
        )}
        style={mode === "dock" ? { width: SIDE_PANEL_WIDTH } : undefined}
      >
        <header className="flex items-start gap-2 border-b border-border px-4 py-4 safe-top md:px-5">
          {mode === "full" && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Voltar"
              className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="line-clamp-2 break-words text-xl font-extrabold tracking-tight text-foreground">
              {title}
            </h2>
            {subtitle && (
              <div className="mt-0.5 break-all text-[13px] text-muted-foreground">{subtitle}</div>
            )}
          </div>
          {mode !== "full" && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 md:px-5">
          {children}
        </div>

        {footer && (
          <footer className="border-t border-border bg-card px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:px-5">
            {footer}
          </footer>
        )}
      </aside>
    </>
  );
}
