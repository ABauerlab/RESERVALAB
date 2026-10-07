import { useEffect, useState } from "react";

/** true quando a media query casa. No primeiro render (SSR/hidratação) retorna `initial`. */
export function useMediaQuery(query: string, initial = false): boolean {
  const [matches, setMatches] = useState(initial);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/** Breakpoint `lg` do Tailwind: layout desktop com Sidebar e SidePanel. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

/** Navegação do painel: barra inferior (mobile), trilho de ícones (tablet) ou sidebar completa. */
export type ShellMode = "bottom" | "rail" | "full";

export function useShellMode(): ShellMode {
  const short = useMediaQuery("(max-height: 499px)");
  const tablet = useMediaQuery("(min-width: 768px)");
  const wide = useMediaQuery("(min-width: 1024px)");
  if (short || !tablet) return "bottom";
  return wide ? "full" : "rail";
}

/** Detalhe da reserva: tela cheia (mobile), painel sobreposto (tablet/notebook) ou acoplado (>= 1280). */
export type DetailMode = "full" | "overlay" | "dock";

export function useDetailMode(): DetailMode {
  const short = useMediaQuery("(max-height: 499px)");
  const tablet = useMediaQuery("(min-width: 768px)");
  const xl = useMediaQuery("(min-width: 1280px)");
  if (short || !tablet) return "full";
  return xl ? "dock" : "overlay";
}
