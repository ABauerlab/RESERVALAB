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
