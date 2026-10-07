import { supabase } from "@/integrations/supabase/client";

/**
 * White-label por opt-in (F8). A empresa liga "usar minha marca" e, so entao, a cor e o logo
 * valem nas paginas publicas (reserva, cardapio, links). Desligado, tudo segue no visual Teggly.
 * O painel administrativo nunca muda de marca.
 */

export type Marca = { cor: string | null; logo_url: string | null };

export async function fetchMarca(slug: string): Promise<Marca | null> {
  const { data, error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: { _slug: string },
    ) => PromiseLike<{ data: Marca | null; error: { message: string } | null }>
  )("marca_do_tenant", { _slug: slug });
  if (error) throw new Error(error.message);
  return data ?? null;
}

const HEX = /^#[0-9a-f]{6}$/i;

export function corValida(cor: string | null | undefined): cor is string {
  return !!cor && HEX.test(cor.trim());
}

function rgb(cor: string): [number, number, number] {
  const n = parseInt(cor.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminancia(cor: string): number {
  const [r, g, b] = rgb(cor).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razao de contraste WCAG entre duas cores hex. */
export function contraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function escurecer(cor: string, fator: number): string {
  const [r, g, b] = rgb(cor).map((v) => Math.round(v * fator));
  return `#${[r, g, b].map((v) => v!.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Variaveis CSS que trocam a cor de acao das paginas publicas. Texto sobre a cor: branco ou
 * slate-900, o que tiver mais contraste. Cor invalida ou sem contraste minimo (3:1 com o fundo
 * claro da pagina) nao e aplicada: cai no azul Teggly.
 */
export function temaDaMarca(cor: string | null | undefined): Record<string, string> | null {
  if (!corValida(cor)) return null;
  const c = cor.trim().toLowerCase();
  if (contraste(c, "#f8fafc") < 3) return null;
  const sobre = contraste(c, "#ffffff") >= contraste(c, "#0f172a") ? "#ffffff" : "#0f172a";
  const hover = escurecer(c, 0.88);
  return {
    "--primary": c,
    "--primary-foreground": sobre,
    "--ring": c,
    "--color-blue-600": c,
    "--color-blue-700": hover,
  };
}
