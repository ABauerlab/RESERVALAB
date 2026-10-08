import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

/**
 * Botao do Link Hub com micro-interacoes leves:
 * efeito de pressao e entrada escalonada. Nada disso roda com "reduzir movimento" ligado.
 * O destino (href) e sempre o que o chamador passa, sem alteracao.
 */
export function HubBotao({
  href,
  externo = false,
  indice = 0,
  variante = "atalho",
  className,
  children,
}: {
  href: string;
  externo?: boolean;
  /** Posicao na pagina, so para escalonar a entrada. */
  indice?: number;
  variante?: "principal" | "evento" | "delivery" | "destaque" | "atalho";
  className?: string;
  children: ReactNode;
}) {
  const reduzido = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [pressionado, setPressionado] = useState(false);
  const [brilho, setBrilho] = useState(false);

  // Delivery e prioridade: um unico brilho passa de tempos em tempos (so com a aba visivel).
  useEffect(() => {
    if (variante !== "delivery" || reduzido) return;
    let fim: ReturnType<typeof setTimeout> | undefined;
    const passar = () => {
      if (document.visibilityState !== "visible") return;
      setBrilho(true);
      fim = setTimeout(() => setBrilho(false), 1100);
    };
    const inicio = setTimeout(passar, 1200 + indice * 150);
    const ciclo = setInterval(passar, 7000);
    return () => {
      clearTimeout(inicio);
      clearInterval(ciclo);
      if (fim) clearTimeout(fim);
    };
  }, [variante, reduzido, indice]);

  const base =
    "group relative isolate flex w-full select-none items-center overflow-hidden rounded-[12px] text-[15px] font-semibold " +
    "transition-[transform,box-shadow,background-color,border-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] " +
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 " +
    "motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0 motion-safe:active:scale-[0.985]";

  const estilo: Record<string, string> = {
    principal:
      "h-14 justify-center gap-2.5 border border-blue-700/60 bg-primary px-5 text-primary-foreground " +
      "shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6),inset_0_1px_0_rgba(255,255,255,0.22)] hover:bg-blue-700",
    evento:
      "min-h-14 gap-3 border border-blue-200 bg-accent px-2.5 py-1.5 text-foreground " +
      "shadow-[0_6px_16px_-8px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-blue-300",
    delivery:
      "min-h-14 gap-3 border border-primary/45 bg-card px-3 text-foreground " +
      "shadow-[0_8px_18px_-8px_rgba(37,99,235,0.45),inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-primary/70",
    destaque:
      "min-h-12 gap-3 border border-slate-300 bg-card px-3 text-foreground shadow-sm hover:border-slate-400",
    atalho:
      "min-h-12 justify-center gap-2 border border-border bg-card px-2 text-sm text-foreground " +
      "shadow-xs hover:border-slate-300 hover:shadow-sm min-[360px]:gap-2.5 min-[360px]:px-3 min-[360px]:text-[15px]",
  };

  const atraso: CSSProperties = { animationDelay: `${Math.min(indice, 8) * 45}ms` };

  return (
    <a
      href={href}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onPointerDown={() => setPressionado(true)}
      onPointerUp={() => setPressionado(false)}
      onPointerLeave={() => setPressionado(false)}
      onPointerCancel={() => setPressionado(false)}
      data-pressionado={pressionado || undefined}
      style={atraso}
      className={cn(base, "motion-safe:animate-in-up", estilo[variante], className)}
    >
      {/* Brilho unico do delivery. */}
      {variante === "delivery" && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 -left-1/3 -z-10 w-1/3 -skew-x-12 bg-blue-400/20 opacity-0 blur-sm",
            brilho && "motion-safe:animate-[hub-brilho_1.1s_ease-out_both]",
          )}
        />
      )}
      {children}
    </a>
  );
}
