import { useRef } from "react";
import { CalendarDays } from "lucide-react";

import { formatData } from "@/lib/reservations";
import { cn } from "@/lib/utils";

/**
 * Escolha de um dia especifico. Usa o seletor de data do proprio aparelho (teclado, leitor de tela
 * e calendario nativo no celular), com um botao claro por cima: mostra o dia escolhido e abre o
 * calendario ao toque. `value` e `onChange` usam ISO (yyyy-mm-dd).
 */
export function DateField({
  value,
  onChange,
  label = "Escolher um dia",
  placeholder = "Escolher dia",
  active,
  className,
}: {
  value: string | null;
  onChange: (iso: string) => void;
  label?: string;
  placeholder?: string;
  active?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  function abrir() {
    const el = ref.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
      el.click();
    }
  }
  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onClick={abrir}
        aria-hidden="true"
        tabIndex={-1}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-md border px-3.5 text-[13px] font-semibold transition-colors xl:h-9",
          active || value
            ? "border-primary/40 bg-accent text-accent-foreground"
            : "border-border bg-card text-foreground hover:bg-muted",
        )}
      >
        <CalendarDays className="h-4 w-4" aria-hidden="true" />
        {value ? formatData(value) : placeholder}
      </button>
      <input
        ref={ref}
        type="date"
        aria-label={label}
        value={value ?? ""}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        onClick={(e) => {
          try {
            e.currentTarget.showPicker();
          } catch {
            /* o clique nativo ja abre o seletor */
          }
        }}
      />
    </span>
  );
}
