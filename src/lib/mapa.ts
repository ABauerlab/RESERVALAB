/**
 * Mapa do Google no Link Hub. Aceita o codigo "Compartilhar > Incorporar um mapa" (o <iframe ...>)
 * ou so o endereco do `src`, e guarda SOMENTE a URL validada. Nenhum HTML arbitrario e salvo ou
 * renderizado: a pagina publica monta o proprio iframe a partir desta URL.
 * A mesma regra existe como CHECK no banco (tenant_perfil_hub_mapa_embed).
 */
const EMBED =
  /^https:\/\/www\.google\.com\/maps\/embed\?pb=[A-Za-z0-9%!._~:/?=&+,;()*@-]{10,2000}$/;

export type MapaResultado = { ok: true; url: string } | { ok: false; motivo: string };

export function urlDeMapaValida(url: string | null | undefined): url is string {
  return !!url && url.length <= 2100 && EMBED.test(url);
}

export function extrairMapaEmbed(entrada: string): MapaResultado {
  const texto = entrada.trim();
  if (!texto) return { ok: false, motivo: "Cole o código de incorporação do Google Maps." };

  let candidato = texto;
  if (texto.includes("<")) {
    const iframes = texto.match(/<iframe\b/gi) ?? [];
    if (iframes.length !== 1) {
      return { ok: false, motivo: "Cole apenas o código do mapa, um único <iframe>." };
    }
    const m = texto.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    if (!m) return { ok: false, motivo: "Não encontramos o endereço do mapa nesse código." };
    candidato = (m[1] ?? m[2] ?? "").trim();
  }
  // O Google escreve & como &amp; dentro do HTML.
  candidato = candidato.replace(/&amp;/g, "&");

  if (!urlDeMapaValida(candidato)) {
    return {
      ok: false,
      motivo:
        "Esse código não é de um mapa incorporado do Google Maps. Use Compartilhar > Incorporar um mapa.",
    };
  }
  return { ok: true, url: candidato };
}
