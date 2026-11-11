export type TrechoTexto = { texto: string; href?: string };

const URL_RE = /https?:\/\/[^\s<>"']+/g;

/** Quebra um texto em trechos, marcando as URLs http(s) para virarem link. Pontuação final fica fora do link. */
export function separarLinks(texto: string): TrechoTexto[] {
  const out: TrechoTexto[] = [];
  let fim = 0;
  for (const m of texto.matchAll(URL_RE)) {
    const inicio = m.index ?? 0;
    const url = m[0].replace(/[.,;:!?)\]]+$/, "");
    if (inicio > fim) out.push({ texto: texto.slice(fim, inicio) });
    out.push({ texto: url, href: url });
    fim = inicio + url.length;
  }
  if (fim < texto.length) out.push({ texto: texto.slice(fim) });
  return out;
}
