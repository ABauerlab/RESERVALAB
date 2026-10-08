import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

/**
 * Botao do Link Hub com micro-interacoes leves: brilho que acompanha o ponteiro (so em mouse),
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
  const ref = useRef<HTMLAnchorElement>(null);
  const quadro = useRef(0);
  const [pressionado, setPressionado] = useState(false);
  const [brilho, setBrilho] = useState(false);

  useEffect(() => () => cancelAnimationFrame(quadro.current), []);

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

  function seguir(e: React.PointerEvent<HTMLAnchorElement>) {
    if (reduzido || e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(quadro.current);
    quadro.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${clientX - r.left}px`);
      el.style.setProperty("--my", `${clientY - r.top}px`);
    });
  }

  const base =
    "group relative isolate flex w-full select-none items-center overflow-hidden rounded-[12px] text-[15px] font-semibold " +
    "transition-[transform,box-shadow,background-color,border-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] " +
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 " +
    "motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0 motion-safe:active:scale-[0.985]";

  const estilo: Record<string, string> = {
    principal:
      "h-14 justify-center gap-2.5 border border-blue-700/60 bg-gradient-to-b from-blue-500 to-blue-600 px-5 text-primary-foreground " +
      "shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6),inset_0_1px_0_rgba(255,255,255,0.22)] hover:from-blue-500 hover:to-blue-700",
    evento:
      "min-h-14 gap-3 border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50 px-2.5 py-1.5 text-foreground " +
      "shadow-[0_6px_16px_-8px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-blue-300",
    delivery:
      "min-h-14 gap-3 border border-primary/45 bg-gradient-to-b from-white to-blue-50 px-3 text-foreground " +
      "shadow-[0_8px_18px_-8px_rgba(37,99,235,0.45),inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-primary/70",
    destaque:
      "min-h-12 gap-3 border border-slate-300 bg-gradient-to-b from-white to-slate-50 px-3 text-foreground shadow-sm hover:border-slate-400",
    atalho:
      "min-h-12 justify-center gap-2 border border-border bg-gradient-to-b from-white to-slate-50/80 px-2 text-sm text-foreground " +
      "shadow-xs hover:border-slate-300 hover:shadow-sm min-[360px]:gap-2.5 min-[360px]:px-3 min-[360px]:text-[15px]",
  };

  const atraso: CSSProperties = { animationDelay: `${Math.min(indice, 8) * 45}ms` };

  return (
    <a
      ref={ref}
      href={href}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onPointerMove={seguir}
      onPointerDown={() => setPressionado(true)}
      onPointerUp={() => setPressionado(false)}
      onPointerLeave={() => setPressionado(false)}
      onPointerCancel={() => setPressionado(false)}
      data-pressionado={pressionado || undefined}
      style={atraso}
      className={cn(base, "motion-safe:animate-in-up", estilo[variante], className)}
    >
      {/* Brilho que acompanha o mouse. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(120px circle at var(--mx, 50%) var(--my, 50%), rgba(59,130,246,0.14), transparent 70%)",
        }}
      />
      {/* Brilho unico do delivery. */}
      {variante === "delivery" && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 -left-1/3 -z-10 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-blue-400/25 to-transparent opacity-0",
            brilho && "motion-safe:animate-[hub-brilho_1.1s_ease-out_both]",
          )}
        />
      )}
      {children}
    </a>
  );
}
